import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.db.session import SessionLocal, get_db
from app.engines.mosca_engine import compute_mosca
from app.models import Artefact, Scan, User
from app.schemas.api import ContextUpdate, ScanCreateResponse, ScanSummary
from app.services.storage import storage_service

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("", response_model=ScanCreateResponse, status_code=201)
async def create_scan(
    name: str = Form(...),
    target_type: str = Form("zip_archive"),
    file: UploadFile = File(...),
    data_lifetime_x: float = Form(10.0),
    migration_time_y: float = Form(4.0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    content = await file.read()
    if len(content) > settings.scan_max_bytes:
        raise HTTPException(status_code=400, detail="File too large")

    scan = Scan(
        name=name,
        target_type=target_type,
        status="queued",
        data_lifetime_x=data_lifetime_x,
        migration_time_y=migration_time_y,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    if settings.sync_scan:
        from pathlib import Path

        work_root = Path(settings.scan_work_dir) / str(scan.id)
        work_root.mkdir(parents=True, exist_ok=True)
        zip_path = work_root / "upload.zip"
        with open(zip_path, "wb") as f:
            f.write(content)
        scan.storage_path = str(zip_path)
        db.commit()
        from app.services.scan_service import run_scan_job

        run_scan_job(db, scan.id)
        db.refresh(scan)
    else:
        key = f"scans/raw/{scan.id}.zip"
        storage_service.upload_bytes(key, content, file.content_type or "application/zip")
        scan.storage_path = key
        db.commit()
        from app.workers.celery_app import run_crypto_scan

        run_crypto_scan.delay(str(scan.id))

    return ScanCreateResponse(
        scan_id=str(scan.id),
        name=scan.name,
        target_type=scan.target_type,
        status=scan.status,
        created_at=scan.created_at.isoformat() if scan.created_at else None,
    )


@router.get("")
def list_scans(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scans = db.query(Scan).order_by(Scan.created_at.desc()).all()
    return {
        "scans": [
            ScanSummary(
                scan_id=str(s.id),
                name=s.name,
                status=s.status,
                total_files=s.total_files,
                total_artefacts=s.total_artefacts,
                critical_risk_count=s.critical_risk_count,
                high_risk_count=s.high_risk_count,
                progress_percentage=s.progress_percentage,
                current_stage=s.current_stage,
                created_at=s.created_at.isoformat() if s.created_at else None,
            ).model_dump()
            for s in scans
        ]
    }


@router.get("/{scan_id}")
def get_scan(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == uuid.UUID(scan_id)).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {
        "scan_id": str(scan.id),
        "name": scan.name,
        "status": scan.status,
        "target_type": scan.target_type,
        "total_files": scan.total_files,
        "total_artefacts": scan.total_artefacts,
        "critical_risk_count": scan.critical_risk_count,
        "high_risk_count": scan.high_risk_count,
        "progress_percentage": scan.progress_percentage,
        "current_stage": scan.current_stage,
        "error_message": scan.error_message,
        "data_lifetime_x": scan.data_lifetime_x,
        "migration_time_y": scan.migration_time_y,
        "created_at": scan.created_at.isoformat() if scan.created_at else None,
        "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
    }


@router.put("/{scan_id}/context")
def update_context(scan_id: str, body: ContextUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == uuid.UUID(scan_id)).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(scan, field, value)
    db.commit()
    return {"ok": True}


@router.get("/{scan_id}/artefacts")
def list_artefacts(
    scan_id: str,
    asset_type: str | None = None,
    risk_band: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Artefact).filter(Artefact.scan_id == uuid.UUID(scan_id))
    if asset_type:
        q = q.filter(Artefact.asset_type == asset_type)
    if risk_band:
        q = q.filter(Artefact.risk_band == risk_band.upper())
    total = q.count()
    items = q.order_by(Artefact.final_risk_score.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "artefacts": [
            {
                "artefact_id": str(a.id),
                "name": a.name,
                "asset_type": a.asset_type,
                "algorithm": a.algorithm,
                "file_path": a.file_path,
                "line_number": a.line_number,
                "confidence": a.confidence,
                "evidence_snippet": a.evidence_snippet,
                "risk": {
                    "hndl_risk": a.hndl_risk,
                    "operational_risk": a.operational_risk,
                    "final_score": a.final_risk_score,
                    "risk_band": a.risk_band,
                },
                "recommendation": {
                    "action": a.recommendation_action,
                    "primary_pqc": a.primary_pqc,
                    "hybrid_pair": a.hybrid_pair,
                    "rationale": a.recommendation_rationale,
                    "effort": a.effort_level,
                    "nist_standard": a.nist_standard,
                    "timeline_urgency": a.timeline_urgency,
                },
            }
            for a in items
        ],
    }


@router.get("/{scan_id}/summary")
def scan_summary(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == uuid.UUID(scan_id)).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    artefacts = db.query(Artefact).filter(Artefact.scan_id == scan.id).all()
    bands = {}
    for a in artefacts:
        bands[a.risk_band] = bands.get(a.risk_band, 0) + 1
    return {
        "scan_id": str(scan.id),
        "name": scan.name,
        "status": scan.status,
        "total_artefacts": len(artefacts),
        "risk_distribution": bands,
        "critical_risk_count": scan.critical_risk_count,
        "high_risk_count": scan.high_risk_count,
    }


@router.get("/{scan_id}/mosca")
def scan_mosca(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == uuid.UUID(scan_id)).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    max_risk = db.query(Artefact.final_risk_score).filter(Artefact.scan_id == scan.id).order_by(Artefact.final_risk_score.desc()).first()
    fr = float(max_risk[0]) if max_risk and max_risk[0] else 0.0
    result = compute_mosca(scan.data_lifetime_x, scan.migration_time_y, fr)
    result["scan_id"] = str(scan.id)
    return result


@router.get("/{scan_id}/recommendations")
def scan_recommendations(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = (
        db.query(Artefact)
        .filter(Artefact.scan_id == uuid.UUID(scan_id))
        .order_by(Artefact.final_risk_score.desc())
        .all()
    )
    return {
        "recommendations": [
            {
                "artefact_id": str(a.id),
                "name": a.name,
                "risk_band": a.risk_band,
                "final_score": a.final_risk_score,
                "action": a.recommendation_action,
                "primary_pqc": a.primary_pqc,
                "hybrid_pair": a.hybrid_pair,
                "effort": a.effort_level,
                "rationale": a.recommendation_rationale,
                "nist_standard": a.nist_standard,
                "timeline_urgency": a.timeline_urgency,
            }
            for a in items
            if a.recommendation_action not in (None, "Keep", "Monitor")
        ],
    }


@router.websocket("/{scan_id}/progress")
async def scan_progress_ws(websocket: WebSocket, scan_id: str):
    await websocket.accept()
    import redis.asyncio as aioredis

    r = aioredis.from_url(settings.redis_url, decode_responses=True)
    pubsub = r.pubsub()
    channel = f"scan:{scan_id}:progress"
    await pubsub.subscribe(channel)

    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == uuid.UUID(scan_id)).first()
        if scan:
            await websocket.send_json(
                {
                    "scan_id": scan_id,
                    "status": scan.status,
                    "progress_percentage": scan.progress_percentage,
                    "current_stage": scan.current_stage,
                    "artefacts_found_so_far": scan.total_artefacts,
                }
            )
    finally:
        db.close()

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            await websocket.send_text(message["data"])
            data = json.loads(message["data"])
            if data.get("status") in ("completed", "failed"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await r.close()

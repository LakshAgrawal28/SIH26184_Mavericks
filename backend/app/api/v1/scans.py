import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user, get_scan_for_user, user_from_access_token
from app.db.session import SessionLocal, get_db
from app.engines.mosca_engine import compute_mosca, describe_transition
from app.engines.pqc_engine import recommend
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

    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    looks_like_tar = filename.endswith(".tar") or "x-tar" in content_type or content_type == "application/tar"
    if looks_like_tar and target_type == "zip_archive":
        target_type = "container_image"

    upload_basename = "upload.tar" if target_type == "container_image" else "upload.zip"
    storage_suffix = ".tar" if target_type == "container_image" else ".zip"

    scan = Scan(
        name=name,
        target_type=target_type,
        status="queued",
        owner_id=user.id,
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
        upload_path = work_root / upload_basename
        with open(upload_path, "wb") as f:
            f.write(content)
        scan.storage_path = str(upload_path)
        db.commit()
        from app.services.scan_service import run_scan_job

        run_scan_job(db, scan.id)
        db.refresh(scan)
    else:
        key = f"scans/raw/{scan.id}{storage_suffix}"
        storage_service.upload_bytes(
            key,
            content,
            file.content_type or ("application/x-tar" if target_type == "container_image" else "application/zip"),
        )
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
    query = db.query(Scan)
    if user.role != "admin":
        query = query.filter(Scan.owner_id == user.id)
    scans = query.order_by(Scan.created_at.desc()).all()
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
    scan = get_scan_for_user(db, scan_id, user)
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
    scan = get_scan_for_user(db, scan_id, user)
    previous = compute_mosca(scan.data_lifetime_x, scan.migration_time_y, _max_risk(db, scan.id))
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(scan, field, value)
    db.commit()
    db.refresh(scan)
    current = compute_mosca(scan.data_lifetime_x, scan.migration_time_y, _max_risk(db, scan.id))
    current["scan_id"] = str(scan.id)
    current["transition"] = describe_transition(previous["baseline_category"], current["baseline_category"])
    current["saved"] = True
    return {"ok": True, "mosca": current}


@router.get("/{scan_id}/artefacts")
def list_artefacts(
    scan_id: str,
    asset_type: str | None = None,
    risk_band: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = get_scan_for_user(db, scan_id, user)
    q = db.query(Artefact).filter(Artefact.scan_id == scan.id)
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
                "detection_method": a.detection_method,
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
    scan = get_scan_for_user(db, scan_id, user)
    artefacts = db.query(Artefact).filter(Artefact.scan_id == scan.id).all()
    bands: dict[str, int] = {}
    methods: dict[str, int] = {}
    for a in artefacts:
        bands[a.risk_band] = bands.get(a.risk_band, 0) + 1
        methods[a.detection_method] = methods.get(a.detection_method, 0) + 1
    layers = sorted(
        {
            "semgrep" if (m or "").startswith("semgrep") else
            "catalog" if m in ("catalog-api", "filename-hint") else
            "certificate" if m in ("x509-parser", "pem-marker") else
            "binary" if (m or "").startswith("binary") else
            "config" if m == "config-scanner" else
            "manifest" if (m or "").startswith("manifest") or m == "package-json" else
            "source"
            for m in methods
        }
    )
    return {
        "scan_id": str(scan.id),
        "name": scan.name,
        "status": scan.status,
        "total_artefacts": len(artefacts),
        "risk_distribution": bands,
        "detection_methods": methods,
        "layers_present": layers,
        "critical_risk_count": scan.critical_risk_count,
        "high_risk_count": scan.high_risk_count,
    }


def _artefact_brief(a: Artefact) -> dict:
    return {
        "artefact_id": str(a.id),
        "bom_ref": a.bom_ref,
        "name": a.name,
        "asset_type": a.asset_type,
        "risk_band": a.risk_band,
        "file_path": a.file_path,
        "final_risk_score": a.final_risk_score,
    }


@router.get("/{scan_id}/diff")
def scan_diff(
    scan_id: str,
    against: str = Query(..., description="Baseline scan ID to compare against"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    current = get_scan_for_user(db, scan_id, user)
    baseline = get_scan_for_user(db, against, user)

    current_by_ref = {a.bom_ref: a for a in db.query(Artefact).filter(Artefact.scan_id == current.id).all()}
    baseline_by_ref = {a.bom_ref: a for a in db.query(Artefact).filter(Artefact.scan_id == baseline.id).all()}

    added_refs = set(current_by_ref) - set(baseline_by_ref)
    removed_refs = set(baseline_by_ref) - set(current_by_ref)
    risk_band_changed = []
    for ref in set(current_by_ref) & set(baseline_by_ref):
        cur = current_by_ref[ref]
        base = baseline_by_ref[ref]
        if cur.risk_band != base.risk_band:
            risk_band_changed.append(
                {
                    **_artefact_brief(cur),
                    "previous_risk_band": base.risk_band,
                    "previous_final_risk_score": base.final_risk_score,
                }
            )

    before_mosca = compute_mosca(baseline.data_lifetime_x, baseline.migration_time_y, _max_risk(db, baseline.id))
    after_mosca = compute_mosca(current.data_lifetime_x, current.migration_time_y, _max_risk(db, current.id))

    return {
        "scan_id": str(current.id),
        "against_scan_id": str(baseline.id),
        "added": [_artefact_brief(current_by_ref[r]) for r in sorted(added_refs)],
        "removed": [_artefact_brief(baseline_by_ref[r]) for r in sorted(removed_refs)],
        "risk_band_changed": risk_band_changed,
        "counts": {
            "added": len(added_refs),
            "removed": len(removed_refs),
            "risk_band_changed": len(risk_band_changed),
            "critical_before": baseline.critical_risk_count,
            "critical_after": current.critical_risk_count,
            "high_before": baseline.high_risk_count,
            "high_after": current.high_risk_count,
        },
        "mosca": {
            "before": {
                "baseline_category": before_mosca["baseline_category"],
                "overall_category": before_mosca["overall_category"],
            },
            "after": {
                "baseline_category": after_mosca["baseline_category"],
                "overall_category": after_mosca["overall_category"],
            },
            "transition": describe_transition(
                before_mosca["baseline_category"],
                after_mosca["baseline_category"],
            ),
        },
    }


def _max_risk(db: Session, scan_id) -> float:
    max_risk = (
        db.query(Artefact.final_risk_score)
        .filter(Artefact.scan_id == scan_id)
        .order_by(Artefact.final_risk_score.desc())
        .first()
    )
    return float(max_risk[0]) if max_risk and max_risk[0] else 0.0


@router.get("/{scan_id}/mosca")
def scan_mosca(
    scan_id: str,
    x: float | None = Query(default=None, ge=1, le=50),
    y: float | None = Query(default=None, ge=1, le=30),
    z: float | None = Query(default=None, ge=1, le=40),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = get_scan_for_user(db, scan_id, user)
    fr = _max_risk(db, scan.id)
    saved = compute_mosca(scan.data_lifetime_x, scan.migration_time_y, fr)
    use_x = scan.data_lifetime_x if x is None else x
    use_y = scan.migration_time_y if y is None else y
    result = compute_mosca(use_x, use_y, fr, extra_z=z)
    result["scan_id"] = str(scan.id)
    result["live"] = x is not None or y is not None or z is not None
    result["saved_parameters"] = {
        "data_lifetime_x": scan.data_lifetime_x,
        "migration_time_y": scan.migration_time_y,
    }
    result["transition"] = describe_transition(saved["baseline_category"], result["baseline_category"])
    return result


@router.get("/{scan_id}/recommendations")
def scan_recommendations(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan = get_scan_for_user(db, scan_id, user)
    items = (
        db.query(Artefact)
        .filter(Artefact.scan_id == scan.id)
        .order_by(Artefact.final_risk_score.desc())
        .all()
    )
    recommendations = []
    seen: set[tuple[str, str | None, str | None]] = set()
    dirty = False
    for a in items:
        action, primary, hybrid, rationale, effort, nist_std, urgency = recommend(
            a.algorithm or a.library_name or a.name,
            a.risk_band or "LOW",
            primitive=a.primitive,
        )
        if (
            a.recommendation_action != action
            or a.primary_pqc != primary
            or a.hybrid_pair != hybrid
        ):
            a.recommendation_action = action
            a.primary_pqc = primary
            a.hybrid_pair = hybrid
            a.recommendation_rationale = rationale
            a.effort_level = effort
            a.nist_standard = nist_std
            a.timeline_urgency = urgency
            dirty = True
        if action in (None, "Keep"):
            continue
        if action == "Monitor" and not primary:
            continue
        family = (a.library_name or a.algorithm or a.name or "").split("@")[0].lower()
        key = (family, action, primary)
        if key in seen:
            continue
        seen.add(key)
        recommendations.append(
            {
                "artefact_id": str(a.id),
                "name": a.name,
                "risk_band": a.risk_band,
                "final_score": a.final_risk_score,
                "action": action,
                "primary_pqc": primary,
                "hybrid_pair": hybrid,
                "effort": effort,
                "rationale": rationale,
                "nist_standard": nist_std,
                "timeline_urgency": urgency,
            }
        )
    if dirty:
        db.commit()
    return {"recommendations": recommendations, "count": len(recommendations)}


@router.websocket("/{scan_id}/progress")
async def scan_progress_ws(
    websocket: WebSocket,
    scan_id: str,
    token: str | None = Query(default=None),
):
    """Push scan status. Uses Redis when available; otherwise polls the database (local SYNC_SCAN)."""
    if not token:
        await websocket.close(code=1008, reason="Not authenticated")
        return
    db = SessionLocal()
    try:
        try:
            user = user_from_access_token(token, db)
        except HTTPException:
            await websocket.close(code=1008, reason="Not authenticated")
            return
        owned = (
            db.query(Scan)
            .filter(Scan.id == uuid.UUID(scan_id), Scan.owner_id == user.id)
            .first()
        )
        if not owned:
            await websocket.close(code=1008, reason="Scan not found")
            return
    finally:
        db.close()

    await websocket.accept()
    import asyncio

    def snapshot() -> dict | None:
        db = SessionLocal()
        try:
            scan = (
                db.query(Scan)
                .filter(Scan.id == uuid.UUID(scan_id), Scan.owner_id == user.id)
                .first()
            )
            if not scan:
                return None
            return {
                "scan_id": scan_id,
                "status": scan.status,
                "progress_percentage": scan.progress_percentage,
                "current_stage": scan.current_stage,
                "total_artefacts": scan.total_artefacts,
                "total_files": scan.total_files,
                "artefacts_found_so_far": scan.total_artefacts,
                "critical_risk_count": scan.critical_risk_count,
                "high_risk_count": scan.high_risk_count,
                "error_message": scan.error_message,
            }
        finally:
            db.close()

    data = snapshot()
    if data:
        await websocket.send_json(data)
        if data["status"] in ("completed", "failed"):
            return

    subscribed = False
    r = None
    pubsub = None
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=0.4,
        )
        pubsub = r.pubsub()
        await pubsub.subscribe(f"scan:{scan_id}:progress")
        subscribed = True
    except Exception:
        subscribed = False

    try:
        if subscribed and pubsub is not None:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                await websocket.send_text(message["data"])
                payload = json.loads(message["data"])
                if payload.get("status") in ("completed", "failed"):
                    break
        else:
            while True:
                await asyncio.sleep(0.5)
                data = snapshot()
                if not data:
                    break
                await websocket.send_json(data)
                if data["status"] in ("completed", "failed"):
                    break
    except WebSocketDisconnect:
        pass
    finally:
        if pubsub is not None:
            try:
                await pubsub.unsubscribe(f"scan:{scan_id}:progress")
            except Exception:
                pass
        if r is not None:
            try:
                await r.close()
            except Exception:
                pass

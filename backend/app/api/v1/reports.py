import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.cbom.builder import build_cbom, build_pdf_summary
from app.cbom.validator import validate_cbom
from app.sarif.builder import build_sarif
from app.config import settings
from app.core.deps import get_current_user, get_scan_for_user
from app.db.session import get_db
from app.engines.mosca_engine import compute_mosca
from app.models import Artefact, Report, Scan, User
from app.services.storage import storage_service

router = APIRouter(prefix="/scans", tags=["reports"])


def _scan_artefacts(db: Session, scan_id: str, user: User) -> tuple[Scan, list[Artefact]]:
    scan = get_scan_for_user(db, scan_id, user)
    artefacts = db.query(Artefact).filter(Artefact.scan_id == scan.id).all()
    return scan, artefacts


@router.post("/{scan_id}/reports/cbom")
def export_cbom(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan, artefacts = _scan_artefacts(db, scan_id, user)
    try:
        cbom = build_cbom(scan, artefacts, validate=True)
        valid = "true"
    except ValueError as exc:
        cbom = build_cbom(scan, artefacts, validate=False)
        result = validate_cbom(cbom)
        raise HTTPException(
            status_code=422,
            detail={"message": str(exc), "validation": result},
        ) from exc
    key = f"reports/{scan.id}/cbom.json"
    if not settings.sync_scan:
        storage_service.upload_json(key, cbom)
    db.add(Report(scan_id=scan.id, format="cyclonedx", storage_path=key))
    db.commit()
    return Response(
        content=json.dumps(cbom, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="ecdat-cbom-{scan_id}.json"',
            "X-CycloneDX-Spec": "1.6",
            "X-CycloneDX-Valid": valid,
        },
    )


@router.get("/{scan_id}/reports/cbom/validate")
def validate_cbom_export(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan, artefacts = _scan_artefacts(db, scan_id, user)
    cbom = build_cbom(scan, artefacts, validate=False)
    result = validate_cbom(cbom)
    result["component_count"] = len(cbom.get("components") or [])
    result["spec_version"] = cbom.get("specVersion")
    return result


@router.post("/{scan_id}/reports/sarif")
def export_sarif(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan, artefacts = _scan_artefacts(db, scan_id, user)
    sarif = build_sarif(scan, artefacts)
    key = f"reports/{scan.id}/results.sarif.json"
    if not settings.sync_scan:
        storage_service.upload_json(key, sarif)
    db.add(Report(scan_id=scan.id, format="sarif", storage_path=key))
    db.commit()
    return Response(
        content=json.dumps(sarif, indent=2),
        media_type="application/sarif+json",
        headers={"Content-Disposition": f'attachment; filename="ecdat-sarif-{scan_id}.sarif.json"'},
    )


@router.post("/{scan_id}/reports/pdf")
def export_pdf(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan, artefacts = _scan_artefacts(db, scan_id, user)
    max_risk = max((a.final_risk_score for a in artefacts), default=0.0)
    mosca = compute_mosca(scan.data_lifetime_x, scan.migration_time_y, max_risk)
    pdf = build_pdf_summary(scan, artefacts, mosca)
    key = f"reports/{scan.id}/summary.pdf"
    if not settings.sync_scan:
        storage_service.upload_bytes(key, pdf, "application/pdf")
    db.add(Report(scan_id=scan.id, format="pdf", storage_path=key))
    db.commit()
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="ecdat-report-{scan_id}.pdf"'},
    )


import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.cbom.builder import build_cbom, build_pdf_summary
from app.core.deps import get_current_user
from app.db.session import get_db
from app.engines.mosca_engine import compute_mosca
from app.models import Artefact, Report, Scan, User
from app.services.storage import storage_service

router = APIRouter(prefix="/scans", tags=["reports"])


@router.post("/{scan_id}/reports/cbom")
def export_cbom(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == uuid.UUID(scan_id)).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    artefacts = db.query(Artefact).filter(Artefact.scan_id == scan.id).all()
    cbom = build_cbom(scan, artefacts)
    key = f"reports/{scan.id}/cbom.json"
    storage_service.upload_json(key, cbom)
    db.add(Report(scan_id=scan.id, format="cyclonedx", storage_path=key))
    db.commit()
    return Response(
        content=__import__("json").dumps(cbom, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="ecdat-cbom-{scan_id}.json"'},
    )


@router.post("/{scan_id}/reports/pdf")
def export_pdf(scan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == uuid.UUID(scan_id)).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    artefacts = db.query(Artefact).filter(Artefact.scan_id == scan.id).all()
    max_risk = max((a.final_risk_score for a in artefacts), default=0.0)
    mosca = compute_mosca(scan.data_lifetime_x, scan.migration_time_y, max_risk)
    pdf = build_pdf_summary(scan, artefacts, mosca)
    key = f"reports/{scan.id}/summary.pdf"
    storage_service.upload_bytes(key, pdf, "application/pdf")
    db.add(Report(scan_id=scan.id, format="pdf", storage_path=key))
    db.commit()
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="ecdat-report-{scan_id}.pdf"'},
    )

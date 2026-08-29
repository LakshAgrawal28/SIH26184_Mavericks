import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.engines.mosca_engine import compute_mosca
from app.engines.pqc_engine import recommend
from app.engines.risk_engine import compute_risk
from app.models import Artefact, Scan
from app.services.storage import storage_service
from scanner.detectors.pipeline import finding_to_bom_ref, run_all_detectors, safe_extract_zip

_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        import redis

        _redis_client = redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1)
    return _redis_client


def publish_progress(scan_id: str, payload: dict) -> None:
    try:
        _get_redis().publish(f"scan:{scan_id}:progress", json.dumps(payload))
    except Exception:
        pass


def run_scan_job(db: Session, scan_id: uuid.UUID) -> None:
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        return

    work_root = Path(settings.scan_work_dir) / str(scan_id)
    work_root.mkdir(parents=True, exist_ok=True)
    zip_path = work_root / "upload.zip"
    extract_path = work_root / "src"

    try:
        scan.status = "running"
        scan.current_stage = "Downloading archive"
        scan.progress_percentage = 5
        db.commit()
        publish_progress(str(scan_id), {"status": "running", "progress_percentage": 5, "current_stage": scan.current_stage})

        if scan.storage_path:
            if scan.storage_path.startswith("scans/"):
                storage_service.download_to_file(scan.storage_path, str(zip_path))
            else:
                import shutil

                src = Path(scan.storage_path)
                if src.resolve() != zip_path.resolve():
                    shutil.copy2(scan.storage_path, zip_path)

        scan.current_stage = "Extracting files"
        scan.progress_percentage = 15
        db.commit()
        publish_progress(str(scan_id), {"status": "running", "progress_percentage": 15, "current_stage": scan.current_stage})

        file_count = safe_extract_zip(zip_path, extract_path)
        scan.total_files = file_count

        scan.current_stage = "Running cryptographic detectors"
        scan.progress_percentage = 40
        db.commit()
        publish_progress(str(scan_id), {"status": "running", "progress_percentage": 40, "current_stage": scan.current_stage})

        findings = run_all_detectors(extract_path)

        scan.current_stage = "Analyzing risk and generating recommendations"
        scan.progress_percentage = 70
        db.commit()

        db.query(Artefact).filter(Artefact.scan_id == scan.id).delete()

        critical = high = 0
        for f in findings:
            hndl, op, final, band = compute_risk(
                algorithm=f.algorithm or f.name,
                mode=f.mode,
                sensitivity=scan.sensitivity_score,
                lifetime_years=scan.data_lifetime_x,
                exposure=scan.exposure_score,
                criticality=scan.business_criticality,
                confidence=f.confidence,
                asset_type=f.asset_type,
            )
            action, primary, hybrid, rationale, effort = recommend(f.algorithm or f.name, band)

            if band == "CRITICAL":
                critical += 1
            elif band == "HIGH":
                high += 1

            art = Artefact(
                scan_id=scan.id,
                bom_ref=finding_to_bom_ref(f),
                name=f.name,
                asset_type=f.asset_type,
                algorithm=f.algorithm,
                primitive=f.primitive,
                key_size=f.key_size,
                mode=f.mode,
                library_name=f.library_name,
                library_version=f.library_version,
                file_path=f.file_path,
                line_number=f.line_number,
                detection_method=f.detection_method,
                confidence=f.confidence,
                evidence_snippet=f.evidence_snippet,
                raw_metadata=f.raw_metadata or None,
                hndl_risk=hndl,
                operational_risk=op,
                final_risk_score=final,
                risk_band=band,
                recommendation_action=action,
                primary_pqc=primary,
                hybrid_pair=hybrid,
                recommendation_rationale=rationale,
                effort_level=effort,
            )
            db.add(art)

        scan.total_artefacts = len(findings)
        scan.critical_risk_count = critical
        scan.high_risk_count = high
        scan.status = "completed"
        scan.progress_percentage = 100
        scan.current_stage = "Completed"
        scan.completed_at = datetime.now(timezone.utc)
        db.commit()

        publish_progress(
            str(scan_id),
            {
                "status": "completed",
                "progress_percentage": 100,
                "current_stage": "Completed",
                "artefacts_found_so_far": len(findings),
            },
        )
    except Exception as exc:
        scan.status = "failed"
        scan.error_message = str(exc)[:2000]
        scan.current_stage = "Failed"
        db.commit()
        publish_progress(str(scan_id), {"status": "failed", "error": scan.error_message})
    finally:
        import shutil
        if work_root.exists():
            shutil.rmtree(work_root, ignore_errors=True)

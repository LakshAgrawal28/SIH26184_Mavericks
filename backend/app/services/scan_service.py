import inspect
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.core.redact import redact_evidence_snippet
from app.engines.pqc_engine import recommend
from app.engines.risk_engine import compute_risk
from app.engines.taxonomy import canonicalize_algorithm
from app.models import Artefact, Scan
from app.services.storage import storage_service
from scanner.detectors.pipeline import (
    DecompressBudget,
    coverage_stats,
    finding_to_bom_ref,
    prepare_scan_tree,
)

QUANTUM_CLASSES = ("shor", "grover", "broken_classical", "none", "inspect", "unknown")

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


def _set_scan_progress(scan: Scan, db: Session, scan_id: uuid.UUID, pct: int, stage: str) -> None:
    scan.current_stage = stage
    scan.progress_percentage = min(100, max(0, int(pct)))
    db.commit()
    publish_progress(
        str(scan_id),
        {
            "status": scan.status,
            "progress_percentage": scan.progress_percentage,
            "current_stage": stage,
            "total_artefacts": scan.total_artefacts or 0,
            "total_files": scan.total_files or 0,
            "artefacts_found_so_far": scan.total_artefacts or 0,
            "critical_risk_count": scan.critical_risk_count or 0,
            "high_risk_count": scan.high_risk_count or 0,
        },
    )


def _run_detectors_with_progress(extract_path: Path, scan: Scan, db: Session, scan_id: uuid.UUID):
    from scanner.detectors.binary_detector import detect_binary
    from scanner.detectors.catalog_detector import detect_catalog
    from scanner.detectors.cert_detector import detect_certificates, detect_configs
    from scanner.detectors.cloud_hsm_detector import detect_cloud_hsm
    from scanner.detectors.pipeline import normalize_findings
    from scanner.detectors.sbom_detector import detect_sbom
    from scanner.detectors.semgrep_detector import detect_semgrep
    from scanner.detectors.source_detector import detect_manifests, detect_source

    steps: list[tuple[int, str, object]] = [
        (32, "Detecting — Semgrep rules", detect_semgrep),
        (38, "Detecting — crypto API catalog", detect_catalog),
        (44, "Detecting — source patterns", detect_source),
        (50, "Detecting — package manifests", detect_manifests),
        (56, "Detecting — certificates and configs", detect_certificates),
        (58, "Detecting — configuration files", detect_configs),
        (62, "Detecting — binaries and TLS", detect_binary),
        (64, "Detecting — cloud HSM references", detect_cloud_hsm),
        (66, "Detecting — SBOM and lockfiles", detect_sbom),
    ]
    findings: list = []
    for pct, stage, detector in steps:
        _set_scan_progress(scan, db, scan_id, pct, stage)
        findings.extend(detector(extract_path))
    return normalize_findings(findings)


def run_scan_job(db: Session, scan_id: uuid.UUID) -> None:
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        return

    work_root = Path(settings.scan_work_dir) / str(scan_id)
    work_root.mkdir(parents=True, exist_ok=True)
    if scan.target_type == "container_image" or (scan.storage_path or "").endswith(".tar"):
        upload_path = work_root / "upload.tar"
    else:
        upload_path = work_root / "upload.zip"
    extract_path = work_root / "src"

    try:
        scan.status = "running"
        _set_scan_progress(scan, db, scan_id, 5, "Downloading archive")

        if scan.storage_path:
            if scan.storage_path.startswith("scans/"):
                storage_service.download_to_file(scan.storage_path, str(upload_path))
            else:
                import shutil

                src = Path(scan.storage_path)
                if src.resolve() != upload_path.resolve():
                    shutil.copy2(scan.storage_path, upload_path)

        _set_scan_progress(scan, db, scan_id, 15, "Extracting files")

        decompress_budget = DecompressBudget(max_bytes=settings.scan_max_bytes * 2)
        file_count = prepare_scan_tree(
            upload_path,
            extract_path,
            scan.target_type or "zip_archive",
            budget=decompress_budget,
        )
        scan.total_files = file_count
        stats = coverage_stats(extract_path)

        _set_scan_progress(
            scan,
            db,
            scan_id,
            28,
            (
                f"Indexing artefacts — {stats['first_party_files']} first-party files "
                f"({stats['skipped_vendor_files']} vendor skipped)"
            ),
        )

        findings = _run_detectors_with_progress(extract_path, scan, db, scan_id)

        _set_scan_progress(scan, db, scan_id, 68, "Scoring risk and recommendations")

        db.query(Artefact).filter(Artefact.scan_id == scan.id).delete()

        critical = high = 0
        cert_days_left: list[float] = []
        total_findings = len(findings)
        for idx, f in enumerate(findings):
            cert_expiry_days = None
            if f.asset_type == "certificate" and isinstance(f.raw_metadata, dict):
                cert_expiry_days = f.raw_metadata.get("days_to_expiry")
                days_num = _as_float(cert_expiry_days)
                if days_num is not None:
                    cert_days_left.append(days_num)

            algo_input = f.algorithm or f.library_name or f.name
            _, algo_mapped = canonicalize_algorithm(algo_input)
            raw_metadata = dict(f.raw_metadata) if isinstance(f.raw_metadata, dict) else {}
            if not algo_mapped and algo_input:
                raw_metadata["unmapped"] = True
                raw_metadata.setdefault("raw_algorithm", algo_input)

            hndl, op, final, band, risk_extra = _score_finding(
                algorithm=f.algorithm or f.name,
                mode=f.mode,
                sensitivity=scan.sensitivity_score,
                lifetime_years=scan.data_lifetime_x,
                exposure=scan.exposure_score,
                criticality=scan.business_criticality,
                confidence=f.confidence,
                asset_type=f.asset_type,
                cert_expiry_days=cert_expiry_days,
                primitive=f.primitive,
            )
            _enrich_raw_metadata(
                raw_metadata,
                algorithm=algo_input,
                primitive=f.primitive,
                asset_type=f.asset_type,
                extra=risk_extra,
            )

            action, primary, hybrid, rationale, effort, nist_std, urgency = recommend(
                algo_input, band, primitive=f.primitive, asset_type=f.asset_type
            )

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
                evidence_snippet=redact_evidence_snippet(f.evidence_snippet),
                raw_metadata=raw_metadata or None,
                hndl_risk=hndl,
                operational_risk=op,
                final_risk_score=final,
                risk_band=band,
                recommendation_action=action,
                primary_pqc=primary,
                hybrid_pair=hybrid,
                recommendation_rationale=rationale,
                effort_level=effort,
                nist_standard=nist_std,
                timeline_urgency=urgency,
            )
            db.add(art)

            if total_findings and (idx == 0 or (idx + 1) % max(1, total_findings // 8) == 0 or idx + 1 == total_findings):
                scored_pct = 68 + int(27 * (idx + 1) / total_findings)
                _set_scan_progress(
                    scan,
                    db,
                    scan_id,
                    scored_pct,
                    f"Scoring artefacts ({idx + 1}/{total_findings})",
                )

        if cert_days_left:
            max_days = max(cert_days_left)
            suggested = max(1, round(max(max_days, 0) / 365, 2))
            if hasattr(scan, "suggested_data_lifetime_x"):
                scan.suggested_data_lifetime_x = suggested

        scan.total_artefacts = len(findings)
        scan.critical_risk_count = critical
        scan.high_risk_count = high
        scan.status = "completed"
        scan.progress_percentage = 100
        if findings:
            scan.current_stage = (
                f"Completed — {len(findings)} artefacts in {file_count} files "
                f"({stats['first_party_files']} first-party)"
            )
        else:
            scan.current_stage = (
                f"Completed — no crypto in {stats['first_party_files']} first-party files "
                f"({file_count} unpacked, {stats['skipped_vendor_files']} vendor skipped). "
                "Catalog covers JCA/JCE, hashlib, Node crypto, Go tls, OpenSSL, certs, lockfiles, keystores."
            )
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
        publish_progress(
            str(scan_id),
            {
                "status": "failed",
                "error_message": scan.error_message,
                "current_stage": "Failed",
                "progress_percentage": scan.progress_percentage,
            },
        )
    finally:
        import shutil
        if work_root.exists():
            shutil.rmtree(work_root, ignore_errors=True)


PUBLIC_METADATA_KEYS = (
    "quantum_break",
    "qv",
    "use_case",
    "unmapped",
    "jwt_alg",
    "cloud_provider",
    "purl",
    "days_to_expiry",
)


def _as_float(value) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _call_supported(fn, **kwargs):
    try:
        params = inspect.signature(fn).parameters
        if any(p.kind == inspect.Parameter.VAR_KEYWORD for p in params.values()):
            return fn(**kwargs)
        return fn(**{k: v for k, v in kwargs.items() if k in params})
    except (TypeError, ValueError):
        try:
            return fn(**kwargs)
        except TypeError:
            kwargs.pop("primitive", None)
            return fn(**kwargs)


def _score_finding(**kwargs) -> tuple[float, float, float, str, dict]:
    extra: dict = {}
    try:
        import app.engines.risk_engine as risk_engine

        fn = getattr(risk_engine, "compute_risk_detail", None) or compute_risk
    except Exception:
        fn = compute_risk
    try:
        result = _call_supported(fn, **kwargs)
    except Exception:
        result = compute_risk(
            algorithm=kwargs.get("algorithm"),
            mode=kwargs.get("mode"),
            sensitivity=kwargs.get("sensitivity"),
            lifetime_years=kwargs.get("lifetime_years"),
            exposure=kwargs.get("exposure"),
            criticality=kwargs.get("criticality"),
            confidence=kwargs.get("confidence", 1.0),
            asset_type=kwargs.get("asset_type", "algorithm"),
            cert_expiry_days=kwargs.get("cert_expiry_days"),
        )
    if isinstance(result, dict):
        hndl = float(result.get("hndl_risk", result.get("hndl", 0)) or 0)
        op = float(result.get("operational_risk", result.get("operational", 0)) or 0)
        final = float(result.get("final_risk_score", result.get("final", 0)) or 0)
        band = str(result.get("risk_band", result.get("band", "LOW")))
        for key in ("quantum_break", "qv", "use_case"):
            if key in result and result[key] is not None:
                extra[key] = result[key]
        return hndl, op, final, band, extra
    hndl, op, final, band = result[:4]
    return float(hndl), float(op), float(final), str(band), extra


def _taxonomy_call(name: str, *args, **kwargs):
    try:
        import app.engines.taxonomy as taxonomy

        fn = getattr(taxonomy, name, None)
        if fn is None:
            return None
        return _call_supported(fn, **kwargs) if kwargs else fn(*args)
    except Exception:
        return None


def normalize_quantum_break(value) -> str:
    if value is None:
        return "unknown"
    raw = str(value).strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "shor": "shor",
        "shor_vulnerable": "shor",
        "grover": "grover",
        "broken_classical": "broken_classical",
        "broken": "broken_classical",
        "classical": "broken_classical",
        "none": "none",
        "pqc": "none",
        "pqc_safe": "none",
        "inspect": "inspect",
        "unknown": "unknown",
    }
    mapped = aliases.get(raw, raw)
    return mapped if mapped in QUANTUM_CLASSES else "unknown"


def _fallback_quantum_break(algorithm: str | None, raw_metadata: dict, qv: float | None) -> str:
    if raw_metadata.get("unmapped"):
        return "inspect"
    if qv is None:
        return "unknown"
    try:
        from app.engines.taxonomy import get_classical_weakness

        classical = get_classical_weakness(algorithm or "", None)
    except Exception:
        classical = 0.0
    if qv == 0.0:
        return "none"
    if classical >= 8:
        return "broken_classical"
    if qv >= 8:
        return "shor"
    if qv <= 4:
        return "grover"
    return "unknown"


def _enrich_raw_metadata(
    raw_metadata: dict,
    *,
    algorithm: str | None,
    primitive: str | None,
    asset_type: str | None,
    extra: dict | None = None,
) -> dict:
    extra = extra or {}
    qv = extra.get("qv")
    if qv is None:
        qv = _taxonomy_call("get_qv", algorithm=algorithm, primitive=primitive)
        if qv is None:
            try:
                from app.engines.taxonomy import get_qv

                qv = get_qv(algorithm)
            except Exception:
                qv = None
    if qv is not None:
        try:
            raw_metadata["qv"] = float(qv)
            qv = float(qv)
        except (TypeError, ValueError):
            pass

    qb = extra.get("quantum_break") or _taxonomy_call(
        "get_quantum_break", algorithm=algorithm, primitive=primitive
    )
    if not qb:
        qb = _fallback_quantum_break(algorithm, raw_metadata, qv if isinstance(qv, (int, float)) else None)
    raw_metadata["quantum_break"] = normalize_quantum_break(qb)

    use_case = extra.get("use_case") or _taxonomy_call(
        "classify_use_case",
        algorithm=algorithm,
        primitive=primitive,
        asset_type=asset_type,
    )
    if not use_case:
        use_case = primitive or asset_type
    if use_case:
        raw_metadata["use_case"] = str(use_case)
    return raw_metadata


def public_artefact_metadata(raw_metadata) -> dict:
    if not isinstance(raw_metadata, dict):
        return {}
    return {k: raw_metadata[k] for k in PUBLIC_METADATA_KEYS if k in raw_metadata}


def artefact_quantum_break(artefact: Artefact) -> str | None:
    meta = artefact.raw_metadata if isinstance(artefact.raw_metadata, dict) else {}
    if "quantum_break" in meta:
        return normalize_quantum_break(meta.get("quantum_break"))
    return None

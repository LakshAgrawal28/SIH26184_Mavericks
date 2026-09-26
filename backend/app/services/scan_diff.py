"""Deterministic scan-to-scan diff (shared by REST and AI narration)."""

from sqlalchemy.orm import Session

from app.engines.mosca_engine import compute_mosca, describe_transition
from app.models import Artefact, Scan


def artefact_brief(a: Artefact) -> dict:
    return {
        "artefact_id": str(a.id),
        "bom_ref": a.bom_ref,
        "name": a.name,
        "asset_type": a.asset_type,
        "risk_band": a.risk_band,
        "file_path": a.file_path,
        "final_risk_score": a.final_risk_score,
    }


def max_risk_score(db: Session, scan_id) -> float:
    max_risk = (
        db.query(Artefact.final_risk_score)
        .filter(Artefact.scan_id == scan_id)
        .order_by(Artefact.final_risk_score.desc())
        .first()
    )
    return float(max_risk[0]) if max_risk and max_risk[0] else 0.0


def compute_scan_diff(db: Session, current: Scan, baseline: Scan) -> dict:
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
                    **artefact_brief(cur),
                    "previous_risk_band": base.risk_band,
                    "previous_final_risk_score": base.final_risk_score,
                }
            )

    before_mosca = compute_mosca(baseline.data_lifetime_x, baseline.migration_time_y, max_risk_score(db, baseline.id))
    after_mosca = compute_mosca(current.data_lifetime_x, current.migration_time_y, max_risk_score(db, current.id))

    return {
        "scan_id": str(current.id),
        "against_scan_id": str(baseline.id),
        "added": [artefact_brief(current_by_ref[r]) for r in sorted(added_refs)],
        "removed": [artefact_brief(baseline_by_ref[r]) for r in sorted(removed_refs)],
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

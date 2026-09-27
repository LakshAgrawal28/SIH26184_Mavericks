"""Deterministic scan-to-scan diff (shared by REST and AI narration)."""

from collections import defaultdict
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


def validate_scan_comparison(current: Scan, baseline: Scan) -> None:
    """Validate a baseline before it is used by REST or AI comparisons."""
    if current.id == baseline.id:
        raise ValueError("A scan cannot be compared with itself")
    if current.status != "completed" or baseline.status != "completed":
        raise ValueError("Both scans must be completed before comparison")
    current_created = current.created_at
    baseline_created = baseline.created_at
    if current_created and baseline_created and baseline_created > current_created:
        raise ValueError("Baseline scan must not be newer than the current scan")


def _artefacts_by_ref(db: Session, scan_id) -> tuple[dict[str, Artefact], list[dict]]:
    grouped: dict[str, list[Artefact]] = defaultdict(list)
    for artefact in db.query(Artefact).filter(Artefact.scan_id == scan_id).all():
        grouped[artefact.bom_ref].append(artefact)

    duplicates = []
    canonical = {}
    for bom_ref in sorted(grouped):
        items = sorted(grouped[bom_ref], key=lambda item: str(item.id))
        canonical[bom_ref] = items[0]
        if len(items) > 1:
            duplicates.append(
                {
                    "bom_ref": bom_ref,
                    "artefact_ids": [str(item.id) for item in items],
                    "count": len(items),
                }
            )
    return canonical, duplicates


def compute_scan_diff(db: Session, current: Scan, baseline: Scan) -> dict:
    validate_scan_comparison(current, baseline)
    current_by_ref, current_duplicates = _artefacts_by_ref(db, current.id)
    baseline_by_ref, baseline_duplicates = _artefacts_by_ref(db, baseline.id)

    added_refs = set(current_by_ref) - set(baseline_by_ref)
    removed_refs = set(baseline_by_ref) - set(current_by_ref)
    risk_band_changed = []
    score_changed = []
    for ref in sorted(set(current_by_ref) & set(baseline_by_ref)):
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
        if cur.final_risk_score != base.final_risk_score:
            score_changed.append(
                {
                    **artefact_brief(cur),
                    "previous_final_risk_score": base.final_risk_score,
                    "score_delta": cur.final_risk_score - base.final_risk_score,
                    "previous_risk_band": base.risk_band,
                }
            )

    before_mosca = compute_mosca(baseline.data_lifetime_x, baseline.migration_time_y, max_risk_score(db, baseline.id))
    after_mosca = compute_mosca(current.data_lifetime_x, current.migration_time_y, max_risk_score(db, current.id))
    baseline_total = len(baseline_by_ref) + sum(item["count"] - 1 for item in baseline_duplicates)
    current_total = len(current_by_ref) + sum(item["count"] - 1 for item in current_duplicates)

    return {
        "scan_id": str(current.id),
        "against_scan_id": str(baseline.id),
        "added": [artefact_brief(current_by_ref[r]) for r in sorted(added_refs)],
        "removed": [artefact_brief(baseline_by_ref[r]) for r in sorted(removed_refs)],
        "risk_band_changed": risk_band_changed,
        "score_changed": score_changed,
        "counts": {
            "added": len(added_refs),
            "removed": len(removed_refs),
            "risk_band_changed": len(risk_band_changed),
            "score_changed": len(score_changed),
            "critical_before": baseline.critical_risk_count,
            "critical_after": current.critical_risk_count,
            "high_before": baseline.high_risk_count,
            "high_after": current.high_risk_count,
            "total_before": baseline_total,
            "total_after": current_total,
        },
        "metrics": {
            "before": {
                "total_artefacts": baseline_total,
                "critical_risk_count": baseline.critical_risk_count,
                "high_risk_count": baseline.high_risk_count,
                "max_risk_score": max_risk_score(db, baseline.id),
            },
            "after": {
                "total_artefacts": current_total,
                "critical_risk_count": current.critical_risk_count,
                "high_risk_count": current.high_risk_count,
                "max_risk_score": max_risk_score(db, current.id),
            },
        },
        "duplicates": {
            "before": baseline_duplicates,
            "after": current_duplicates,
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

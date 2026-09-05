"""Deterministic corpus accuracy: recall of labelled families, zero invented algorithms."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from scanner.detectors.pipeline import run_all_detectors

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_PATH = Path(__file__).resolve().parent / "expected.json"


def load_expected() -> dict:
    return json.loads(EXPECTED_PATH.read_text(encoding="utf-8"))


def _blob(finding) -> str:
    return " ".join(
        str(x or "")
        for x in (finding.name, finding.algorithm, finding.file_path, finding.detection_method, finding.asset_type)
    ).upper()


def _matches_requirement(findings: list, req: dict) -> bool:
    family = (req.get("family") or "").upper()
    file_substr = (req.get("file_substr") or "").upper()
    asset_type = (req.get("asset_type") or "").lower()
    method_prefix = (req.get("detection_method_prefix") or "").lower()
    for f in findings:
        blob = _blob(f)
        if family and family not in blob:
            continue
        if file_substr and file_substr not in (f.file_path or "").upper():
            continue
        if asset_type and (f.asset_type or "").lower() != asset_type:
            continue
        if method_prefix and not (f.detection_method or "").lower().startswith(method_prefix):
            continue
        return True
    return False


def _invented(findings: list, denylist: list[str]) -> list[str]:
    hits = []
    for f in findings:
        blob = _blob(f)
        for token in denylist:
            if token.upper() in blob:
                hits.append(f"{token} in {f.file_path}:{f.line_number}")
    return hits


def measure_fixture(name: str, spec: dict, denylist: list[str]) -> dict:
    root = ROOT / "corpus" / name
    if not root.exists():
        return {"fixture": name, "skipped": True, "reason": "missing fixture directory"}
    findings = run_all_detectors(root)
    required = spec.get("required") or []
    hits = [req for req in required if _matches_requirement(findings, req)]
    misses = [req for req in required if not _matches_requirement(findings, req)]
    invented = _invented(findings, denylist)
    methods = Counter(f.detection_method for f in findings)
    return {
        "fixture": name,
        "skipped": False,
        "findings": len(findings),
        "required": len(required),
        "hits": len(hits),
        "misses": misses,
        "recall": (len(hits) / len(required)) if required else 1.0,
        "invented": invented,
        "invented_count": len(invented),
        "detection_methods": dict(methods),
        "deterministic_key": sorted(
            f"{f.detection_method}|{f.algorithm}|{f.file_path}|{f.line_number}" for f in findings
        ),
    }


def measure_corpus() -> dict:
    expected = load_expected()
    denylist = expected.get("invented_algorithms_denylist") or []
    fixtures = expected.get("fixtures") or {}
    results = []
    total_req = total_hit = 0
    invented_total = 0
    for name, spec in fixtures.items():
        row = measure_fixture(name, spec, denylist)
        results.append(row)
        if row.get("skipped"):
            continue
        total_req += row["required"]
        total_hit += row["hits"]
        invented_total += row["invented_count"]

    # Determinism: second pass on mixed-enterprise (or first available)
    live = [r for r in results if not r.get("skipped")]
    deterministic = True
    if live:
        probe = live[-1]["fixture"]
        again = measure_fixture(probe, fixtures[probe], denylist)
        deterministic = again.get("deterministic_key") == next(
            r["deterministic_key"] for r in results if r["fixture"] == probe
        )

    recall = (total_hit / total_req) if total_req else 1.0
    precision = 1.0 if invented_total == 0 else max(0.0, 1.0 - invented_total / max(total_hit, 1))
    return {
        "published": True,
        "schema": "ecdat-corpus-accuracy/1.0",
        "fixtures_evaluated": len(live),
        "required_checks": total_req,
        "required_hits": total_hit,
        "recall": round(recall, 4),
        "precision_vs_invented": round(precision, 4),
        "invented_algorithms": invented_total,
        "deterministic": deterministic,
        "headline": (
            f"{total_hit}/{total_req} labelled crypto families found, "
            f"{invented_total} invented algorithms, "
            f"{'deterministic' if deterministic else 'NON-DETERMINISTIC'}"
        ),
        "by_fixture": [{k: v for k, v in r.items() if k != "deterministic_key"} for r in results],
    }


if __name__ == "__main__":
    report = measure_corpus()
    print(json.dumps(report, indent=2))

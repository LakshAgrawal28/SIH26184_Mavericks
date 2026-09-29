"""SARIF 2.1.0 export — maps ECDAT scan artefacts to static analysis results."""
from __future__ import annotations

from app.engines.taxonomy import get_quantum_break
from app.models import Artefact, Scan

SARIF_VERSION = "2.1.0"
SARIF_SCHEMA = (
    "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json"
)
TOOL_NAME = "ECDAT"
TOOL_VERSION = "2.0.0"

_BAND_TO_LEVEL = {
    "CRITICAL": "error",
    "HIGH": "error",
    "MEDIUM": "warning",
    "LOW": "note",
}


def build_sarif(scan: Scan, artefacts: list[Artefact]) -> dict:
    rules: dict[str, dict] = {}
    results: list[dict] = []

    for art in artefacts:
        rule_id = _rule_id(art)
        if rule_id not in rules:
            rules[rule_id] = _rule_descriptor(rule_id, art)
        result: dict = {
            "ruleId": rule_id,
            "level": _level_from_band(art.risk_band),
            "message": {"text": _message_text(art)},
        }
        loc = _location(art)
        if loc:
            result["locations"] = [loc]
        results.append(result)

    run: dict = {
        "tool": {
            "driver": {
                "name": TOOL_NAME,
                "version": TOOL_VERSION,
                "informationUri": "https://github.com/ecdat/ecdat",
                "rules": list(rules.values()),
            }
        },
        "results": results,
        "automationDetails": {
            "guid": str(scan.id),
            "description": {"text": scan.name or "ECDAT scan"},
        },
    }

    return {
        "$schema": SARIF_SCHEMA,
        "version": SARIF_VERSION,
        "runs": [run],
    }


def _level_from_band(risk_band: str | None) -> str:
    band = (risk_band or "LOW").upper()
    return _BAND_TO_LEVEL.get(band, "note")


def _quantum_break(art: Artefact) -> str:
    meta = art.raw_metadata or {}
    qb = meta.get("quantum_break")
    if isinstance(qb, str) and qb:
        return qb
    return get_quantum_break(art.algorithm, art.primitive)


def _rule_id(art: Artefact) -> str:
    qb = _quantum_break(art)
    if qb and qb not in ("none", "inspect"):
        slug = qb.replace("_", "-")
        return f"ecdat/quantum-{slug}"
    if art.recommendation_action:
        slug = art.recommendation_action.lower().replace("_", "-")
        return f"ecdat/action-{slug}"
    return f"ecdat/crypto-risk-{(art.risk_band or 'LOW').lower()}"


def _rule_descriptor(rule_id: str, sample: Artefact) -> dict:
    qb = _quantum_break(sample)
    if rule_id.startswith("ecdat/quantum-"):
        short_name = rule_id.split("/", 1)[1].replace("-", " ")
        text = f"Cryptographic finding with quantum exposure class: {qb or short_name}."
    elif rule_id.startswith("ecdat/action-"):
        text = f"Recommended remediation: {sample.recommendation_action or 'review'}."
    else:
        text = f"ECDAT crypto risk at band {(sample.risk_band or 'LOW').upper()}."
    return {
        "id": rule_id,
        "name": rule_id.split("/", 1)[-1],
        "shortDescription": {"text": text},
        "fullDescription": {"text": text},
        "defaultConfiguration": {"level": _level_from_band(sample.risk_band)},
    }


def _message_text(art: Artefact) -> str:
    if art.recommendation_rationale:
        return art.recommendation_rationale.strip()
    label = art.name or art.algorithm or "Cryptographic artefact"
    return f"{label}: {art.risk_band or 'LOW'} risk (score {art.final_risk_score:.1f})."


def _location(art: Artefact) -> dict | None:
    if not art.file_path:
        return None
    physical: dict = {"artifactLocation": {"uri": art.file_path}}
    if art.line_number is not None:
        physical["region"] = {"startLine": art.line_number}
    return {"physicalLocation": physical}

"""CycloneDX 1.6 CBOM builder — emits cryptographic-asset components valid against bom-1.6.schema.json."""
from __future__ import annotations

import io
import uuid
from datetime import datetime, timezone

from app.cbom.crypto_map import (
    classical_bits,
    map_mode,
    map_nist_qsl,
    map_padding,
    map_primitive,
)
from app.cbom.validator import validate_cbom
from app.models import Artefact, Scan

TOOL_BOM_REF = "ecdat-scanner"


def build_cbom(scan: Scan, artefacts: list[Artefact], *, validate: bool = True) -> dict:
    app_ref = f"app:{scan.id}"
    components: list[dict] = []
    depends_on: list[str] = []

    for art in artefacts:
        comp = _component_from_artefact(art)
        components.append(comp)
        depends_on.append(comp["bom-ref"])

    bom = {
        "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": f"urn:uuid:{uuid.uuid4()}",
        "version": 1,
        "metadata": {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tools": {
                "components": [
                    {
                        "type": "application",
                        "bom-ref": TOOL_BOM_REF,
                        "name": "ECDAT",
                        "version": "1.0.0",
                        "description": "Enterprise Cryptographic Discovery & Analysis Tool",
                    }
                ]
            },
            "component": {
                "type": "application",
                "bom-ref": app_ref,
                "name": scan.name or "scanned-target",
                "version": "1.0",
            },
        },
        "components": components,
        "dependencies": [{"ref": app_ref, "dependsOn": depends_on}] if depends_on else [],
    }

    if validate:
        result = validate_cbom(bom)
        if not result["valid"]:
            raise ValueError("CycloneDX 1.6 validation failed: " + "; ".join(result["errors"][:8]))
    return bom


def _component_from_artefact(art: Artefact) -> dict:
    bom_ref = art.bom_ref or f"crypto/{art.id}"
    asset_type = _asset_type(art)
    properties = _ecdat_properties(art)

    if art.asset_type == "library":
        comp: dict = {
            "type": "library",
            "bom-ref": bom_ref,
            "name": art.library_name or art.name,
        }
        if art.library_version:
            comp["version"] = art.library_version
        if properties:
            comp["properties"] = properties
        evidence = _evidence(art)
        if evidence:
            comp["evidence"] = evidence
        return comp

    crypto: dict = {"assetType": asset_type}

    if asset_type == "algorithm":
        algo_props: dict = {
            "primitive": map_primitive(art.algorithm, art.primitive, art.mode),
            "executionEnvironment": "software-plain-ram",
            "implementationPlatform": "generic",
            "nistQuantumSecurityLevel": map_nist_qsl(art.algorithm, art.final_risk_score),
        }
        param = (art.key_size or "").strip()
        if param:
            algo_props["parameterSetIdentifier"] = param
        mode = map_mode(art.algorithm, art.mode)
        if mode:
            algo_props["mode"] = mode
        padding = map_padding(art.algorithm, art.mode, art.name)
        if padding:
            algo_props["padding"] = padding
        bits = classical_bits(art.algorithm, art.key_size)
        if bits is not None:
            algo_props["classicalSecurityLevel"] = bits
        crypto["algorithmProperties"] = algo_props

    elif asset_type == "certificate":
        crypto["certificateProperties"] = _certificate_properties(art)

    elif asset_type == "protocol":
        crypto["protocolProperties"] = _protocol_properties(art)

    elif asset_type == "related-crypto-material":
        crypto["relatedCryptoMaterialProperties"] = {
            "type": "private-key" if "PRIVATE" in (art.algorithm or art.name or "").upper() else "key",
        }

    comp = {
        "type": "cryptographic-asset",
        "bom-ref": bom_ref,
        "name": (art.name or art.algorithm or "cryptographic-asset")[:255],
        "cryptoProperties": crypto,
    }
    if properties:
        comp["properties"] = properties
    evidence = _evidence(art)
    if evidence:
        comp["evidence"] = evidence
    return comp


def _asset_type(art: Artefact) -> str:
    raw = (art.asset_type or "algorithm").lower()
    if raw in ("algorithm", "certificate", "protocol", "related-crypto-material"):
        return raw
    if raw == "library":
        return "library"
    if "CERT" in (art.name or "").upper() or raw == "x509":
        return "certificate"
    if "TLS" in (art.algorithm or art.name or "").upper() or raw == "protocol":
        return "protocol"
    if "KEY" in (art.algorithm or art.name or "").upper():
        return "related-crypto-material"
    return "algorithm"


def _ecdat_properties(art: Artefact) -> list[dict]:
    props = [
        {"name": "ecdat:risk_score", "value": f"{float(art.final_risk_score):.2f}"},
        {"name": "ecdat:risk_band", "value": art.risk_band or "LOW"},
        {"name": "ecdat:detection_method", "value": art.detection_method or "unknown"},
        {"name": "ecdat:confidence", "value": f"{float(art.confidence):.2f}"},
    ]
    if art.primary_pqc:
        props.append({"name": "ecdat:pqc_recommendation", "value": art.primary_pqc})
    if art.hybrid_pair:
        props.append({"name": "ecdat:hybrid_pair", "value": art.hybrid_pair})
    if art.nist_standard:
        props.append({"name": "ecdat:nist_standard", "value": art.nist_standard})
    return props


def _evidence(art: Artefact) -> dict | None:
    if not art.file_path:
        return None
    occ: dict = {"location": art.file_path}
    if art.line_number is not None and art.line_number >= 0:
        occ["line"] = int(art.line_number)
    if art.evidence_snippet:
        occ["additionalContext"] = art.evidence_snippet[:500]
    return {"occurrences": [occ]}


def _certificate_properties(art: Artefact) -> dict:
    meta = art.raw_metadata if isinstance(art.raw_metadata, dict) else {}
    props: dict = {"certificateFormat": "X.509"}
    if meta.get("subjectName"):
        props["subjectName"] = str(meta["subjectName"])
    if meta.get("issuerName"):
        props["issuerName"] = str(meta["issuerName"])
    not_after = meta.get("notValidAfter")
    if not_after:
        props["notValidAfter"] = _iso_datetime(str(not_after))
    return props


def _protocol_properties(art: Artefact) -> dict:
    blob = f"{art.algorithm or ''} {art.name or ''}".upper()
    version = "1.0"
    if "1.3" in blob or "TLS13" in blob or "TLSV1.3" in blob:
        version = "1.3"
    elif "1.2" in blob or "TLS12" in blob:
        version = "1.2"
    elif "1.1" in blob or "TLS11" in blob:
        version = "1.1"
    return {"type": "tls", "version": version}


def _iso_datetime(value: str) -> str:
    if value.endswith("Z") or "+" in value[10:] or value.endswith("+00:00"):
        return value.replace("+00:00", "Z")
    return value


def build_pdf_summary(scan: Scan, artefacts: list[Artefact], mosca: dict) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    y = 750
    lines = [
        "ECDAT Executive Summary Report",
        f"Scan: {scan.name}",
        f"Status: {scan.status}",
        f"Total artefacts: {len(artefacts)}",
        f"Critical: {scan.critical_risk_count} | High: {scan.high_risk_count}",
        f"Mosca overall: {mosca.get('overall_category', 'N/A')}",
        f"CycloneDX: 1.6 CBOM (ECMA-424) schema-validated",
        "",
        "Top findings:",
    ]
    for art in sorted(artefacts, key=lambda a: a.final_risk_score, reverse=True)[:10]:
        lines.append(f"- {art.name} ({art.risk_band}) -> {art.recommendation_action or 'N/A'}")

    for line in lines:
        c.drawString(50, y, line[:90])
        y -= 18
        if y < 50:
            c.showPage()
            y = 750

    c.save()
    buffer.seek(0)
    return buffer.read()

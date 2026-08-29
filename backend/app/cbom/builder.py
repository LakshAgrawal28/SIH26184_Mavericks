import io
import uuid
from datetime import datetime, timezone

from app.models import Artefact, Scan


def build_cbom(scan: Scan, artefacts: list[Artefact]) -> dict:
    components = []
    deps = {"ref": f"app:{scan.id}", "dependsOn": []}

    for art in artefacts:
        bom_ref = art.bom_ref or f"crypto/{art.id}"
        deps["dependsOn"].append(bom_ref)

        comp = {
            "type": "cryptographic-asset",
            "bom-ref": bom_ref,
            "name": art.name,
            "cryptoProperties": {
                "assetType": art.asset_type if art.asset_type in ("algorithm", "certificate", "protocol") else "algorithm",
            },
            "properties": [
                {"name": "ecdat:risk_score", "value": str(art.final_risk_score)},
                {"name": "ecdat:risk_band", "value": art.risk_band},
                {"name": "ecdat:detection_method", "value": art.detection_method},
                {"name": "ecdat:confidence", "value": str(art.confidence)},
            ],
        }

        if art.asset_type == "algorithm":
            comp["cryptoProperties"]["algorithmProperties"] = {
                "primitive": art.primitive or "unknown",
                "parameterSetIdentifier": art.key_size or "",
                "mode": art.mode or "",
                "nistQuantumSecurityLevel": 0 if (art.final_risk_score >= 7 or (art.algorithm and "RSA" in art.algorithm.upper())) else 2,
            }
        elif art.asset_type == "certificate" and art.raw_metadata:
            comp["cryptoProperties"]["certificateProperties"] = art.raw_metadata

        if art.file_path:
            comp["evidence"] = {
                "occurrences": [
                    {
                        "location": art.file_path,
                        "line": art.line_number or 0,
                        "additionalContext": (art.evidence_snippet or "")[:500],
                    }
                ]
            }

        if art.primary_pqc:
            comp["properties"].append({"name": "ecdat:pqc_recommendation", "value": art.primary_pqc})

        components.append(comp)

    return {
        "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": f"urn:uuid:{uuid.uuid4()}",
        "version": 1,
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tools": {
                "components": [{"type": "application", "name": "ECDAT", "version": "1.0.0"}]
            },
            "component": {"type": "application", "name": scan.name, "version": "1.0"},
        },
        "components": components,
        "dependencies": [deps] if deps["dependsOn"] else [],
    }


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

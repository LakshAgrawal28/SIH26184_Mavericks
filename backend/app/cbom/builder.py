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
                        "version": "2.0.0",
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

    kind = (art.asset_type or "").lower()
    if kind == "library":
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
        crypto["protocolProperties"] = _protocol_properties(art, kind=kind)

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
    if raw in ("hsm", "cloud-service"):
        return "protocol"
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
    kind = (art.asset_type or "").lower()
    if kind in ("hsm", "cloud-service"):
        props.append({"name": "ecdat:asset_kind", "value": kind})
    meta = art.raw_metadata if isinstance(art.raw_metadata, dict) else {}
    if meta.get("quantum_break") is not None:
        props.append({"name": "ecdat:quantum_break", "value": str(meta["quantum_break"])})
    if meta.get("use_case"):
        props.append({"name": "ecdat:use_case", "value": str(meta["use_case"])})
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


def _protocol_properties(art: Artefact, *, kind: str | None = None) -> dict:
    raw_kind = (kind or art.asset_type or "").lower()
    if raw_kind in ("hsm", "cloud-service"):
        return {"type": "other", "version": "1.0"}
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


def _pdf_summary_metrics(scan: Scan, artefacts: list[Artefact]) -> dict:
    from app.services.scan_service import artefact_quantum_break

    bands: dict[str, int] = {}
    primitives: dict[str, int] = {}
    shor_n = 0
    broken_n = 0
    safe_n = 0
    for a in artefacts:
        bands[a.risk_band or "UNKNOWN"] = bands.get(a.risk_band or "UNKNOWN", 0) + 1
        prim = a.primitive or "unknown"
        primitives[prim] = primitives.get(prim, 0) + 1
        qb = artefact_quantum_break(a) or "unknown"
        if qb == "shor":
            shor_n += 1
        elif qb == "broken_classical":
            broken_n += 1
        elif qb == "none":
            safe_n += 1
    total = len(artefacts) or 1
    exposed = shor_n + broken_n
    agility_index = round(max(0.0, min(100.0, (1 - exposed / total) * 100)), 1)
    return {
        "bands": bands,
        "primitives": primitives,
        "agility_index": agility_index,
        "shor_exposure_pct": round(shor_n / total * 100, 1),
        "pqc_safe_pct": round(safe_n / total * 100, 1),
        "shor_n": shor_n,
        "broken_n": broken_n,
    }


def build_pdf_summary(scan: Scan, artefacts: list[Artefact], mosca: dict) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    metrics = _pdf_summary_metrics(scan, artefacts)
    params = mosca.get("parameters") or {}
    x_val = params.get("data_lifetime_x", scan.data_lifetime_x)
    y_val = params.get("migration_time_y", scan.migration_time_y)
    total_time = params.get("total_time_needed", float(x_val) + float(y_val))
    overall = mosca.get("overall_category", "N/A")
    interpretation = mosca.get("interpretation") or ""
    created = scan.created_at.strftime("%Y-%m-%d %H:%M UTC") if scan.created_at else "—"
    completed = scan.completed_at.strftime("%Y-%m-%d %H:%M UTC") if scan.completed_at else "—"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
        title=f"ECDAT Executive Report — {scan.name}",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "EcdatTitle",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#0D3B66"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "EcdatSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#4A5568"),
        spaceAfter=14,
    )
    h2 = ParagraphStyle(
        "EcdatH2",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#1B4B8C"),
        spaceBefore=10,
        spaceAfter=6,
    )
    body = ParagraphStyle(
        "EcdatBody",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=13,
        alignment=TA_LEFT,
    )
    small = ParagraphStyle(
        "EcdatSmall",
        parent=body,
        fontSize=8,
        textColor=colors.HexColor("#5C6770"),
    )

    story: list = []
    story.append(Paragraph("ECDAT Executive Summary Report", title_style))
    story.append(
        Paragraph(
            "Enterprise Cryptographic Discovery &amp; Analysis Tool · NTRO SIH 2026 · "
            "Deterministic findings; CycloneDX 1.6 CBOM (ECMA-424)",
            subtitle_style,
        )
    )

    story.append(Paragraph("Executive overview", h2))
    exec_text = (
        f"Scan <b>{scan.name}</b> ({scan.target_type or 'target'}) completed with "
        f"<b>{scan.total_artefacts}</b> cryptographic artefacts. "
        f"<b>{scan.critical_risk_count}</b> critical and <b>{scan.high_risk_count}</b> high-severity "
        f"items require leadership attention. Cryptographic agility index: "
        f"<b>{metrics['agility_index']}/100</b> "
        f"(higher is better — share of inventory not exposed to Shor/broken-classical risk). "
        f"PQC-ready or classical-safe share: <b>{metrics['pqc_safe_pct']}%</b>."
    )
    story.append(Paragraph(exec_text, body))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Scan metadata", h2))
    meta_rows = [
        ["Scan ID", str(scan.id)],
        ["Status", scan.status],
        ["Files scanned", str(scan.total_files)],
        ["Artefacts", str(scan.total_artefacts)],
        ["Started", created],
        ["Completed", completed],
        ["Export", "CycloneDX 1.6 CBOM JSON + this PDF"],
    ]
    meta_table = Table(meta_rows, colWidths=[1.55 * inch, 4.7 * inch])
    meta_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#4A5568")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(meta_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Risk &amp; agility metrics", h2))
    metric_rows = [
        ["Metric", "Value"],
        ["Agility index (0–100)", f"{metrics['agility_index']}"],
        ["Shor-vulnerable exposure", f"{metrics['shor_exposure_pct']}% ({metrics['shor_n']} artefacts)"],
        ["Broken classical exposure", f"{metrics['broken_n']} artefacts"],
        ["PQC-safe / none quantum break", f"{metrics['pqc_safe_pct']}%"],
        ["Critical count", str(scan.critical_risk_count)],
        ["High count", str(scan.high_risk_count)],
    ]
    for band in ("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO", "UNKNOWN"):
        if band in metrics["bands"]:
            metric_rows.append([f"Band: {band}", str(metrics["bands"][band])])
    m_table = Table(metric_rows, colWidths=[2.4 * inch, 3.85 * inch])
    m_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF4")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
            ]
        )
    )
    story.append(m_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Mosca theorem &amp; harvest-now-decrypt-later", h2))
    mosca_body = (
        f"Data lifetime <b>X = {x_val}</b> years · Migration time <b>Y = {y_val}</b> years · "
        f"Required horizon <b>X + Y = {total_time}</b> years. "
        f"Overall Mosca category: <b>{overall}</b>. "
        f"{interpretation}"
    )
    story.append(Paragraph(mosca_body, body))
    scenarios = mosca.get("scenarios") or []
    if scenarios:
        sc_rows = [["Scenario (Z)", "Margin (Z − X − Y)", "Category"]]
        for sc in scenarios[:6]:
            sc_rows.append(
                [
                    f"{sc.get('name', '')} (Z={sc.get('z_value')})",
                    str(sc.get("margin")),
                    str(sc.get("category")),
                ]
            )
        sc_table = Table(sc_rows, colWidths=[2.5 * inch, 1.5 * inch, 2.25 * inch])
        sc_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF4")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E0")),
                ]
            )
        )
        story.append(Spacer(1, 6))
        story.append(sc_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Top findings (by risk score)", h2))
    top = sorted(artefacts, key=lambda a: a.final_risk_score, reverse=True)[:12]
    if top:
        find_rows = [["Artefact", "Band", "Algorithm", "Location", "PQC action"]]
        for art in top:
            loc = art.file_path or "—"
            if art.line_number:
                loc = f"{loc}:{art.line_number}"
            find_rows.append(
                [
                    (art.name or "—")[:42],
                    art.risk_band or "—",
                    (art.algorithm or art.primitive or "—")[:28],
                    loc[:48],
                    (art.recommendation_action or art.primary_pqc or "Review")[:32],
                ]
            )
        f_table = Table(find_rows, colWidths=[1.35 * inch, 0.65 * inch, 1.1 * inch, 1.85 * inch, 1.3 * inch])
        f_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0D3B66")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E0")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(f_table)
    else:
        story.append(Paragraph("No artefacts recorded for this scan.", body))

    story.append(Spacer(1, 10))
    story.append(Paragraph("PQC migration context", h2))
    story.append(
        Paragraph(
            "Recommendations in ECDAT map classical algorithms to NIST post-quantum candidates "
            "(ML-KEM, ML-DSA, SLH-DSA) using deterministic rules—not generative AI. "
            "Use the exported CycloneDX CBOM for GRC tooling and track remediation in your "
            "crypto-agility program.",
            body,
        )
    )
    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            "Generated by ECDAT. Deterministic artefact inventory and CBOM export remain authoritative. "
            "This PDF is suitable for auditor and leadership briefings.",
            small,
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()

from app.engines.taxonomy import (
    classify_use_case,
    get_classical_weakness,
    get_quantum_break,
    get_qv,
)

# Weighting and band cutoffs are documented in docs/RISK_MODEL.md (HNDL 0.6 / operational 0.4).


def compute_risk_detail(
    algorithm: str | None,
    mode: str | None,
    sensitivity: int,
    lifetime_years: float,
    exposure: int,
    criticality: int,
    confidence: float,
    asset_type: str = "algorithm",
    cert_expiry_days: int | None = None,
    primitive: str | None = None,
) -> dict:
    qv = get_qv(algorithm, primitive)
    classical = get_classical_weakness(algorithm or "", mode)
    quantum_break = get_quantum_break(algorithm, primitive)
    use_case = classify_use_case(algorithm, primitive, asset_type=asset_type)
    asym_factor = 1.5 if quantum_break == "shor" else 1.0

    hndl = qv * (sensitivity / 10) * min(lifetime_years / 10, 3.0) * (exposure / 10) * asym_factor
    hndl = min(10.0, hndl)

    operational = (0.4 * qv + 0.2 * classical + 0.2 * (exposure / 10) * 10 + 0.2 * (criticality / 10) * 10)
    complexity = 5 if qv >= 8 else 3
    operational *= 1 + complexity / 20
    operational = min(10.0, operational)

    final = min(10.0, (0.6 * hndl + 0.4 * operational) * confidence)

    if asset_type == "certificate" and cert_expiry_days is not None:
        from app.engines.cert_expiry import compute_expiry_urgency
        mult, _ = compute_expiry_urgency(cert_expiry_days)
        final *= mult
        final = min(10.0, final)

    if final >= 7.5:
        band = "CRITICAL"
    elif final >= 5.5:
        band = "HIGH"
    elif final >= 3.5:
        band = "MEDIUM"
    else:
        band = "LOW"

    hndl_r, op_r, final_r = round(hndl, 2), round(operational, 2), round(final, 2)
    return {
        "hndl": hndl_r,
        "operational": op_r,
        "final": final_r,
        "band": band,
        "qv": qv,
        "quantum_break": quantum_break,
        "classical": round(classical, 2),
        "use_case": use_case,
        "hndl_risk": hndl_r,
        "operational_risk": op_r,
        "final_risk_score": final_r,
        "risk_band": band,
    }


def compute_risk(
    algorithm: str | None,
    mode: str | None,
    sensitivity: int,
    lifetime_years: float,
    exposure: int,
    criticality: int,
    confidence: float,
    asset_type: str = "algorithm",
    cert_expiry_days: int | None = None,
    primitive: str | None = None,
) -> tuple[float, float, float, str]:
    detail = compute_risk_detail(
        algorithm,
        mode,
        sensitivity,
        lifetime_years,
        exposure,
        criticality,
        confidence,
        asset_type=asset_type,
        cert_expiry_days=cert_expiry_days,
        primitive=primitive,
    )
    return detail["hndl"], detail["operational"], detail["final"], detail["band"]

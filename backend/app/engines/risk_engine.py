from app.engines.taxonomy import get_classical_weakness, get_qv


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
) -> tuple[float, float, float, str]:
    qv = get_qv(algorithm)
    classical = get_classical_weakness(algorithm or "", mode)
    asym_factor = 1.5 if asset_type in ("algorithm", "certificate") and qv >= 8 else 1.0

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

    return round(hndl, 2), round(operational, 2), round(final, 2), band

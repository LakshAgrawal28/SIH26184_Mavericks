from app.engines.taxonomy import PQC_MAP


def recommend(algorithm: str | None, risk_band: str) -> tuple[str, str | None, str | None, str, str]:
    if not algorithm:
        return "Monitor", None, None, "Insufficient algorithm metadata for PQC mapping.", "Low"

    key = algorithm.upper()
    for map_key, (primary, hybrid, action) in PQC_MAP.items():
        if map_key in key or key.startswith(map_key):
            rationale = f"{algorithm} is mapped to {primary or 'no change'} per NIST FIPS 203/204 guidance."
            if risk_band in ("CRITICAL", "HIGH") and action == "Keep":
                action = "Monitor"
            effort = "High" if hybrid else ("Low" if action == "Keep" else "Medium")
            return action, primary, hybrid, rationale, effort

    if risk_band in ("CRITICAL", "HIGH"):
        return "Migrate", "ML-KEM-768", "X25519MLKEM768", "Legacy public-key crypto should migrate to NIST PQC standards.", "Medium"
    return "Monitor", None, None, "Review manually for PQC migration path.", "Low"

from app.engines.taxonomy import PQC_MAP

NIST_STANDARDS = {
    "ML-KEM-512": "FIPS 203",
    "ML-KEM-768": "FIPS 203",
    "ML-KEM-1024": "FIPS 203",
    "ML-DSA-44": "FIPS 204",
    "ML-DSA-65": "FIPS 204",
    "ML-DSA-87": "FIPS 204",
    "SLH-DSA": "FIPS 205",
    "SLH-DSA-128S": "FIPS 205",
    "AES-256-GCM": "NIST SP 800-38D",
    "SHA-256": "FIPS 180-4",
}


def recommend(algorithm: str | None, risk_band: str) -> tuple[str, str | None, str | None, str, str, str | None, str]:
    timeline_urgency = "IMMEDIATE" if risk_band in ("CRITICAL", "HIGH") else ("PLANNED" if risk_band == "MEDIUM" else "MONITORING")

    if not algorithm:
        return "Monitor", None, None, "Insufficient algorithm metadata for PQC mapping.", "Low", None, timeline_urgency

    key = algorithm.upper()
    for map_key, (primary, hybrid, action) in PQC_MAP.items():
        if map_key in key or key.startswith(map_key):
            rationale = f"{algorithm} is mapped to {primary or 'no change'} per NIST guidance."
            if risk_band in ("CRITICAL", "HIGH") and action == "Keep":
                action = "Monitor"
            effort = "High" if hybrid else ("Low" if action == "Keep" else "Medium")
            nist_standard = NIST_STANDARDS.get(primary) if primary else None
            return action, primary, hybrid, rationale, effort, nist_standard, timeline_urgency

    if risk_band in ("CRITICAL", "HIGH"):
        return "Migrate", "ML-KEM-768", "X25519MLKEM768", "Legacy public-key crypto should migrate to NIST PQC standards.", "Medium", "FIPS 203", timeline_urgency
    return "Monitor", None, None, "Review manually for PQC migration path.", "Low", None, timeline_urgency

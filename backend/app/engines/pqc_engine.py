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
    "Argon2id": "RFC 9106",
    "TLS 1.3 + ML-KEM-768": "FIPS 203",
}


def _canonical(algorithm: str) -> str:
    u = algorithm.upper().replace("_", "-")
    if "JSONWEBTOKEN" in u or "JWT" in u:
        if "RS256" in u:
            return "RS256"
        if "ES256" in u:
            return "ES256"
        if "HS256" in u:
            return "HS256"
        return "JWT"
    if "BCRYPT" in u:
        return "BCRYPT"
    if "INSECURESKIPVERIFY" in u:
        return "TLS-INSECURESKIPVERIFY"
    if "TLS-1.0" in u or "TLSV1 " in u or u.endswith("TLSV1"):
        return "TLS-1.0"
    if "TLS-1.1" in u:
        return "TLS-1.1"
    if "TLS" in u:
        return "TLS"
    return u


def recommend(algorithm: str | None, risk_band: str) -> tuple[str, str | None, str | None, str, str, str | None, str]:
    timeline_urgency = "IMMEDIATE" if risk_band in ("CRITICAL", "HIGH") else ("PLANNED" if risk_band == "MEDIUM" else "MONITORING")

    if not algorithm:
        return "Monitor", None, None, "Insufficient algorithm metadata for PQC mapping.", "Low", None, timeline_urgency

    key = _canonical(algorithm)
    for map_key, (primary, hybrid, action) in sorted(PQC_MAP.items(), key=lambda x: len(x[0]), reverse=True):
        if map_key in key or key.startswith(map_key) or map_key in algorithm.upper():
            rationale = f"{algorithm} is mapped to {primary or 'no change'} per NIST guidance."
            if risk_band in ("CRITICAL", "HIGH") and action == "Keep":
                action = "Monitor"
            effort = "High" if hybrid else ("Low" if action in ("Keep", "Harden") else "Medium")
            nist_standard = NIST_STANDARDS.get(primary) if primary else None
            if action == "Harden":
                timeline_urgency = "PLANNED"
            return action, primary, hybrid, rationale, effort, nist_standard, timeline_urgency

    if risk_band in ("CRITICAL", "HIGH"):
        return "Migrate", "ML-KEM-768", "X25519MLKEM768", "Legacy public-key crypto should migrate to NIST PQC standards.", "Medium", "FIPS 203", timeline_urgency
    return "Monitor", None, None, "Review manually for PQC migration path.", "Low", None, timeline_urgency

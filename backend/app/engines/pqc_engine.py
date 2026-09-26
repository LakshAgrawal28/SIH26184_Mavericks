from app.engines.taxonomy import PQC_MAP, canonicalize_algorithm

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


def _pqc_lookup_key(algorithm: str) -> str:
    canonical, mapped = canonicalize_algorithm(algorithm)
    if mapped and canonical:
        return canonical.upper().replace("_", "-")
    return (canonical or algorithm).upper().replace("_", "-")


def recommend(
    algorithm: str | None,
    risk_band: str,
    primitive: str | None = None,
) -> tuple[str, str | None, str | None, str, str, str | None, str]:
    timeline_urgency = "IMMEDIATE" if risk_band in ("CRITICAL", "HIGH") else ("PLANNED" if risk_band == "MEDIUM" else "MONITORING")

    if not algorithm:
        return "Monitor", None, None, "Insufficient algorithm metadata for PQC mapping.", "Low", None, timeline_urgency

    key = _pqc_lookup_key(algorithm)
    for map_key, (primary, hybrid, action) in sorted(PQC_MAP.items(), key=lambda x: len(x[0]), reverse=True):
        map_u = map_key.upper().replace("_", "-")
        if map_u in key or key.startswith(map_u) or map_u in algorithm.upper().replace("_", "-"):
            rationale = f"{algorithm} is mapped to {primary or 'no change'} per NIST guidance."
            if risk_band in ("CRITICAL", "HIGH") and action == "Keep":
                action = "Monitor"
            effort = "High" if hybrid else ("Low" if action in ("Keep", "Harden") else "Medium")
            nist_standard = NIST_STANDARDS.get(primary) if primary else None
            if action == "Harden":
                timeline_urgency = "PLANNED"
            return action, primary, hybrid, rationale, effort, nist_standard, timeline_urgency

    prim = (primitive or "").strip().lower().replace("_", "-")
    if risk_band in ("CRITICAL", "HIGH"):
        if prim == "signature":
            return (
                "Migrate",
                "ML-DSA-65",
                "ECDSA-P256+ML-DSA-65",
                "Unmapped signature primitive — default NIST signature replacement (FIPS 204).",
                "Medium",
                "FIPS 204",
                timeline_urgency,
            )
        if prim in ("kem", "key-agree", "pke"):
            return (
                "Migrate",
                "ML-KEM-768",
                "X25519MLKEM768",
                "Unmapped key-exchange primitive — default NIST KEM replacement (FIPS 203).",
                "Medium",
                "FIPS 203",
                timeline_urgency,
            )
        if prim == "hash":
            return (
                "Monitor",
                None,
                None,
                "Review manually — hash functions have no direct PQC primitive replacement.",
                "Low",
                None,
                timeline_urgency,
            )
    return "Monitor", None, None, "Review manually for PQC migration path.", "Low", None, timeline_urgency

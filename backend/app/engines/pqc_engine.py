from app.engines.taxonomy import PQC_MAP, canonicalize_algorithm, classify_use_case

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

_KEM_CANONICAL = frozenset({
    "RSA",
    "RSA-1024",
    "RSA-2048",
    "RSA-4096",
    "ECDH",
    "X25519",
    "DH",
    "DH-1024",
    "RSA/ECB",
    "RSA/ECB/PKCS1PADDING",
})
_SIG_CANONICAL = frozenset({
    "RSA",
    "RSA-1024",
    "RSA-2048",
    "RSA-4096",
    "ECDSA",
    "Ed25519",
    "DSA",
    "DSA-1024",
    "RS256",
    "ES256",
    "PS256",
})
_LIBRARY_INSPECT = frozenset({
    "JWT",
    "JSONWEBTOKEN",
    "JWT.SIGN",
    "WEBCRYPTO",
    "NODE-CRYPTO",
    "OPENSSL",
    "PASSLIB",
    "PASSWORD-HASH",
    "LIB",
    "JCE",
    "BOUNCYCASTLE",
    "NODE-FORGE",
    "CRYPTO-JS",
    "PYCA/CRYPTOGRAPHY",
    "GOLANG.ORG/X/CRYPTO",
})
_TLS_CANONICAL = frozenset({"TLS", "TLS-1.0", "TLS-1.1", "TLS-1.2", "TLS-INSECURESKIPVERIFY", "SSL"})
_BROKEN_CLASSICAL_CIPHER = frozenset({"RC4", "DES", "3DES", "MD5"})
_MATERIAL_CANONICAL = frozenset({"PRIVATE-KEY", "PKCS12", "JAVA-KEYSTORE"})
_PQC_ALREADY = frozenset({
    "ML-KEM-512",
    "ML-KEM-768",
    "ML-KEM-1024",
    "ML-DSA",
    "ML-DSA-44",
    "ML-DSA-65",
    "ML-DSA-87",
    "SLH-DSA",
    "SLH-DSA-128S",
})
_NO_KEM_USES = frozenset({"symmetric", "hash", "mac", "kdf"})


def _pqc_lookup_key(algorithm: str) -> str:
    canonical, mapped = canonicalize_algorithm(algorithm)
    if mapped and canonical:
        return canonical.upper().replace("_", "-")
    return (canonical or algorithm).upper().replace("_", "-")


def _norm_primitive(primitive: str | None) -> str:
    return (primitive or "").strip().lower().replace("_", "-")


def _pack(action, primary, hybrid, rationale, effort, nist_standard, timeline_urgency):
    return action, primary, hybrid, rationale, effort, nist_standard, timeline_urgency


def _library_rationale(algorithm: str, canonical: str | None) -> str:
    can_u = (canonical or algorithm or "").upper()
    if "BCRYPT" in can_u or can_u in ("PASSLIB", "PASSWORD-HASH"):
        return (
            f"Use-case: kdf. {algorithm} is password hashing — Harden with Argon2id (RFC 9106); "
            "not a Shor-broken public-key primitive."
        )
    if can_u in ("AES-GCM", "AES", "AES-256", "AES-256-GCM", "CHACHA20") or can_u.startswith("AES"):
        return (
            f"Use-case: symmetric. {algorithm} stays symmetric (prefer AES-256-GCM); "
            "inspect call sites — never replace AES with ML-KEM."
        )
    if can_u in ("OPENSSL", "MBEDTLS", "WOLFSSL", "RUST-CRYPTO", "LIB", "JCE", "BOUNCYCASTLE") or "CRYPTO" in can_u:
        return (
            f"Use-case: library. {algorithm} is a crypto provider/API — Inspect algorithms actually used "
            "(TLS ciphers, signatures, KEMs); no default ML-KEM dump."
        )
    if can_u in ("JWT", "JSONWEBTOKEN", "JWT.SIGN") or "JWT" in can_u or "JSONWEBTOKEN" in can_u:
        return (
            f"Use-case: library. {algorithm} (JWT) is not Shor-broken by itself; "
            "inspect the JWT alg header (HS256 vs RS256/ES256) before choosing HMAC keep vs ML-DSA."
        )
    return (
        f"Use-case: library. {algorithm} is not a single quantum-vulnerable primitive — "
        "Inspect usage context before mapping to ML-KEM or ML-DSA."
    )


def recommend(
    algorithm: str | None,
    risk_band: str,
    primitive: str | None = None,
    asset_type: str | None = None,
) -> tuple[str, str | None, str | None, str, str, str | None, str]:
    timeline_urgency = "IMMEDIATE" if risk_band in ("CRITICAL", "HIGH") else ("PLANNED" if risk_band == "MEDIUM" else "MONITORING")

    if not algorithm:
        return "Monitor", None, None, "Insufficient algorithm metadata for PQC mapping.", "Low", None, timeline_urgency

    canonical, mapped = canonicalize_algorithm(algorithm)
    use = classify_use_case(algorithm, primitive, asset_type=asset_type)
    prim = _norm_primitive(primitive)
    key = _pqc_lookup_key(algorithm)
    can_u = (canonical or "").upper()

    if mapped and can_u in _PQC_ALREADY:
        rationale = (
            f"Use-case: {use}. {algorithm} is already a NIST PQC primitive — Keep / Monitor deployment, "
            "not a classical-to-PQC migration target."
        )
        return _pack("Keep", None, None, rationale, "Low", None, "MONITORING")

    if use == "material" or (mapped and can_u in _MATERIAL_CANONICAL):
        rationale = (
            f"Use-case: material. {algorithm} is key or keystore material — Inspect key type and usage "
            "(signing vs KEM/TLS), rotate to PQC keys when the consuming protocol is migrated; "
            "do not default to ML-DSA for opaque private keys."
        )
        return _pack("Inspect", None, None, rationale, "Medium", None, timeline_urgency)

    if mapped and can_u in _BROKEN_CLASSICAL_CIPHER:
        primary, hybrid, action = PQC_MAP.get(canonical, PQC_MAP.get(can_u, (None, None, "Immediate Replacement")))
        if can_u == "MD5":
            rationale = (
                f"Use-case: hash. {algorithm} is classically broken — Immediate Replacement with SHA-256/SHA-3. "
                "Hashes have no ML-KEM substitute."
            )
        else:
            rationale = (
                f"Use-case: symmetric. {algorithm} is a broken legacy cipher — replace with AES-256-GCM "
                "(and disable in TLS cipher suites); never ML-KEM."
            )
        return _pack(action, primary, hybrid, rationale, "Medium", NIST_STANDARDS.get(primary or ""), timeline_urgency)

    if use == "library" or prim == "library" or (mapped and can_u in _LIBRARY_INSPECT):
        rationale = _library_rationale(algorithm, canonical)
        if mapped and can_u in PQC_MAP and PQC_MAP[canonical][2] == "Harden":
            primary, _, action = PQC_MAP[canonical]
            return _pack(action, primary, None, rationale, "Low", NIST_STANDARDS.get(primary or ""), "PLANNED")
        return _pack("Inspect", None, None, rationale, "Low", None, "MONITORING" if risk_band == "LOW" else timeline_urgency)

    if use == "protocol" or (mapped and can_u in _TLS_CANONICAL):
        if canonical == "TLS-1.2":
            rationale = (
                f"Use-case: protocol. {algorithm} is acceptable short-term — plan TLS 1.3 with hybrid KEM "
                "(X25519MLKEM768); not an immediate cipher replacement."
            )
            return _pack(
                "Monitor",
                "TLS 1.3 + ML-KEM-768",
                "X25519MLKEM768",
                rationale,
                "Medium",
                NIST_STANDARDS.get("TLS 1.3 + ML-KEM-768"),
                "PLANNED",
            )
        if canonical in ("TLS-1.0", "TLS-1.1", "TLS-INSECURESKIPVERIFY"):
            action = "Immediate Replacement"
            rationale = (
                f"Use-case: protocol. {algorithm} is a broken/legacy TLS configuration — "
                "upgrade the protocol to TLS 1.3 with hybrid KEM (X25519MLKEM768), not 'replace TLS with ML-KEM' as an algorithm."
            )
        else:
            action = "Hybrid Migration"
            rationale = (
                f"Use-case: protocol. {algorithm} is a TLS/SSL protocol surface, not a public-key algorithm; "
                "migrate the handshake to TLS 1.3 + hybrid KEM (ML-KEM-768 / X25519MLKEM768)."
            )
        primary = "TLS 1.3 + ML-KEM-768"
        if canonical == "TLS-INSECURESKIPVERIFY":
            primary = "TLS 1.3 with verification"
            hybrid = None
        else:
            hybrid = "X25519MLKEM768"
        effort = "High" if hybrid else "Medium"
        return _pack(action, primary, hybrid, rationale, effort, NIST_STANDARDS.get(primary), timeline_urgency)

    if prim == "signature" or (use == "signature" and (not prim or prim == "signature")):
        if mapped and canonical in _SIG_CANONICAL and canonical not in ("ECDH", "X25519", "DH", "DH-1024"):
            if canonical in ("RS256", "ES256", "PS256") or prim == "signature" or canonical in ("ECDSA", "Ed25519", "DSA", "DSA-1024"):
                hybrid = {
                    "ECDSA": "ECDSA-P256+ML-DSA-65",
                    "ES256": "ECDSA-P256+ML-DSA-65",
                    "Ed25519": "Ed25519+ML-DSA-65",
                    "RS256": "RSA + ML-DSA-65",
                    "PS256": "RSA + ML-DSA-65",
                    "RSA": "RSA + ML-DSA-65",
                    "RSA-1024": "RSA + ML-DSA-65",
                    "RSA-2048": "RSA + ML-DSA-65",
                    "RSA-4096": "RSA + ML-DSA-65",
                }.get(canonical)
                action = "Hybrid Migration" if hybrid else "Migrate"
                rationale = (
                    f"Use-case: signature. {algorithm} authenticates, it does not encapsulate keys — "
                    "migrate to ML-DSA-65 (FIPS 204), not ML-KEM."
                )
                return _pack(action, "ML-DSA-65", hybrid, rationale, "High" if hybrid else "Medium", "FIPS 204", timeline_urgency)

    if prim in ("pke", "kem", "key-agree", "encryption") or (use == "kem" and prim not in ("signature",)):
        if mapped and canonical in _KEM_CANONICAL:
            rationale = (
                f"Use-case: kem. {algorithm} is public-key encryption / key agreement — "
                "Hybrid Migration to ML-KEM-768 + X25519MLKEM768 (FIPS 203)."
            )
            return _pack("Hybrid Migration", "ML-KEM-768", "X25519MLKEM768", rationale, "High", "FIPS 203", timeline_urgency)

    if mapped and canonical in PQC_MAP:
        primary, hybrid, action = PQC_MAP[canonical]
        if use in _NO_KEM_USES and primary and "ML-KEM" in primary:
            primary, hybrid, action = None, None, "Keep"
        rationale = (
            f"Use-case: {use}. {algorithm} is mapped to {primary or 'no change'} per NIST guidance."
        )
        if use == "mac" and action == "Keep":
            rationale = (
                f"Use-case: mac. HMAC-SHA-256 / {algorithm} is not Shor-broken — Keep (or Harden secrets). "
                "Do not treat HS256 as RSA."
            )
        if use == "symmetric" and (canonical or "").startswith("AES-256"):
            rationale = (
                f"Use-case: symmetric. AES-256 remains acceptable under Grover (~128-bit); Keep. "
                "Never replace AES/ChaCha with ML-KEM."
            )
        if use == "symmetric" and canonical == "AES-128":
            rationale = (
                f"Use-case: symmetric. AES-128 is Grover-weakened — Migrate to AES-256-GCM, not ML-KEM."
            )
        if use == "hash" and action == "Immediate Replacement":
            rationale = (
                f"Use-case: hash. {algorithm} is classically broken — Immediate Replacement with SHA-256/SHA-3. "
                "Hashes have no ML-KEM substitute."
            )
        if use == "certificate" and primary == "ML-DSA-65":
            rationale = (
                f"Use-case: certificate. {algorithm} chain uses classical signatures — "
                "plan hybrid ML-DSA-65 (FIPS 204) for PKIX, not ML-KEM."
            )
        if risk_band in ("CRITICAL", "HIGH") and action == "Keep":
            action = "Monitor"
        effort = "High" if hybrid else ("Low" if action in ("Keep", "Harden", "Inspect", "Monitor") else "Medium")
        nist_standard = NIST_STANDARDS.get(primary) if primary else None
        if action == "Harden":
            timeline_urgency = "PLANNED"
        if action == "Inspect":
            timeline_urgency = "MONITORING" if risk_band == "LOW" else timeline_urgency
        return action, primary, hybrid, rationale, effort, nist_standard, timeline_urgency

    for map_key, (primary, hybrid, action) in sorted(PQC_MAP.items(), key=lambda x: len(x[0]), reverse=True):
        map_u = map_key.upper().replace("_", "-")
        if map_u == key or key.startswith(map_u + "-"):
            if use in _NO_KEM_USES and primary and "ML-KEM" in primary:
                primary, hybrid, action = None, None, "Keep"
            rationale = (
                f"Use-case: {use}. {algorithm} is mapped to {primary or 'no change'} per NIST guidance."
            )
            effort = "High" if hybrid else ("Low" if action in ("Keep", "Harden", "Inspect", "Monitor") else "Medium")
            nist_standard = NIST_STANDARDS.get(primary) if primary else None
            return action, primary, hybrid, rationale, effort, nist_standard, timeline_urgency

    if risk_band in ("CRITICAL", "HIGH"):
        if prim == "signature" or use == "signature":
            return (
                "Migrate",
                "ML-DSA-65",
                "ECDSA-P256+ML-DSA-65",
                "Use-case: signature. Unmapped signature primitive — default NIST signature replacement (FIPS 204), not ML-KEM.",
                "Medium",
                "FIPS 204",
                timeline_urgency,
            )
        if prim in ("kem", "key-agree", "pke") or use == "kem":
            return (
                "Migrate",
                "ML-KEM-768",
                "X25519MLKEM768",
                "Use-case: kem. Unmapped key-exchange primitive — default NIST KEM replacement (FIPS 203).",
                "Medium",
                "FIPS 203",
                timeline_urgency,
            )
        if prim == "hash" or use == "hash":
            return (
                "Monitor",
                None,
                None,
                "Use-case: hash. Review manually — hash functions have no direct PQC primitive replacement (never ML-KEM).",
                "Low",
                None,
                timeline_urgency,
            )
    return "Monitor", None, None, f"Use-case: {use}. Review manually for PQC migration path.", "Low", None, timeline_urgency

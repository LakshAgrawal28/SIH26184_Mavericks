"""Quantum vulnerability scores and PQC mapping."""

from __future__ import annotations

import re

ALGORITHM_QV = {
    "RSA": 10.0,
    "RSA-1024": 10.0,
    "RSA-2048": 10.0,
    "RSA-4096": 10.0,
    "ECDH": 10.0,
    "ECDSA": 10.0,
    "Ed25519": 10.0,
    "X25519": 10.0,
    "DH": 10.0,
    "DSA": 10.0,
    "AES": 2.5,
    "AES-128": 3.0,
    "AES-192": 2.0,
    "AES-256": 1.5,
    "AES-256-GCM": 1.5,
    "AES-GCM": 1.5,
    "SHA-256": 1.5,
    "SHA-384": 1.5,
    "SHA-512": 1.5,
    "SHA-1": 8.0,
    "MD5": 10.0,
    "DES": 10.0,
    "3DES": 9.0,
    "RC4": 10.0,
    "ML-KEM-768": 0.0,
    "ML-DSA": 0.0,
    "ML-DSA-65": 0.0,
    "SLH-DSA": 0.0,
    "CHACHA20": 1.5,
    "POLY1305": 1.0,
    "DH-1024": 10.0,
    "DSA-1024": 10.0,
    "RSA/ECB": 10.0,
    "RSA/ECB/PKCS1PADDING": 10.0,
    "ML-KEM-512": 0.0,
    "ML-KEM-1024": 0.0,
    "ML-DSA-44": 0.0,
    "ML-DSA-87": 0.0,
    "SLH-DSA-128S": 0.0,
    "HS256": 2.5,
    "RS256": 10.0,
    "ES256": 10.0,
    "PS256": 10.0,
    "JWT": 4.0,
    "JSONWEBTOKEN": 4.0,
    "JWT.SIGN": 4.0,
    "BCRYPT": 3.0,
    "TLS": 5.5,
    "TLS-1.0": 9.0,
    "TLS-1.1": 9.0,
    "TLS-INSECURESKIPVERIFY": 8.0,
    "HMAC": 2.5,
    "PBKDF2": 4.0,
    "SCRYPT": 3.0,
    "ARGON2": 2.0,
    "WEBCRYPTO": 4.0,
    "NODE-CRYPTO": 4.0,
    "PRIVATE-KEY": 9.0,
    "PKCS12": 8.0,
    "JAVA-KEYSTORE": 8.0,
    "X.509": 8.0,
    "SSL": 5.5,
    "OPENSSL": 4.0,
    "PASSLIB": 3.0,
    "PASSWORD-HASH": 3.0,
    "TLS-1.2": 4.0,
    "TLS-RSA-WITH-RC4": 9.0,
    "TLS-RSA-WITH-3DES": 9.0,
}

# Shor-broken public-key vs Grover-only symmetric vs classically broken vs PQC.
QUANTUM_BREAK = {
    "RSA": "shor",
    "RSA-1024": "shor",
    "RSA-2048": "shor",
    "RSA-4096": "shor",
    "ECDH": "shor",
    "ECDSA": "shor",
    "Ed25519": "shor",
    "X25519": "shor",
    "DH": "shor",
    "DSA": "shor",
    "DH-1024": "shor",
    "DSA-1024": "shor",
    "RSA/ECB": "shor",
    "RSA/ECB/PKCS1PADDING": "shor",
    "RS256": "shor",
    "ES256": "shor",
    "PS256": "shor",
    "PRIVATE-KEY": "shor",
    "PKCS12": "shor",
    "JAVA-KEYSTORE": "shor",
    "X.509": "shor",
    "AES": "grover",
    "AES-128": "grover",
    "AES-192": "grover",
    "AES-256": "grover",
    "AES-256-GCM": "grover",
    "AES-GCM": "grover",
    "SHA-256": "grover",
    "SHA-384": "grover",
    "SHA-512": "grover",
    "CHACHA20": "grover",
    "POLY1305": "grover",
    "HS256": "grover",
    "HMAC": "grover",
    "BCRYPT": "grover",
    "PBKDF2": "grover",
    "SCRYPT": "grover",
    "ARGON2": "grover",
    "SHA-1": "broken_classical",
    "MD5": "broken_classical",
    "DES": "broken_classical",
    "3DES": "broken_classical",
    "RC4": "broken_classical",
    "TLS-1.0": "broken_classical",
    "TLS-1.1": "broken_classical",
    "TLS-INSECURESKIPVERIFY": "broken_classical",
    "ML-KEM-768": "none",
    "ML-DSA": "none",
    "ML-DSA-65": "none",
    "SLH-DSA": "none",
    "ML-KEM-512": "none",
    "ML-KEM-1024": "none",
    "ML-DSA-44": "none",
    "ML-DSA-87": "none",
    "SLH-DSA-128S": "none",
    "JWT": "inspect",
    "JSONWEBTOKEN": "inspect",
    "JWT.SIGN": "inspect",
    "TLS": "unknown",
    "SSL": "unknown",
    "WEBCRYPTO": "unknown",
    "NODE-CRYPTO": "unknown",
    "OPENSSL": "unknown",
    "PASSLIB": "unknown",
    "PASSWORD-HASH": "grover",
    "TLS-1.2": "unknown",
}

CLASSICAL_WEAKNESS = {
    "MD5": 10.0,
    "SHA-1": 8.0,
    "DES": 10.0,
    "3DES": 9.0,
    "RC4": 10.0,
    "RSA/ECB": 9.0,
    "RSA/ECB/PKCS1PADDING": 9.0,
    "AES-128": 4.0,
    "DH-1024": 10.0,
    "TLS-1.0": 9.0,
    "TLS-1.1": 9.0,
}

PQC_MAP = {
    "RSA": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "RSA-2048": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "RSA-4096": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "ECDH": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "X25519": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "ECDSA": ("ML-DSA-65", "ECDSA-P256+ML-DSA-65", "Hybrid Migration"),
    "Ed25519": ("ML-DSA-65", "Ed25519+ML-DSA-65", "Hybrid Migration"),
    "DSA": ("ML-DSA-65", None, "Migrate"),
    "AES-128": ("AES-256-GCM", None, "Migrate"),
    "SHA-1": ("SHA-256", None, "Immediate Replacement"),
    "MD5": ("SHA-256", None, "Immediate Replacement"),
    "DES": ("AES-256-GCM", None, "Immediate Replacement"),
    "3DES": ("AES-256-GCM", None, "Immediate Replacement"),
    "AES": (None, None, "Keep"),
    "AES-256": (None, None, "Keep"),
    "AES-256-GCM": (None, None, "Keep"),
    "AES-GCM": (None, None, "Keep"),
    "SHA-256": (None, None, "Keep"),
    "SHA-384": (None, None, "Keep"),
    "SHA-512": (None, None, "Keep"),
    "ML-KEM-768": (None, None, "Keep"),
    "ML-DSA": (None, None, "Keep"),
    "ML-DSA-65": (None, None, "Keep"),
    "RC4": ("AES-256-GCM", None, "Immediate Replacement"),
    "CHACHA20": (None, None, "Keep"),
    "POLY1305": (None, None, "Keep"),
    "DH-1024": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "DSA-1024": ("ML-DSA-65", None, "Migrate"),
    "RSA/ECB": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "RSA/ECB/PKCS1PADDING": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "ML-KEM-512": (None, None, "Keep"),
    "ML-KEM-1024": (None, None, "Keep"),
    "ML-DSA-44": (None, None, "Keep"),
    "ML-DSA-87": (None, None, "Keep"),
    "SLH-DSA-128S": (None, None, "Keep"),
    "HS256": (None, None, "Keep"),
    "RS256": ("ML-DSA-65", "RSA + ML-DSA-65", "Hybrid Migration"),
    "ES256": ("ML-DSA-65", "ECDSA-P256+ML-DSA-65", "Hybrid Migration"),
    "PS256": ("ML-DSA-65", "RSA + ML-DSA-65", "Hybrid Migration"),
    "JWT": (None, None, "Inspect"),
    "JSONWEBTOKEN": (None, None, "Inspect"),
    "JWT.SIGN": (None, None, "Inspect"),
    "BCRYPT": ("Argon2id", None, "Harden"),
    "TLS": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "TLS-1.0": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Immediate Replacement"),
    "TLS-1.1": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Immediate Replacement"),
    "TLS-INSECURESKIPVERIFY": ("TLS 1.3 with verification", None, "Immediate Replacement"),
    "HMAC": (None, None, "Keep"),
    "PBKDF2": ("Argon2id", None, "Harden"),
    "SCRYPT": ("Argon2id", None, "Harden"),
    "ARGON2": (None, None, "Keep"),
    "WEBCRYPTO": (None, None, "Inspect"),
    "NODE-CRYPTO": (None, None, "Inspect"),
    "PRIVATE-KEY": (None, None, "Inspect"),
    "PKCS12": (None, None, "Inspect"),
    "JAVA-KEYSTORE": (None, None, "Inspect"),
    "OPENSSL": (None, None, "Inspect"),
    "PASSLIB": ("Argon2id", None, "Harden"),
    "PASSWORD-HASH": ("Argon2id", None, "Harden"),
    "TLS-1.2": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Monitor"),
    "TLS-RSA-WITH-RC4": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Immediate Replacement"),
    "TLS-RSA-WITH-3DES": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Immediate Replacement"),
    "X.509": ("ML-DSA-65", "RSA + ML-DSA-65", "Hybrid Migration"),
    "SSL": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
}

# Z = years until a CRQC can break relevant crypto. Values are internal planning
# estimates for scenario comparison — not a single external forecast. See docs/RISK_MODEL.md.
MOSCA_SCENARIOS = [
    {"name": "Optimistic", "z_value": 15.0},
    {"name": "Baseline", "z_value": 10.0},
    {"name": "Aggressive", "z_value": 5.0},
    {"name": "Regulatory", "z_value": 7.0},
]

_SYMMETRIC_PRIMITIVES = frozenset({"hash", "mac", "block-cipher", "kdf", "ae", "stream-cipher"})
_SHOR_TOKENS = ("RSA", "ECDSA", "ECDH", "ED25519", "X25519", "DSA", "ECDHE", "DH")
_SHOR_TOKEN_RE = re.compile(
    r"(?:^|[^A-Z0-9])(" + "|".join(_SHOR_TOKENS) + r")(?:[^A-Z0-9]|$)",
    re.IGNORECASE,
)

_TAXONOMY_LOOKUP_KEYS = tuple(
    sorted(
        {k.upper().replace("_", "-") for k in ALGORITHM_QV} | {k.upper().replace("_", "-") for k in PQC_MAP},
        key=len,
        reverse=True,
    )
)
# Short tokens must not match inside unrelated names (e.g. SSL inside PASSLIB / OPENSSL).
_BOUNDARY_TAXONOMY_TOKENS = frozenset(
    {
        "SSL",
        "TLS",
        "DES",
        "RSA",
        "AES",
        "MD5",
        "DH",
        "JWT",
        "LIB",
        "RC4",
        "HMAC",
    }
)


def _taxonomy_token_in_norm(token: str, norm: str) -> bool:
    tok = token.upper().replace("_", "-")
    if tok in _BOUNDARY_TAXONOMY_TOKENS:
        return bool(
            re.search(
                r"(?:^|[^A-Z0-9])" + re.escape(tok) + r"(?:[^A-Z0-9]|$)",
                norm,
                re.IGNORECASE,
            )
        )
    return tok in norm or norm.startswith(tok)


def _normalize_algorithm_string(raw: str) -> str:
    u = raw.upper().strip().replace("_", "-").replace(" ", "")
    u = re.sub(r"AES(\d{3})", r"AES-\1", u)
    u = re.sub(r"RSA(\d{4})", r"RSA-\1", u)
    if "JSONWEBTOKEN" in u or "JWT" in u:
        if "RS256" in u:
            return "RS256"
        if "ES256" in u:
            return "ES256"
        if "PS256" in u:
            return "PS256"
        if "HS256" in u:
            return "HS256"
        return "JWT"
    if "BCRYPT" in u:
        return "BCRYPT"
    if "INSECURESKIPVERIFY" in u:
        return "TLS-INSECURESKIPVERIFY"
    if "TLS-1.0" in u or "TLSV1" in u:
        return "TLS-1.0"
    if "TLS-1.1" in u:
        return "TLS-1.1"
    if "TLS1.2" in u or "TLSV1.2" in u or "VERSIONTLS12" in u:
        return "TLS-1.2"
    if re.search(r"(?:^|[^A-Z0-9])TLS(?:[^A-Z0-9]|$)", u) and "ML-KEM" not in u:
        return "TLS"
    if "TLS_RSA_WITH_RC4" in u or "TLS-RSA-WITH-RC4" in u:
        return "TLS-RSA-WITH-RC4"
    if "TLS_RSA_WITH_3DES" in u or "TLS-RSA-WITH-3DES" in u:
        return "TLS-RSA-WITH-3DES"
    if u in ("PASSLIB", "PASSLIB[BCRYPT]") or u.startswith("PASSLIB"):
        return "PASSLIB"
    if "OPENSSL" in u and "LIBOQS" not in u:
        return "OPENSSL"
    return u


def _taxonomy_key_for_normalized(norm: str) -> str | None:
    for lookup in _TAXONOMY_LOOKUP_KEYS:
        if _taxonomy_token_in_norm(lookup, norm) or norm.startswith(lookup):
            for source_key in ALGORITHM_QV:
                if source_key.upper().replace("_", "-") == lookup:
                    return source_key
            for source_key in PQC_MAP:
                if source_key.upper().replace("_", "-") == lookup:
                    return source_key
            return lookup
    return None


def canonicalize_algorithm(raw: str | None) -> tuple[str | None, bool]:
    """Return (canonical taxonomy name, mapped_to_taxonomy).

    When mapped, canonical is the ALGORITHM_QV / PQC_MAP dictionary key (e.g. ``AES-256``).
    When unmapped, canonical is the normalized detector string for traceability.
    """
    if not raw or not str(raw).strip():
        return None, False
    norm = _normalize_algorithm_string(str(raw))
    matched = _taxonomy_key_for_normalized(norm)
    if matched:
        return matched, True
    return norm, False


def _norm_primitive(primitive: str | None) -> str:
    return (primitive or "").strip().lower().replace("_", "-")


def _is_shor_algorithm(text: str | None) -> bool:
    if not text:
        return False
    canonical, mapped = canonicalize_algorithm(text)
    if mapped and canonical and QUANTUM_BREAK.get(canonical) == "shor":
        if canonical in ("PRIVATE-KEY", "PKCS12", "JAVA-KEYSTORE", "X.509"):
            return True
        return canonical not in ("JWT", "JSONWEBTOKEN", "JWT.SIGN")
    blob = (canonical or text).upper().replace("_", "-")
    return bool(_SHOR_TOKEN_RE.search(blob))


def get_qv(algorithm: str | None, primitive: str | None = None) -> float:
    if not algorithm:
        return 5.0
    prim = _norm_primitive(primitive)
    canonical, mapped = canonicalize_algorithm(algorithm)
    if mapped and canonical:
        qv = float(ALGORITHM_QV[canonical])
        if prim in _SYMMETRIC_PRIMITIVES and QUANTUM_BREAK.get(canonical) == "shor" and not _is_shor_algorithm(canonical):
            return min(qv, 2.5)
        return qv
    key = (canonical or algorithm).upper().replace("_", "-")
    if prim in _SYMMETRIC_PRIMITIVES and not _is_shor_algorithm(key):
        return 2.5
    if _is_shor_algorithm(key):
        return 10.0
    return 5.0


def get_quantum_break(algorithm: str | None, primitive: str | None = None) -> str:
    if not algorithm:
        return "unknown"
    prim = _norm_primitive(primitive)
    canonical, mapped = canonicalize_algorithm(algorithm)
    if mapped and canonical:
        cls = QUANTUM_BREAK.get(canonical, "unknown")
        if prim in _SYMMETRIC_PRIMITIVES and cls == "shor" and not _is_shor_algorithm(canonical):
            return "grover"
        return cls
    key = (canonical or algorithm).upper().replace("_", "-")
    if prim in _SYMMETRIC_PRIMITIVES and not _is_shor_algorithm(key):
        return "grover"
    if _is_shor_algorithm(key):
        return "shor"
    return "unknown"


def classify_use_case(
    algorithm: str | None,
    primitive: str | None = None,
    asset_type: str | None = None,
) -> str:
    prim = _norm_primitive(primitive)
    asset = (asset_type or "").strip().lower().replace("_", "-")
    canonical, mapped = canonicalize_algorithm(algorithm) if algorithm else (None, False)
    key = (canonical or algorithm or "").upper()

    if prim == "signature":
        return "signature"
    if prim in ("kem", "key-agree", "pke"):
        return "kem"
    if prim == "encryption":
        return "kem" if _is_shor_algorithm(algorithm) else "symmetric"
    if prim == "hash":
        return "hash"
    if prim == "mac":
        return "mac"
    if prim in ("block-cipher", "ae", "stream-cipher", "symmetric"):
        return "symmetric"
    if prim == "kdf":
        return "kdf"
    if prim in ("protocol", "tls"):
        return "protocol"
    if prim in ("certificate", "x509"):
        return "certificate"
    if prim in ("library",):
        return "library"
    if prim in ("material", "key-material", "related-crypto-material"):
        return "material"
    if asset in ("related-crypto-material",):
        return "material"

    if mapped and canonical:
        if canonical in (
            "JWT",
            "JSONWEBTOKEN",
            "JWT.SIGN",
            "WEBCRYPTO",
            "NODE-CRYPTO",
            "OPENSSL",
            "PASSLIB",
            "PASSWORD-HASH",
        ):
            return "library"
        if canonical in ("TLS", "TLS-1.0", "TLS-1.1", "TLS-INSECURESKIPVERIFY", "SSL"):
            return "protocol"
        if canonical in ("HS256", "HMAC", "POLY1305"):
            return "mac"
        if canonical in ("SHA-1", "SHA-256", "SHA-384", "SHA-512", "MD5"):
            return "hash"
        if canonical in ("BCRYPT", "PBKDF2", "SCRYPT", "ARGON2"):
            return "kdf"
        if canonical in (
            "AES",
            "AES-128",
            "AES-192",
            "AES-256",
            "AES-256-GCM",
            "AES-GCM",
            "CHACHA20",
            "DES",
            "3DES",
            "RC4",
        ):
            return "symmetric"
        if canonical in ("TLS-RSA-WITH-RC4", "TLS-RSA-WITH-3DES"):
            return "protocol"
        if canonical in ("ECDSA", "Ed25519", "DSA", "DSA-1024", "RS256", "ES256", "PS256"):
            return "signature"
        if canonical in (
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
        ):
            return "kem"
        if canonical == "X.509":
            return "certificate"
        if canonical in ("PKCS12", "PRIVATE-KEY", "JAVA-KEYSTORE"):
            return "material"
        if canonical.startswith("ML-KEM"):
            return "kem"
        if canonical.startswith("ML-DSA") or canonical.startswith("SLH-DSA"):
            return "signature"

    if asset == "certificate":
        return "certificate"
    if asset == "library":
        return "library"
    if re.search(r"(?:^|[^A-Z0-9])TLS(?:[^A-Z0-9]|$)", key) or key == "SSL":
        return "protocol"
    return "unknown"


def get_classical_weakness(name: str, mode: str | None = None) -> float:
    combined = f"{name} {mode or ''}".upper()
    for k, v in CLASSICAL_WEAKNESS.items():
        if k in combined:
            return v
    return 2.0

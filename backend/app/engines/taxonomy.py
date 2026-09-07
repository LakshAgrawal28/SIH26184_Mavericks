"""Quantum vulnerability scores and PQC mapping."""

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
    "AES-128": 4.0,
    "AES-192": 3.0,
    "AES-256": 2.0,
    "AES-256-GCM": 2.0,
    "SHA-256": 3.0,
    "SHA-384": 2.0,
    "SHA-512": 2.0,
    "SHA-1": 8.0,
    "MD5": 10.0,
    "DES": 10.0,
    "3DES": 9.0,
    "RC4": 10.0,
    "ML-KEM-768": 0.0,
    "ML-DSA-65": 0.0,
    "SLH-DSA": 0.0,
    "RC4": 10.0,
    "CHACHA20": 1.0,
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
    "HS256": 6.0,
    "RS256": 10.0,
    "ES256": 10.0,
    "JWT": 9.0,
    "JSONWEBTOKEN": 9.0,
    "JWT.SIGN": 9.0,
    "BCRYPT": 3.0,
    "TLS": 8.0,
    "TLS-1.0": 9.0,
    "TLS-1.1": 9.0,
    "TLS-INSECURESKIPVERIFY": 8.0,
    "HMAC": 5.0,
    "PBKDF2": 4.0,
    "SCRYPT": 3.0,
    "ARGON2": 2.0,
    "WEBCRYPTO": 7.0,
    "NODE-CRYPTO": 7.0,
    "PRIVATE-KEY": 9.0,
    "PKCS12": 8.0,
    "JAVA-KEYSTORE": 8.0,
    "X.509": 8.0,
    "SSL": 8.0,
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
    "AES-256": (None, None, "Keep"),
    "AES-256-GCM": (None, None, "Keep"),
    "SHA-256": (None, None, "Keep"),
    "ML-KEM-768": (None, None, "Keep"),
    "ML-DSA-65": (None, None, "Keep"),
    "RC4": ("AES-256-GCM", None, "Immediate Replacement"),
    "CHACHA20": (None, None, "Keep"),
    "DH-1024": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "DSA-1024": ("ML-DSA-65", None, "Migrate"),
    "RSA/ECB": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "RSA/ECB/PKCS1PADDING": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "ML-KEM-512": (None, None, "Keep"),
    "ML-KEM-1024": (None, None, "Keep"),
    "ML-DSA-44": (None, None, "Keep"),
    "ML-DSA-87": (None, None, "Keep"),
    "SLH-DSA-128S": (None, None, "Keep"),
    "HS256": ("ML-DSA-65", None, "Migrate"),
    "RS256": ("ML-DSA-65", "RSA + ML-DSA-65", "Hybrid Migration"),
    "ES256": ("ML-DSA-65", "ECDSA-P256+ML-DSA-65", "Hybrid Migration"),
    "JWT": ("ML-DSA-65", "Ed25519+ML-DSA-65", "Hybrid Migration"),
    "JSONWEBTOKEN": ("ML-DSA-65", "Ed25519+ML-DSA-65", "Hybrid Migration"),
    "JWT.SIGN": ("ML-DSA-65", "Ed25519+ML-DSA-65", "Hybrid Migration"),
    "BCRYPT": ("Argon2id", None, "Harden"),
    "TLS": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "TLS-1.0": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Immediate Replacement"),
    "TLS-1.1": ("TLS 1.3 + ML-KEM-768", "X25519MLKEM768", "Immediate Replacement"),
    "TLS-INSECURESKIPVERIFY": ("TLS 1.3 with verification", None, "Immediate Replacement"),
    "HMAC": ("SHA-256", None, "Harden"),
    "PBKDF2": ("Argon2id", None, "Harden"),
    "SCRYPT": ("Argon2id", None, "Harden"),
    "WEBCRYPTO": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "NODE-CRYPTO": ("ML-KEM-768", "X25519MLKEM768", "Hybrid Migration"),
    "PRIVATE-KEY": ("ML-DSA-65", None, "Migrate"),
    "PKCS12": ("ML-DSA-65", None, "Migrate"),
    "JAVA-KEYSTORE": ("ML-DSA-65", None, "Migrate"),
    "X.509": ("ML-DSA-65", "RSA + ML-DSA-65", "Hybrid Migration"),
}

MOSCA_SCENARIOS = [
    {"name": "Optimistic", "z_value": 15.0},
    {"name": "Baseline", "z_value": 10.0},
    {"name": "Aggressive", "z_value": 5.0},
    {"name": "Regulatory", "z_value": 7.0},
]


def get_qv(algorithm: str | None) -> float:
    if not algorithm:
        return 5.0
    key = algorithm.upper().replace("_", "-")
    for k, v in sorted(ALGORITHM_QV.items(), key=lambda x: len(x[0]), reverse=True):
        if k in key or key.startswith(k):
            return v
    if any(x in key for x in ("RSA", "EC", "ED25519", "X25519")):
        return 10.0
    return 5.0


def get_classical_weakness(name: str, mode: str | None = None) -> float:
    combined = f"{name} {mode or ''}".upper()
    for k, v in CLASSICAL_WEAKNESS.items():
        if k in combined:
            return v
    return 2.0

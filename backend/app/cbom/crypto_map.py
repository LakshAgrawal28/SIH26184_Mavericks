"""Map internal artefact fields onto CycloneDX 1.6 crypto property enums."""
from __future__ import annotations

from app.engines.taxonomy import get_qv

_PRIMITIVES = {
    "drbg", "mac", "block-cipher", "stream-cipher", "signature", "hash",
    "pke", "xof", "kdf", "key-agree", "kem", "ae", "combiner", "other", "unknown",
}

_MODES = {"cbc", "ecb", "ccm", "gcm", "cfb", "ofb", "ctr", "other", "unknown"}
_PADDINGS = {"pkcs5", "pkcs7", "pkcs1v15", "oaep", "raw", "other", "unknown"}


def map_primitive(algorithm: str | None, primitive: str | None, mode: str | None) -> str:
    raw = (primitive or "").strip().lower().replace("_", "-")
    if raw in _PRIMITIVES:
        return raw
    blob = f"{algorithm or ''} {primitive or ''} {mode or ''}".upper()
    if any(x in blob for x in ("ML-KEM", "KYBER", "KEM")):
        return "kem"
    if any(x in blob for x in ("ML-DSA", "DILITHIUM", "SLH-DSA", "SPHINCS", "ECDSA", "ED25519", "DSA")):
        return "signature"
    if any(x in blob for x in ("ECDH", "X25519", "KEY-AGREE", "KEYAGREE")):
        return "key-agree"
    if "GCM" in blob:
        return "ae"
    if any(x in blob for x in ("CHACHA", "RC4", "SALSA")):
        return "stream-cipher"
    if any(x in blob for x in ("HMAC", "HS256", "HS384", "HS512", "POLY1305")):
        return "mac"
    if any(x in blob for x in ("SHA", "MD5", "HASH", "DIGEST")):
        return "hash"
    if any(x in blob for x in ("AES", "DES", "3DES", "DESEDE")):
        return "block-cipher"
    if "RSA" in blob or "PKE" in blob:
        return "pke"
    if "PROTOCOL" in blob or "TLS" in blob:
        return "other"
    return "unknown"


def map_mode(algorithm: str | None, mode: str | None) -> str | None:
    blob = f"{algorithm or ''} {mode or ''}".upper()
    for candidate in ("GCM", "CCM", "CBC", "ECB", "CTR", "CFB", "OFB"):
        if candidate in blob:
            value = candidate.lower()
            return value if value in _MODES else None
    return None


def map_padding(algorithm: str | None, mode: str | None, name: str | None) -> str | None:
    blob = f"{algorithm or ''} {mode or ''} {name or ''}".upper()
    if "OAEP" in blob:
        return "oaep"
    if "PKCS1" in blob:
        return "pkcs1v15"
    if "PKCS5" in blob:
        return "pkcs5"
    if "PKCS7" in blob:
        return "pkcs7"
    if "NOPADDING" in blob or "NO PADDING" in blob:
        return "raw"
    return None


def map_nist_qsl(algorithm: str | None, final_risk: float | None = None) -> int:
    blob = (algorithm or "").upper()
    if any(x in blob for x in ("ML-KEM-1024", "ML-DSA-87", "SLH-DSA")):
        return 5
    if any(x in blob for x in ("ML-KEM-768", "ML-DSA-65")):
        return 3
    if any(x in blob for x in ("ML-KEM-512", "ML-DSA-44", "AES-256", "SHA-256", "SHA3", "CHACHA")):
        return 1 if "AES-128" not in blob else 1
    if "AES-256" in blob:
        return 5
    if "AES-192" in blob:
        return 3
    if "AES-128" in blob:
        return 1
    qv = get_qv(algorithm)
    if qv >= 8:
        return 0
    if final_risk is not None and final_risk >= 7:
        return 0
    if qv <= 2:
        return 2
    return 1


def classical_bits(algorithm: str | None, key_size: str | None) -> int | None:
    blob = (algorithm or "").upper()
    size = 0
    if key_size:
        digits = "".join(ch for ch in str(key_size) if ch.isdigit())
        if digits:
            size = int(digits)
    if "RSA" in blob:
        if size >= 4096 or "4096" in blob:
            return 152
        if size >= 3072 or "3072" in blob:
            return 128
        return 112
    if any(x in blob for x in ("AES-256", "SHA-256", "SHA3-256")):
        return 256
    if "AES-192" in blob:
        return 192
    if "AES-128" in blob:
        return 128
    if "MD5" in blob:
        return 64
    if "SHA-1" in blob or "SHA1" in blob:
        return 80
    return None

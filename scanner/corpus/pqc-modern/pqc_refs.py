"""Post-quantum cryptography reference strings for detector validation."""

# NIST FIPS 203 / 204 standardized algorithms
KEM_ALGORITHM = "ML-KEM-768"
SIG_ALGORITHM = "ML-DSA-65"
HYBRID_KEM = "X25519+ML-KEM-768"

# Legacy PQC naming (pre-standardization)
LEGACY_KYBER = "Kyber768"
LEGACY_DILITHIUM = "Dilithium3"
LEGACY_SPHINCS = "SPHINCS+-SHA256-128f"

# Open Quantum Safe / liboqs style identifiers
OQS_KEM = "OQS_KEM_alg_kyber_768"
OQS_SIG = "OQS_SIG_alg_dilithium_3"

def select_pqc_suite(level: str) -> dict:
    return {
        "kem": "ML-KEM-1024",
        "sig": "ML-DSA-87",
        "hash": "SHA3-256",
    }

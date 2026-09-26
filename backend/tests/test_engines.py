import pytest
from app.engines.mosca_engine import compute_mosca
from app.engines.pqc_engine import recommend
from app.engines.risk_engine import compute_risk
from app.engines.cert_expiry import compute_expiry_urgency
from app.engines.taxonomy import (
    canonicalize_algorithm,
    classify_use_case,
    get_qv,
    get_quantum_break,
    PQC_MAP,
)


def test_risk_rsa_critical():
    hndl, op, final, band = compute_risk(
        algorithm="RSA-2048",
        mode=None,
        sensitivity=8,
        lifetime_years=10.0,
        exposure=8,
        criticality=8,
        confidence=1.0,
    )
    assert final >= 7.5
    assert band == "CRITICAL"


def test_mosca_expired_baseline():
    result = compute_mosca(x=15.0, y=5.0, final_risk=8.0)
    assert result["overall_category"] == "EXPIRED"


def test_pqc_rsa_recommendation():
    action, primary, hybrid, _, _, _, _ = recommend("RSA-2048", "CRITICAL")
    assert action == "Hybrid Migration"
    assert primary == "ML-KEM-768"
    assert hybrid == "X25519MLKEM768"


def test_pqc_jwt_library_and_bcrypt():
    action, primary, _, rationale, _, _, _ = recommend("jsonwebtoken@^9.0.3", "MEDIUM")
    assert action == "Inspect"
    assert primary is None
    assert "not Shor-broken" in rationale or "alg header" in rationale
    hs_action, hs_primary, _, _, _, _, _ = recommend("jwt.sign", "LOW")
    assert hs_action == "Inspect"
    assert hs_primary is None
    harden, pqc, _, _, _, _, _ = recommend("bcrypt", "LOW")
    assert harden == "Harden"
    assert pqc == "Argon2id"


class TestCertExpiry:
    def test_expired_cert(self):
        mult, label = compute_expiry_urgency(-5)
        assert mult == 3.0
        assert label == "EXPIRED"

    def test_critical_cert(self):
        mult, label = compute_expiry_urgency(15)
        assert mult == 2.5
        assert label == "CRITICAL"

    def test_warning_cert(self):
        mult, label = compute_expiry_urgency(60)
        assert mult == 1.8
        assert label == "WARNING"

    def test_active_cert(self):
        mult, label = compute_expiry_urgency(365)
        assert mult == 1.0
        assert label == "ACTIVE"

    def test_unknown_cert(self):
        mult, label = compute_expiry_urgency(None)
        assert label == "UNKNOWN"


class TestNewTaxonomy:
    @pytest.mark.parametrize("algo", ["RC4", "RSA/ECB/PKCS1PADDING", "DH-1024"])
    def test_high_qv_entries(self, algo):
        assert get_qv(algo) >= 9.0

    @pytest.mark.parametrize("algo", ["ML-KEM-512", "ML-KEM-1024", "ML-DSA-87", "SLH-DSA-128S"])
    def test_pqc_safe_entries(self, algo):
        assert get_qv(algo) == 0.0

    @pytest.mark.parametrize("algo", ["RSA/ECB/PKCS1PADDING", "DH-1024", "RC4"])
    def test_pqc_map_coverage(self, algo):
        # All dangerous algos should have a migration path
        key = algo.upper()
        found = any(k in key or key.startswith(k) for k in PQC_MAP)
        assert found, f"{algo} not in PQC_MAP"


class TestPqcEngineNistField:
    def test_rsa_returns_nist_standard(self):
        result = recommend("RSA-2048", "HIGH")
        assert len(result) == 7
        action, primary, hybrid, rationale, effort, nist_std, urgency = result
        assert primary == "ML-KEM-768"
        assert nist_std == "FIPS 203"
        assert urgency == "IMMEDIATE"

    def test_md5_immediate_replacement(self):
        result = recommend("MD5", "HIGH")
        action, primary = result[0], result[1]
        assert action == "Immediate Replacement"
        assert primary == "SHA-256"

    def test_aes256_keep(self):
        result = recommend("AES-256", "LOW")
        action, primary = result[0], result[1]
        assert action == "Keep"
        assert primary is None


class TestAlgorithmCanonicalization:
    def test_unknown_algo_flagged_unmapped(self):
        canonical, mapped = canonicalize_algorithm("TotallyUnknownCryptoXYZ")
        assert mapped is False
        assert canonical == "TOTALLYUNKNOWNCRYPTOXYZ"

    def test_aes_variants_same_canonical(self):
        c1, m1 = canonicalize_algorithm("aes-256-cbc")
        c2, m2 = canonicalize_algorithm("AES256")
        assert m1 and m2
        assert c1 == c2 == "AES-256"

    def test_unrecognized_signature_critical_not_mlkem(self):
        action, primary, hybrid, *_ = recommend(
            "TotallyUnknownSigAlgo",
            "CRITICAL",
            primitive="signature",
        )
        assert primary != "ML-KEM-768"
        assert primary == "ML-DSA-65"
        assert hybrid is not None


class TestPrimitiveAwareScoring:
    def test_aes256_high_sensitivity_not_critical(self):
        qv = get_qv("AES-256")
        assert qv < 3
        assert get_quantum_break("AES-256") == "grover"
        _, _, final, band = compute_risk(
            algorithm="AES-256",
            mode=None,
            sensitivity=10,
            lifetime_years=15.0,
            exposure=10,
            criticality=10,
            confidence=1.0,
        )
        assert band != "CRITICAL"
        assert band in ("LOW", "MEDIUM")
        assert final < 7.5

    def test_hs256_not_scored_like_rsa(self):
        assert get_qv("HS256") < 4
        action, primary, hybrid, rationale, *_ = recommend("HS256", "LOW")
        assert action in ("Keep", "Harden")
        assert action != "Hybrid Migration"
        assert primary not in ("ML-DSA-65", "ML-KEM-768")
        assert hybrid is None
        assert "Shor-broken" in rationale or "mac" in rationale.lower()

    def test_jsonwebtoken_inspect(self):
        action, primary, _, rationale, *_ = recommend("jsonwebtoken", "HIGH")
        assert action == "Inspect"
        assert primary is None
        assert "alg" in rationale.lower() or "not Shor-broken" in rationale

    def test_rsa_signature_recommends_ml_dsa(self):
        action, primary, hybrid, rationale, *_ = recommend(
            "RSA-2048",
            "CRITICAL",
            primitive="signature",
        )
        assert primary == "ML-DSA-65"
        assert "ML-KEM" not in (primary or "")
        assert hybrid is None or "ML-KEM" not in hybrid
        assert "signature" in rationale.lower()
        assert action in ("Hybrid Migration", "Migrate")

    def test_unmapped_not_shor_via_ec_substring(self):
        assert get_qv("SecretKeySpec") != 10
        assert get_qv("AES-GCM") != 10
        assert get_qv("AES-GCM") < 3
        assert get_quantum_break("SecretKeySpec") != "shor"
        assert classify_use_case("AES-256", "block-cipher") == "symmetric"

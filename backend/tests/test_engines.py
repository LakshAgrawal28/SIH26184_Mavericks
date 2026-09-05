import pytest
from app.engines.mosca_engine import compute_mosca
from app.engines.pqc_engine import recommend
from app.engines.risk_engine import compute_risk
from app.engines.cert_expiry import compute_expiry_urgency
from app.engines.taxonomy import get_qv, PQC_MAP


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
    action, primary, _, _, _, _, _ = recommend("jsonwebtoken@^9.0.3", "MEDIUM")
    assert action == "Hybrid Migration"
    assert primary == "ML-DSA-65"
    hs_action, _, _, _, _, _, _ = recommend("jwt.sign", "LOW")
    assert hs_action in ("Hybrid Migration", "Migrate")
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

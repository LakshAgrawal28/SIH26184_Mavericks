from app.engines.mosca_engine import compute_mosca
from app.engines.risk_engine import compute_risk
from app.engines.pqc_engine import recommend


def test_risk_rsa_critical():
    _, _, final, band = compute_risk("RSA-2048", "ECB", 8, 10, 8, 8, 0.95)
    assert band in ("CRITICAL", "HIGH")
    assert final >= 5.5


def test_mosca_expired_baseline():
    result = compute_mosca(x=10, y=4, final_risk=8)
    baseline = next(s for s in result["scenarios"] if s["name"] == "Baseline")
    assert baseline["category"] == "EXPIRED"


def test_pqc_rsa_recommendation():
    action, primary, hybrid, _, _ = recommend("RSA-2048", "CRITICAL")
    assert primary == "ML-KEM-768"
    assert hybrid == "X25519MLKEM768"

from app.db.session import SessionLocal
from app.models import Artefact, Scan, User


def _auth_headers(client) -> dict[str, str]:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "admin123"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _seed_pair(db, user: User) -> tuple[Scan, Scan]:
    baseline = Scan(
        name="baseline",
        status="completed",
        owner_id=user.id,
        data_lifetime_x=10.0,
        migration_time_y=4.0,
        critical_risk_count=2,
        high_risk_count=1,
    )
    current = Scan(
        name="after-remediation",
        status="completed",
        owner_id=user.id,
        parent_scan_id=None,
        data_lifetime_x=10.0,
        migration_time_y=4.0,
        critical_risk_count=1,
        high_risk_count=1,
    )
    db.add(baseline)
    db.add(current)
    db.flush()
    current.parent_scan_id = baseline.id
    db.add(
        Artefact(
            scan_id=baseline.id,
            bom_ref="crypto/algorithm/aaa",
            name="RSA-2048",
            asset_type="algorithm",
            risk_band="CRITICAL",
            final_risk_score=8.0,
        )
    )
    db.add(
        Artefact(
            scan_id=baseline.id,
            bom_ref="crypto/algorithm/bbb",
            name="MD5",
            asset_type="algorithm",
            risk_band="HIGH",
            final_risk_score=7.0,
        )
    )
    db.add(
        Artefact(
            scan_id=baseline.id,
            bom_ref="crypto/algorithm/ccc",
            name="AES-256",
            asset_type="algorithm",
            risk_band="LOW",
            final_risk_score=2.0,
        )
    )
    db.add(
        Artefact(
            scan_id=current.id,
            bom_ref="crypto/algorithm/aaa",
            name="RSA-2048",
            asset_type="algorithm",
            risk_band="HIGH",
            final_risk_score=6.5,
        )
    )
    db.add(
        Artefact(
            scan_id=current.id,
            bom_ref="crypto/algorithm/ccc",
            name="AES-256",
            asset_type="algorithm",
            risk_band="LOW",
            final_risk_score=2.0,
        )
    )
    db.add(
        Artefact(
            scan_id=current.id,
            bom_ref="crypto/algorithm/ddd",
            name="ML-KEM-768",
            asset_type="algorithm",
            risk_band="LOW",
            final_risk_score=0.5,
        )
    )
    db.commit()
    db.refresh(baseline)
    db.refresh(current)
    return baseline, current


def test_invalid_scan_id_returns_400(client):
    headers = _auth_headers(client)
    resp = client.get("/api/v1/scans/not-a-uuid", headers=headers)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Invalid scan ID"


def test_scan_diff_added_removed_and_risk_changes(client):
    headers = _auth_headers(client)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        baseline, current = _seed_pair(db, user)
    finally:
        db.close()

    resp = client.get(
        f"/api/v1/scans/{current.id}/diff",
        params={"against": str(baseline.id)},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["scan_id"] == str(current.id)
    assert body["against_scan_id"] == str(baseline.id)
    assert body["counts"]["added"] == 1
    assert body["counts"]["removed"] == 1
    assert body["counts"]["risk_band_changed"] == 1
    assert body["added"][0]["bom_ref"] == "crypto/algorithm/ddd"
    assert body["removed"][0]["bom_ref"] == "crypto/algorithm/bbb"
    assert body["risk_band_changed"][0]["bom_ref"] == "crypto/algorithm/aaa"
    assert body["risk_band_changed"][0]["previous_risk_band"] == "CRITICAL"
    assert body["risk_band_changed"][0]["risk_band"] == "HIGH"
    assert "transition" in body["mosca"]
    assert body["mosca"]["before"]["baseline_category"]
    assert body["mosca"]["after"]["baseline_category"]


def test_list_artefacts_limit_rejects_over_500(client):
    headers = _auth_headers(client)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        scan = Scan(name="many", status="completed", owner_id=user.id)
        db.add(scan)
        db.flush()
        for i in range(3):
            db.add(
                Artefact(
                    scan_id=scan.id,
                    bom_ref=f"crypto/algorithm/{i}",
                    name=f"item-{i}",
                    asset_type="algorithm",
                    risk_band="LOW",
                    final_risk_score=1.0,
                )
            )
        db.commit()
        scan_id = str(scan.id)
    finally:
        db.close()

    ok = client.get(f"/api/v1/scans/{scan_id}/artefacts?limit=500", headers=headers)
    assert ok.status_code == 200
    too_big = client.get(f"/api/v1/scans/{scan_id}/artefacts?limit=999999", headers=headers)
    assert too_big.status_code == 422

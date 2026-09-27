import uuid

from app.db.session import SessionLocal
from app.models import Artefact, Scan, User
from app.services.scan_diff import compute_scan_diff


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
    assert body["counts"]["score_changed"] == 1
    assert body["counts"]["total_before"] == 3
    assert body["counts"]["total_after"] == 3
    assert body["added"][0]["bom_ref"] == "crypto/algorithm/ddd"
    assert body["removed"][0]["bom_ref"] == "crypto/algorithm/bbb"
    assert body["risk_band_changed"][0]["bom_ref"] == "crypto/algorithm/aaa"
    assert body["risk_band_changed"][0]["previous_risk_band"] == "CRITICAL"
    assert body["risk_band_changed"][0]["risk_band"] == "HIGH"
    assert "transition" in body["mosca"]
    assert body["mosca"]["before"]["baseline_category"]
    assert body["mosca"]["after"]["baseline_category"]


def test_scan_diff_rejects_incomplete_self_and_newer_baselines(client):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        baseline, current = _seed_pair(db, user)
        current_id = str(current.id)
        baseline.status = "running"
        db.commit()
    finally:
        db.close()

    headers = _auth_headers(client)
    incomplete = client.get(
        f"/api/v1/scans/{current_id}/diff",
        params={"against": current_id},
        headers=headers,
    )
    assert incomplete.status_code == 400
    assert "itself" in incomplete.json()["detail"]

    db = SessionLocal()
    try:
        current = db.query(Scan).filter(Scan.id == uuid.UUID(current_id)).first()
        current.status = "completed"
        current.created_at = current.created_at.replace(year=2025)
        newer = Scan(name="newer", status="completed", owner_id=current.owner_id)
        db.add(newer)
        db.commit()
        newer_id = str(newer.id)
    finally:
        db.close()

    response = client.get(
        f"/api/v1/scans/{current_id}/diff",
        params={"against": newer_id},
        headers=headers,
    )
    assert response.status_code == 400
    assert "newer" in response.json()["detail"]


def test_scan_diff_reports_duplicate_bom_refs_deterministically(client):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        baseline = Scan(name="baseline", status="completed", owner_id=user.id)
        current = Scan(name="current", status="completed", owner_id=user.id)
        db.add_all([baseline, current])
        db.flush()
        for suffix in ("b", "a"):
            db.add(
                Artefact(
                    scan_id=current.id,
                    bom_ref="duplicate/ref",
                    name=suffix,
                    asset_type="algorithm",
                    risk_band="LOW",
                    final_risk_score=1.0,
                )
            )
        db.commit()
        result = compute_scan_diff(db, current, baseline)
        duplicate = result["duplicates"]["after"][0]
    finally:
        db.close()

    assert duplicate["bom_ref"] == "duplicate/ref"
    assert duplicate["count"] == 2
    assert duplicate["artefact_ids"] == sorted(duplicate["artefact_ids"])


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

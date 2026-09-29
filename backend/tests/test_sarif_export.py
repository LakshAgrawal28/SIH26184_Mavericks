import uuid

from app.db.session import SessionLocal
from app.models import Artefact, Scan, User
from app.sarif.builder import build_sarif


def _auth_headers(client) -> dict[str, str]:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "admin123"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _seed_scan_with_artefacts(db, user: User) -> Scan:
    scan = Scan(
        name="sarif-test-scan",
        status="completed",
        owner_id=user.id,
        total_artefacts=2,
    )
    db.add(scan)
    db.flush()
    db.add(
        Artefact(
            scan_id=scan.id,
            bom_ref="crypto/algorithm/rsa",
            name="RSA-2048",
            asset_type="algorithm",
            algorithm="RSA-2048",
            file_path="src/crypto.py",
            line_number=42,
            risk_band="CRITICAL",
            final_risk_score=8.5,
            recommendation_rationale="Replace RSA-2048 with ML-KEM hybrid before harvest-now-decrypt-later exposure.",
            raw_metadata={"quantum_break": "shor"},
        )
    )
    db.add(
        Artefact(
            scan_id=scan.id,
            bom_ref="crypto/algorithm/md5",
            name="MD5",
            asset_type="algorithm",
            algorithm="MD5",
            file_path="lib/hash.go",
            line_number=7,
            risk_band="MEDIUM",
            final_risk_score=4.0,
            recommendation_rationale="MD5 is classically broken; migrate to SHA-256 or stronger.",
            raw_metadata={"quantum_break": "broken_classical"},
        )
    )
    db.commit()
    db.refresh(scan)
    return scan


def test_build_sarif_structure():
    scan_id = uuid.uuid4()
    scan = Scan(id=scan_id, name="sarif-test-scan", status="completed")
    artefacts = [
        Artefact(
            scan_id=scan_id,
            bom_ref="crypto/algorithm/rsa",
            name="RSA-2048",
            asset_type="algorithm",
            algorithm="RSA-2048",
            file_path="src/crypto.py",
            line_number=42,
            risk_band="CRITICAL",
            final_risk_score=8.5,
            recommendation_rationale="Replace RSA-2048 with ML-KEM hybrid before harvest-now-decrypt-later exposure.",
            raw_metadata={"quantum_break": "shor"},
        ),
        Artefact(
            scan_id=scan_id,
            bom_ref="crypto/algorithm/md5",
            name="MD5",
            asset_type="algorithm",
            algorithm="MD5",
            file_path="lib/hash.go",
            line_number=7,
            risk_band="MEDIUM",
            final_risk_score=4.0,
            recommendation_rationale="MD5 is classically broken; migrate to SHA-256 or stronger.",
            raw_metadata={"quantum_break": "broken_classical"},
        ),
    ]
    doc = build_sarif(scan, artefacts)

    assert doc["version"] == "2.1.0"
    assert isinstance(doc["runs"], list) and len(doc["runs"]) == 1
    run = doc["runs"][0]
    assert run["automationDetails"]["guid"] == str(scan_id)
    assert run["automationDetails"]["description"]["text"] == "sarif-test-scan"
    assert len(run["results"]) == 2
    levels = {r["level"] for r in run["results"]}
    assert "error" in levels
    assert "warning" in levels
    rsa = next(r for r in run["results"] if r["ruleId"] == "ecdat/quantum-shor")
    assert rsa["locations"][0]["physicalLocation"]["artifactLocation"]["uri"] == "src/crypto.py"
    assert rsa["locations"][0]["physicalLocation"]["region"]["startLine"] == 42


def test_sarif_export_endpoint(client):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        scan = _seed_scan_with_artefacts(db, user)
        scan_id = str(scan.id)
    finally:
        db.close()

    headers = _auth_headers(client)
    resp = client.post(f"/api/v1/scans/{scan_id}/reports/sarif", headers=headers)
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"].startswith("application/sarif+json")
    body = resp.json()
    assert body["version"] == "2.1.0"
    assert body["runs"][0]["results"]
    assert "ecdat-sarif" in resp.headers.get("content-disposition", "")


def test_sarif_export_requires_ownership(client):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        scan = Scan(name="other-user-scan", status="completed", owner_id=user.id)
        db.add(scan)
        db.commit()
        scan_id = str(scan.id)
    finally:
        db.close()

    resp = client.post(f"/api/v1/scans/{scan_id}/reports/sarif")
    assert resp.status_code == 401

    headers = _auth_headers(client)
    ok = client.post(f"/api/v1/scans/{scan_id}/reports/sarif", headers=headers)
    assert ok.status_code == 200

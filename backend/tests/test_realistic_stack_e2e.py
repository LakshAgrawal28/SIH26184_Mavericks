"""End-to-end proof: uploading an unlabelled, judge-style zip via the real API
produces a non-empty scan, not the old '1111 files, 0 artefacts' failure."""
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
REALISTIC_ZIP = ROOT / "scanner" / "corpus" / "archives" / "realistic-stack.zip"


def _auth_headers(client) -> dict[str, str]:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "admin123"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.skipif(not REALISTIC_ZIP.is_file(), reason="run scanner/scripts/build_corpus_zips.py first")
def test_random_zip_upload_is_not_empty(client):
    headers = _auth_headers(client)
    with REALISTIC_ZIP.open("rb") as fh:
        resp = client.post(
            "/api/v1/scans",
            headers=headers,
            data={"name": "judge-random-zip-simulation", "target_type": "zip_archive"},
            files={"file": ("realistic-stack.zip", fh, "application/zip")},
        )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "completed"
    scan_id = body["scan_id"]

    detail = client.get(f"/api/v1/scans/{scan_id}", headers=headers).json()
    assert detail["total_files"] > 0
    assert detail["total_artefacts"] >= 15, "the old detector pack would have shown 0 here"

    summary = client.get(f"/api/v1/scans/{scan_id}/summary", headers=headers).json()
    # Proof multiple independent layers fired, not one lucky regex.
    assert len(summary["layers_present"]) >= 3

    valid = client.get(f"/api/v1/scans/{scan_id}/reports/cbom/validate", headers=headers).json()
    assert valid["valid"] is True

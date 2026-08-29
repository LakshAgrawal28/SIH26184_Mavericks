from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
CORPUS_ZIP = ROOT / "scanner" / "corpus" / "archives" / "java-rsa-aes.zip"


def _auth_headers(client) -> dict[str, str]:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "admin123"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.skipif(not CORPUS_ZIP.is_file(), reason="corpus zip missing")
def test_sync_scan_java_rsa_aes_zip(client):
    headers = _auth_headers(client)
    with CORPUS_ZIP.open("rb") as fh:
        resp = client.post(
            "/api/v1/scans",
            headers=headers,
            data={"name": "java-rsa-aes", "target_type": "zip_archive"},
            files={"file": ("java-rsa-aes.zip", fh, "application/zip")},
        )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "completed"
    scan_id = body["scan_id"]

    detail = client.get(f"/api/v1/scans/{scan_id}", headers=headers)
    assert detail.status_code == 200
    scan = detail.json()
    assert scan["status"] == "completed"
    assert scan["total_artefacts"] >= 2
    assert scan["total_files"] >= 1

    artefacts = client.get(f"/api/v1/scans/{scan_id}/artefacts", headers=headers)
    assert artefacts.status_code == 200
    items = artefacts.json()["artefacts"]
    assert len(items) >= 2
    blob = " ".join(
        str(a.get("algorithm") or a.get("name") or "") for a in items
    ).upper()
    assert "RSA" in blob

    summary = client.get(f"/api/v1/scans/{scan_id}/summary", headers=headers)
    assert summary.status_code == 200
    assert summary.json()["total_artefacts"] >= 2


def test_run_all_detectors_on_corpus_extracted(tmp_path):
    pytest.importorskip("scanner")
    import zipfile

    from scanner.detectors.pipeline import run_all_detectors, safe_extract_zip

    if not CORPUS_ZIP.is_file():
        pytest.skip("corpus zip missing")

    extract = tmp_path / "src"
    safe_extract_zip(CORPUS_ZIP, extract)
    findings = run_all_detectors(extract)
    assert len(findings) >= 2
    names = " ".join(f.algorithm or f.name for f in findings).upper()
    assert "RSA" in names

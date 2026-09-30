from pathlib import Path

import pytest

from conftest import wait_for_scan

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
    scan_id = resp.json()["scan_id"]

    scan = wait_for_scan(client, scan_id, headers)
    assert scan["status"] == "completed"
    assert scan["total_artefacts"] >= 2
    assert scan["total_files"] >= 1
    assert "suggested_data_lifetime_x" in scan

    artefacts = client.get(f"/api/v1/scans/{scan_id}/artefacts", headers=headers)
    assert artefacts.status_code == 200
    items = artefacts.json()["artefacts"]
    assert len(items) >= 2
    blob = " ".join(
        str(a.get("algorithm") or a.get("name") or "") for a in items
    ).upper()
    assert "RSA" in blob
    for key in ("primitive", "library_name", "library_version", "mode", "key_size", "raw_metadata"):
        assert key in items[0]
    assert "quantum_break" in items[0]["risk"]
    meta = items[0]["raw_metadata"] or {}
    assert "qv" in meta
    assert "quantum_break" in meta
    assert "use_case" in meta

    summary = client.get(f"/api/v1/scans/{scan_id}/summary", headers=headers)
    assert summary.status_code == 200
    summary_body = summary.json()
    assert summary_body["total_artefacts"] >= 2
    for key in (
        "asset_types",
        "primitives",
        "quantum_classes",
        "shor_vulnerable_count",
        "classical_hygiene_count",
        "hsm_cloud_count",
        "library_count",
        "suggested_data_lifetime_x",
        "keep_or_inspect_count",
    ):
        assert key in summary_body
    for cls in ("shor", "grover", "broken_classical", "none", "inspect", "unknown"):
        assert cls in summary_body["quantum_classes"]

    recs = client.get(f"/api/v1/scans/{scan_id}/recommendations", headers=headers)
    assert recs.status_code == 200
    rec_items = recs.json()["recommendations"]
    if rec_items:
        for key in ("primitive", "quantum_break", "use_case", "algorithm"):
            assert key in rec_items[0]

    mosca_expired = client.get(f"/api/v1/scans/{scan_id}/mosca", params={"x": 12, "y": 4}, headers=headers)
    assert mosca_expired.status_code == 200
    assert mosca_expired.json()["baseline_category"] == "EXPIRED"
    mosca_body = mosca_expired.json()
    assert "suggested_data_lifetime_x" in mosca_body
    assert "cert_count" in mosca_body
    assert "HNDL" in mosca_body["data_lifetime_note"]
    assert "data lifetime" in mosca_body["data_lifetime_note"].lower()
    mosca_urgent = client.get(f"/api/v1/scans/{scan_id}/mosca", params={"x": 6, "y": 3}, headers=headers)
    assert mosca_urgent.json()["baseline_category"] == "URGENT"
    assert mosca_urgent.json()["transition"]["label"].startswith("EXPIRED")

    valid = client.get(f"/api/v1/scans/{scan_id}/reports/cbom/validate", headers=headers)
    assert valid.status_code == 200
    assert valid.json()["valid"] is True

    acc = client.get("/api/v1/accuracy")
    assert acc.status_code == 200
    body = acc.json()
    assert body["recall"] == 1.0
    assert body["invented_algorithms"] == 0
    assert body["deterministic"] is True


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


def test_ecdat_summary_keys_without_crypto(client):
    import io
    import zipfile

    headers = _auth_headers(client)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("hello.txt", "no crypto here")
    resp = client.post(
        "/api/v1/scans",
        headers=headers,
        data={"name": "empty-ecdat-fields", "target_type": "zip_archive"},
        files={"file": ("tiny.zip", buf.getvalue(), "application/zip")},
    )
    assert resp.status_code == 201, resp.text
    scan_id = resp.json()["scan_id"]

    detail = wait_for_scan(client, scan_id, headers)
    assert "suggested_data_lifetime_x" in detail
    assert detail["data_lifetime_x"] == 10.0

    summary = client.get(f"/api/v1/scans/{scan_id}/summary", headers=headers).json()
    for key in (
        "asset_types",
        "primitives",
        "quantum_classes",
        "shor_vulnerable_count",
        "classical_hygiene_count",
        "hsm_cloud_count",
        "library_count",
        "suggested_data_lifetime_x",
        "keep_or_inspect_count",
    ):
        assert key in summary
    assert summary["shor_vulnerable_count"] == 0
    assert summary["hsm_cloud_count"] == 0
    assert summary["keep_or_inspect_count"] == 0

    mosca = client.get(f"/api/v1/scans/{scan_id}/mosca", headers=headers).json()
    assert mosca["cert_count"] == 0
    assert "HNDL" in mosca["data_lifetime_note"]
    assert "suggested_data_lifetime_x" in mosca

    recs = client.get(f"/api/v1/scans/{scan_id}/recommendations", headers=headers)
    assert recs.status_code == 200
    assert recs.json()["count"] == 0


def test_quantum_break_fallback_and_sanitized_metadata():
    from app.services.scan_service import (
        _fallback_quantum_break,
        public_artefact_metadata,
    )

    assert _fallback_quantum_break("RSA-2048", {}, 10.0) == "shor"
    assert _fallback_quantum_break("AES-256", {}, 2.0) == "grover"
    assert _fallback_quantum_break("MD5", {}, 10.0) == "broken_classical"
    assert _fallback_quantum_break("ML-KEM-768", {}, 0.0) == "none"
    assert _fallback_quantum_break("unknown-algo", {"unmapped": True}, 5.0) == "inspect"
    meta = public_artefact_metadata(
        {"qv": 10, "quantum_break": "shor", "secret_path": "/etc/passwd", "use_case": "pke"}
    )
    assert meta["qv"] == 10
    assert meta["use_case"] == "pke"
    assert "secret_path" not in meta

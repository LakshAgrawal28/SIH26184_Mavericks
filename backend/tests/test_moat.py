from pathlib import Path
import uuid

import pytest

from app.cbom.builder import build_cbom
from app.cbom.validator import validate_cbom
from app.engines.mosca_engine import compute_mosca, describe_transition
from app.models import Artefact, Scan
from scanner.accuracy.measure import measure_corpus
from scanner.detectors.pipeline import coverage_stats, run_all_detectors
from scanner.scripts.build_corpus_zips import prepare_mixed_enterprise

ROOT = Path(__file__).resolve().parents[2]
MIXED = ROOT / "scanner" / "corpus" / "mixed-enterprise"
REALISTIC = ROOT / "scanner" / "corpus" / "realistic-stack"


@pytest.fixture(scope="session", autouse=True)
def _prepare_mixed():
    prepare_mixed_enterprise()


def test_mosca_slider_expired_to_urgent():
    expired = compute_mosca(x=12, y=4, final_risk=8.0)
    urgent = compute_mosca(x=6, y=3, final_risk=8.0)
    assert expired["baseline_category"] == "EXPIRED"
    assert urgent["baseline_category"] == "URGENT"
    transition = describe_transition(expired["baseline_category"], urgent["baseline_category"])
    assert transition["changed"] is True
    assert transition["improved"] is True
    assert "EXPIRED →" in transition["label"]


def test_mosca_custom_z_scenario():
    result = compute_mosca(x=8, y=2, final_risk=8.0, extra_z=11.0)
    names = [s["name"] for s in result["scenarios"]]
    assert "Custom" in names
    custom = next(s for s in result["scenarios"] if s["name"] == "Custom")
    assert custom["z_value"] == 11.0
    assert custom["category"] == "URGENT"


def test_mixed_enterprise_hits_all_layers():
    assert MIXED.exists()
    findings = run_all_detectors(MIXED)
    blob = " ".join(
        f"{f.algorithm} {f.name} {f.asset_type} {f.detection_method} {f.file_path}"
        for f in findings
    ).upper()
    methods = {f.detection_method for f in findings}
    assert "RSA" in blob
    assert "CERTIFICATE" in blob
    assert "TLS" in blob
    assert any(m.startswith("binary") for m in methods)
    assert any((m or "").startswith("semgrep") for m in methods)


def test_realistic_multilanguage_repo_is_not_empty():
    """Anti-regression for the 'random GitHub zip shows 0 artefacts' failure mode.

    realistic-stack mimics an unlabelled real-world repo (Node + Python + Java +
    Go + Spring YAML + lockfiles + a headless PEM + a nameless PKCS12 hint) with
    none of the file names the old detectors special-cased (no CryptoService.java,
    no nginx.conf). The catalog layer must still surface evidence-backed findings.
    """
    assert REALISTIC.exists()
    findings = run_all_detectors(REALISTIC)
    assert len(findings) >= 15, "catalog layer should catch far more than a handful of hardcoded strings"

    methods = {f.detection_method for f in findings}
    # Proof this isn't just one lucky regex: multiple independent layers fired.
    assert "catalog-api" in methods
    assert any(m.startswith("manifest") or m == "package-json" for m in methods)
    assert "x509-parser" in methods or "pem-marker" in methods
    assert "filename-hint" in methods

    blob = " ".join(f"{f.algorithm} {f.name}" for f in findings).upper()
    for expected in ("MD5", "JWT", "RS256", "TLS"):
        assert expected in blob, f"missing {expected} in realistic-stack findings"

    denylist = ["GOST", "CAMELLIA", "TWOFISH", "BLOWFISH", "SEED", "ARIA", "SM4", "KASUMI", "IDEA"]
    assert not any(bad in blob for bad in denylist), "must never invent algorithms not present in source"


def test_coverage_stats_explain_vendor_skips(tmp_path):
    (tmp_path / "node_modules" / "leftpad").mkdir(parents=True)
    (tmp_path / "node_modules" / "leftpad" / "index.js").write_text("module.exports = 1;")
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "app.py").write_text("import hashlib\nhashlib.md5(b'x')\n")

    stats = coverage_stats(tmp_path)
    assert stats["unpacked_files"] == 2
    assert stats["first_party_files"] == 1
    assert stats["skipped_vendor_files"] == 1


def test_nested_zip_is_unpacked(tmp_path):
    import zipfile
    from scanner.detectors.pipeline import run_all_detectors, safe_extract_zip, unpack_nested_archives

    inner_dir = tmp_path / "inner"
    inner_dir.mkdir()
    (inner_dir / "Crypto.java").write_text(
        'Cipher.getInstance("RSA/ECB/PKCS1Padding");\n',
        encoding="utf-8",
    )
    inner_zip = tmp_path / "inner.zip"
    with zipfile.ZipFile(inner_zip, "w") as zf:
        zf.write(inner_dir / "Crypto.java", "Crypto.java")

    outer = tmp_path / "outer.zip"
    with zipfile.ZipFile(outer, "w") as zf:
        zf.write(inner_zip, "payload.zip")

    extract = tmp_path / "src"
    safe_extract_zip(outer, extract)
    unpack_nested_archives(extract)
    findings = run_all_detectors(extract)
    blob = " ".join(f.algorithm or f.name or "" for f in findings).upper()
    assert "RSA" in blob


def test_corpus_accuracy_published():
    report = measure_corpus()
    assert report["invented_algorithms"] == 0
    assert report["deterministic"] is True
    assert report["recall"] == 1.0
    assert report["fixtures_evaluated"] >= 7


def test_cbom_validates_against_official_schema():
    scan = Scan(id=uuid.uuid4(), name="schema-check", status="completed")
    arts = [
        Artefact(
            scan_id=scan.id,
            bom_ref="crypto/algorithm/rsa001",
            name="RSA-2048",
            asset_type="algorithm",
            algorithm="RSA-2048",
            primitive="pke",
            mode="ecb",
            key_size="2048",
            file_path="src/CryptoService.java",
            line_number=12,
            detection_method="semgrep",
            confidence=0.97,
            evidence_snippet='Cipher.getInstance("RSA/ECB/PKCS1Padding")',
            final_risk_score=9.1,
            risk_band="CRITICAL",
            primary_pqc="ML-KEM-768",
            hybrid_pair="X25519MLKEM768",
            nist_standard="FIPS 203",
        ),
        Artefact(
            scan_id=scan.id,
            bom_ref="crypto/certificate/cert001",
            name="Certificate: CN=api.internal.ntro.example",
            asset_type="certificate",
            algorithm="X.509-sha256WithRSAEncryption-2048",
            file_path="certs/expiring-rsa.pem",
            detection_method="x509-parser",
            confidence=0.98,
            evidence_snippet="Subject: CN=api.internal.ntro.example",
            raw_metadata={
                "subjectName": "CN=api.internal.ntro.example",
                "issuerName": "CN=api.internal.ntro.example",
                "notValidAfter": "2026-09-23T00:00:00Z",
            },
            final_risk_score=8.2,
            risk_band="CRITICAL",
        ),
        Artefact(
            scan_id=scan.id,
            bom_ref="crypto/protocol/tls001",
            name="Weak TLS Protocol",
            asset_type="protocol",
            algorithm="TLS-1.0/1.1",
            file_path="conf/nginx.conf",
            line_number=4,
            detection_method="config-scanner",
            confidence=0.92,
            evidence_snippet="ssl_protocols TLSv1 TLSv1.1 TLSv1.2;",
            final_risk_score=7.0,
            risk_band="HIGH",
        ),
        Artefact(
            scan_id=scan.id,
            bom_ref="lib/jsonwebtoken",
            name="jsonwebtoken@8.5.1",
            asset_type="library",
            library_name="jsonwebtoken",
            library_version="8.5.1",
            file_path="package.json",
            detection_method="package-json",
            confidence=0.95,
            final_risk_score=3.0,
            risk_band="LOW",
        ),
    ]
    bom = build_cbom(scan, arts, validate=False)
    result = validate_cbom(bom)
    assert result["valid"] is True, result["errors"]
    assert result["schema"]
    assert bom["specVersion"] == "1.6"
    types = {c["type"] for c in bom["components"]}
    assert "cryptographic-asset" in types
    assert "library" in types

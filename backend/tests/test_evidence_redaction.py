import uuid
from unittest.mock import MagicMock

import pytest

from app.core.redact import redact_evidence_snippet

# Minimal PKCS#8-style block for tests (not a real key).
FIXTURE_PRIVATE_KEY_BODY = (
    "MIIBVAIBADANBgkqhkiG9w0BAQEFAASCAT4wggE6AgEAAkEA"
    "0123456789ABCDEF0123456789ABCDEF01234567"
)
FIXTURE_PEM_PRIVATE_KEY = (
    f"-----BEGIN PRIVATE KEY-----\n{FIXTURE_PRIVATE_KEY_BODY}\n-----END PRIVATE KEY-----"
)


def test_redact_evidence_snippet_masks_pem_private_key():
    snippet = f"leaked={FIXTURE_PEM_PRIVATE_KEY}"
    redacted = redact_evidence_snippet(snippet)
    assert redacted is not None
    assert FIXTURE_PRIVATE_KEY_BODY not in redacted
    assert "-----BEGIN PRIVATE KEY-----" not in redacted
    assert "[REDACTED PRIVATE KEY]" in redacted
    assert redacted.startswith("leaked=")


def test_redact_evidence_snippet_passthrough_without_key():
    plain = "Cipher.getInstance(\"RSA/ECB/PKCS1Padding\")"
    assert redact_evidence_snippet(plain) == plain
    assert redact_evidence_snippet(None) is None
    assert redact_evidence_snippet("") == ""


def test_scan_service_persists_redacted_evidence_snippet():
    import app.services.scan_service as scan_service_module
    from app.services.scan_service import run_scan_job

    raw_snippet = f"config key:\n{FIXTURE_PEM_PRIVATE_KEY}\n"

    finding = MagicMock()
    finding.asset_type = "source"
    finding.name = "test-finding"
    finding.algorithm = "RSA"
    finding.mode = None
    finding.primitive = None
    finding.key_size = None
    finding.library_name = None
    finding.library_version = None
    finding.file_path = "keys/app.pem"
    finding.line_number = 1
    finding.detection_method = "test"
    finding.confidence = 0.9
    finding.evidence_snippet = raw_snippet
    finding.raw_metadata = {}

    scan_id = uuid.uuid4()
    scan = MagicMock()
    scan.id = scan_id
    scan.storage_path = None
    scan.target_type = "zip_archive"
    scan.sensitivity_score = 3
    scan.data_lifetime_x = 5
    scan.exposure_score = 3
    scan.business_criticality = 3

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = scan
    db.query.return_value.filter.return_value.delete.return_value = None

    stored_artefacts: list = []

    def capture_add(art):
        stored_artefacts.append(art)

    db.add.side_effect = capture_add

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(scan_service_module, "prepare_scan_tree", lambda *_a, **_k: 1)
        mp.setattr(
            scan_service_module,
            "coverage_stats",
            lambda _d: {"first_party_files": 1, "skipped_vendor_files": 0},
        )
        mp.setattr(
            scan_service_module,
            "_run_detectors_with_progress",
            lambda *_a, **_k: [finding],
        )
        mp.setattr(scan_service_module, "publish_progress", lambda *_a, **_k: None)
        run_scan_job(db, scan_id)

    assert len(stored_artefacts) == 1
    stored = stored_artefacts[0].evidence_snippet
    assert stored is not None
    assert FIXTURE_PRIVATE_KEY_BODY not in stored
    assert "[REDACTED PRIVATE KEY]" in stored

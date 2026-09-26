from pathlib import Path

import pytest

pytest.importorskip("scanner")

from scanner.detectors.pipeline import run_all_detectors  # noqa: E402


def test_cloud_kms_jwt_alg_and_sbom_lockfile(tmp_path: Path):
    (tmp_path / "app.py").write_text(
        """
import boto3

def issue(payload, key):
    client = boto3.client("kms")
    client.generate_data_key(KeyId="alias/app", KeySpec="AES_256")
    jwt.sign(payload, key, { algorithm: "RS256" })
""",
        encoding="utf-8",
    )
    (tmp_path / "package-lock.json").write_text(
        """
{
  "lockfileVersion": 2,
  "packages": {
    "node_modules/jsonwebtoken": { "version": "9.0.3" }
  }
}
""",
        encoding="utf-8",
    )
    (tmp_path / "hsm.py").write_text(
        "session = pkcs11.lib('/usr/lib/softhsm/libsofthsm2.so')\n",
        encoding="utf-8",
    )

    findings = run_all_detectors(tmp_path)
    assert findings, "expected crypto findings from temp fixture"

    types = {f.asset_type for f in findings}
    assert "cloud-service" in types
    assert "hsm" in types

    blob = " ".join(
        f"{f.algorithm} {f.name} {f.detection_method} {f.library_name} {f.library_version}"
        for f in findings
    ).upper()
    assert "RS256" in blob
    assert "AWS-KMS" in blob
    assert "JSONWEBTOKEN" in blob
    assert "9.0.3" in blob

    jwt_hits = [
        f for f in findings if (f.algorithm or f.name or "").upper() == "RS256"
    ]
    assert jwt_hits
    assert any((f.raw_metadata or {}).get("jwt_alg") == "RS256" for f in jwt_hits)

    sbom = [f for f in findings if f.detection_method == "sbom-lockfile"]
    assert sbom
    assert any((f.raw_metadata or {}).get("purl") == "pkg:npm/jsonwebtoken@9.0.3" for f in sbom)

    kms = [f for f in findings if f.asset_type == "cloud-service"]
    assert kms
    assert any((f.raw_metadata or {}).get("cloud_provider") == "aws" for f in kms)

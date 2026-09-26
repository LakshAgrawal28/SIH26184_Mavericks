"""Detect HSM and cloud KMS SDK usage in first-party source (no live cloud calls)."""
from __future__ import annotations

import re
from pathlib import Path

from scanner.detectors.base import CryptoFinding, iter_files, rel_path
from scanner.detectors.catalog_detector import SKIP_SUFFIXES, TEXT_SUFFIXES

MAX_FILE_BYTES = 1_000_000
MAX_HITS_PER_FILE = 12

# (regex, algorithm, primitive, asset_type, library_name, cloud_provider, hsm)
_CLOUD_HSM_SPECS: list[tuple[str, str, str, str, str, str | None, str | None]] = [
    (
        r"boto3.{0,160}kms|kms\.generate_data_key|\baws-kms\b|\bAWSKMS\b|"
        r"client\(\s*['\"]kms['\"]",
        "AWS-KMS",
        "cloud-kms",
        "cloud-service",
        "boto3",
        "aws",
        None,
    ),
    (
        r"azure\.keyvault|SecretClient\s*\(|KeyClient\s*\(",
        "Azure-KeyVault",
        "cloud-kms",
        "cloud-service",
        "azure-keyvault",
        "azure",
        None,
    ),
    (
        r"google\.cloud\.kms|\bcloudkms\b",
        "GCP-KMS",
        "cloud-kms",
        "cloud-service",
        "google-cloud-kms",
        "gcp",
        None,
    ),
    (
        r"hvac\.Client|vault\.hashicorp|\bVAULT_TOKEN\b",
        "HashiCorp-Vault",
        "cloud-kms",
        "cloud-service",
        "hvac",
        "hashicorp",
        None,
    ),
    (
        r"\bCloudHSM\b|\bcloudhsm\b",
        "AWS-CloudHSM",
        "cloud-kms",
        "cloud-service",
        "aws-cloudhsm",
        "aws",
        None,
    ),
    (
        r"\bPKCS#?11\b|\bpkcs11\b|\bLibica\b|\bnfast\b|\bnCipher\b|\bThales\b|\bSoftHSM\b",
        "PKCS11",
        "hsm",
        "hsm",
        "pkcs11",
        None,
        "pkcs11",
    ),
]

_COMPILED = [
    (re.compile(pat, re.IGNORECASE), algo, prim, atype, lib, provider, hsm)
    for pat, algo, prim, atype, lib, provider, hsm in _CLOUD_HSM_SPECS
]


def detect_cloud_hsm(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    for path in iter_files(root):
        suffix = path.suffix.lower()
        if suffix in SKIP_SUFFIXES:
            continue
        name_l = path.name.lower()
        is_text = (
            suffix in TEXT_SUFFIXES
            or name_l in {"dockerfile", "makefile", "jenkinsfile"}
            or name_l.startswith("docker-compose")
            or name_l.startswith(".env")
        )
        if not is_text:
            continue
        try:
            if path.stat().st_size > MAX_FILE_BYTES:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        rel = rel_path(root, path)
        hits = 0
        seen: set[tuple] = set()
        for line_no, line in enumerate(text.splitlines(), start=1):
            if hits >= MAX_HITS_PER_FILE:
                break
            if len(line) > 4000:
                continue
            for compiled, algo, prim, atype, lib, provider, hsm in _COMPILED:
                if hits >= MAX_HITS_PER_FILE:
                    break
                if not compiled.search(line):
                    continue
                key = (line_no, algo, atype)
                if key in seen:
                    continue
                seen.add(key)
                findings.append(
                    CryptoFinding(
                        name=algo,
                        asset_type=atype,
                        algorithm=algo,
                        primitive=prim,
                        library_name=lib,
                        file_path=rel,
                        line_number=line_no,
                        detection_method="cloud-hsm",
                        confidence=0.93,
                        evidence_snippet=line.strip()[:200],
                        raw_metadata={
                            "cloud_provider": provider,
                            "hsm": hsm,
                            "engine": "cloud-hsm",
                        },
                    )
                )
                hits += 1
    return findings

import hashlib
import uuid
import zipfile
from pathlib import Path

from scanner.detectors.base import CryptoFinding
from scanner.detectors.cert_detector import detect_certificates, detect_configs
from scanner.detectors.source_detector import detect_manifests, detect_source


def run_all_detectors(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    findings.extend(detect_source(root))
    findings.extend(detect_manifests(root))
    findings.extend(detect_certificates(root))
    findings.extend(detect_configs(root))
    return normalize_findings(findings)


def normalize_findings(findings: list[CryptoFinding]) -> list[CryptoFinding]:
    seen: set[tuple] = set()
    out: list[CryptoFinding] = []
    for f in findings:
        key = f.dedup_key()
        if key in seen:
            continue
        seen.add(key)
        out.append(f)
    return out


def safe_extract_zip(zip_path: Path, dest: Path) -> int:
    dest.mkdir(parents=True, exist_ok=True)
    count = 0
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            if member.is_dir():
                continue
            target = (dest / member.filename).resolve()
            if not str(target).startswith(str(dest.resolve())):
                raise ValueError("Zip slip detected")
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as src, open(target, "wb") as dst:
                dst.write(src.read())
            count += 1
    return count


def finding_to_bom_ref(finding: CryptoFinding) -> str:
    raw = f"{finding.name}|{finding.file_path}|{finding.line_number}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"crypto/{finding.asset_type}/{digest}"

import hashlib
import zipfile
from pathlib import Path

from scanner.detectors.base import CryptoFinding
from scanner.detectors.binary_detector import detect_binary
from scanner.detectors.cert_detector import detect_certificates, detect_configs
from scanner.detectors.semgrep_detector import detect_semgrep
from scanner.detectors.source_detector import detect_manifests, detect_source

_METHOD_RANK = {
    "semgrep": 50,
    "semgrep-rules": 45,
    "x509-parser": 40,
    "package-json": 35,
    "manifest-maven": 30,
    "manifest-npm": 30,
    "manifest-pypi": 30,
    "manifest-go": 30,
    "config-scanner": 28,
    "binary-key-material": 22,
    "binary-weak-tls": 20,
    "binary-crypto-string": 18,
}


def run_all_detectors(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    findings.extend(detect_semgrep(root))
    findings.extend(detect_source(root))
    findings.extend(detect_manifests(root))
    findings.extend(detect_certificates(root))
    findings.extend(detect_configs(root))
    findings.extend(detect_binary(root))
    return normalize_findings(findings)


def normalize_findings(findings: list[CryptoFinding]) -> list[CryptoFinding]:
    ranked = sorted(
        findings,
        key=lambda f: (
            _METHOD_RANK.get(f.detection_method, 10),
            f.confidence,
            -(f.line_number or 0),
        ),
        reverse=True,
    )
    seen: set[tuple] = set()
    out: list[CryptoFinding] = []
    for f in ranked:
        keys = [f.dedup_key()]
        algo = (f.algorithm or f.name or "").upper()
        family = _family(algo)
        if f.file_path and f.line_number:
            keys.append(("line", f.file_path, f.line_number, family or algo[:24], f.asset_type))
        if any(k in seen for k in keys):
            continue
        for k in keys:
            seen.add(k)
        out.append(f)
    return out


def _family(algorithm: str) -> str:
    blob = algorithm.upper().replace("_", "-")
    for token in (
        "ML-KEM", "ML-DSA", "SLH-DSA", "RSA", "ECDSA", "ECDH", "ED25519", "X25519",
        "AES", "SHA-256", "SHA-1", "SHA1", "MD5", "3DES", "DES", "RC4", "CHACHA20",
        "TLS", "HS256", "RS256",
    ):
        if token in blob:
            return "SHA-1" if token in ("SHA-1", "SHA1") else token
    return blob[:24]


NESTED_ARCHIVE_EXTS = {".zip", ".jar", ".war", ".ear"}
SKIP_EXTRACT_PARTS = {"__macosx", ".ds_store"}


def safe_extract_zip(zip_path: Path, dest: Path) -> int:
    dest.mkdir(parents=True, exist_ok=True)
    count = 0
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            if member.is_dir():
                continue
            name = member.filename.replace("\\", "/")
            parts = {p.lower() for p in Path(name).parts}
            if parts & SKIP_EXTRACT_PARTS or Path(name).name.lower() == ".ds_store":
                continue
            target = (dest / name).resolve()
            if not str(target).startswith(str(dest.resolve())):
                raise ValueError("Zip slip detected")
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as src, open(target, "wb") as dst:
                dst.write(src.read())
            count += 1
    return count


def unpack_nested_archives(root: Path, max_depth: int = 2) -> int:
    """Unpack zip/jar/war found inside an upload so nested demo archives still scan."""
    extra = 0
    for _ in range(max_depth):
        archives = [
            p
            for p in root.rglob("*")
            if p.is_file() and p.suffix.lower() in NESTED_ARCHIVE_EXTS
        ]
        if not archives:
            break
        for arch in archives:
            dest = arch.parent / f"{arch.stem}_unpacked"
            if dest.exists():
                continue
            try:
                extra += safe_extract_zip(arch, dest)
            except (zipfile.BadZipFile, ValueError, OSError):
                continue
    return extra


def finding_to_bom_ref(finding: CryptoFinding) -> str:
    raw = f"{finding.name}|{finding.file_path}|{finding.line_number}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"crypto/{finding.asset_type}/{digest}"

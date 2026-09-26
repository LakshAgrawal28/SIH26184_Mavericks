import hashlib
import json
import tarfile
import zipfile
from dataclasses import dataclass
from pathlib import Path

from scanner.detectors.base import IGNORE_DIRS, CryptoFinding
from scanner.detectors.binary_detector import detect_binary
from scanner.detectors.catalog_detector import detect_catalog
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
    "manifest-lockfile": 29,
    "catalog-api": 32,
    "config-scanner": 28,
    "filename-hint": 26,
    "binary-key-material": 22,
    "binary-weak-tls": 20,
    "binary-crypto-string": 18,
}


def run_all_detectors(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    findings.extend(detect_semgrep(root))
    findings.extend(detect_catalog(root))
    findings.extend(detect_source(root))
    findings.extend(detect_manifests(root))
    findings.extend(detect_certificates(root))
    findings.extend(detect_configs(root))
    findings.extend(detect_binary(root))
    return normalize_findings(findings)


def coverage_stats(root: Path) -> dict:
    """First-party vs skipped (node_modules, venv, …) so empty scans are explainable."""
    total = first_party = skipped = 0
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        total += 1
        if set(path.parts) & IGNORE_DIRS:
            skipped += 1
        else:
            first_party += 1
    return {
        "unpacked_files": total,
        "first_party_files": first_party,
        "skipped_vendor_files": skipped,
    }


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
        "TLS", "HS256", "RS256", "JWT", "HMAC", "X.509", "BCRYPT", "PBKDF2",
    ):
        if token in blob:
            return "SHA-1" if token in ("SHA-1", "SHA1") else token
    return blob[:24]


NESTED_ARCHIVE_EXTS = {".zip", ".jar", ".war", ".ear", ".tar"}
SKIP_EXTRACT_PARTS = {"__macosx", ".ds_store"}
DECOMPRESS_LIMIT_MESSAGE = "Archive too large when decompressed"


@dataclass
class DecompressBudget:
    max_bytes: int
    used: int = 0

    def charge(self, nbytes: int) -> None:
        self.used += nbytes
        if self.used > self.max_bytes:
            raise ValueError(DECOMPRESS_LIMIT_MESSAGE)


def _safe_member_path(dest: Path, member_name: str) -> Path:
    name = member_name.replace("\\", "/").lstrip("/")
    parts = {p.lower() for p in Path(name).parts}
    if parts & SKIP_EXTRACT_PARTS or Path(name).name.lower() == ".ds_store":
        raise ValueError("Skipped member")
    target = (dest / name).resolve()
    if not str(target).startswith(str(dest.resolve())):
        raise ValueError("Tar slip detected")
    return target


def safe_extract_tar(tar_path: Path, dest: Path, *, budget: DecompressBudget | None = None) -> int:
    dest.mkdir(parents=True, exist_ok=True)
    count = 0
    with tarfile.open(tar_path, "r:*") as tf:
        for member in tf.getmembers():
            if not member.isfile():
                continue
            if budget is not None:
                budget.charge(member.size)
            try:
                target = _safe_member_path(dest, member.name)
            except ValueError:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            extracted = tf.extractfile(member)
            if extracted is None:
                continue
            with extracted as src, open(target, "wb") as dst:
                while True:
                    chunk = src.read(1024 * 1024)
                    if not chunk:
                        break
                    dst.write(chunk)
            count += 1
    return count


def _ordered_layer_tars(staging: Path) -> list[Path]:
    for manifest in sorted(staging.rglob("manifest.json")):
        try:
            payload = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        entries = payload if isinstance(payload, list) else [payload]
        layers: list[Path] = []
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            for rel in entry.get("Layers") or []:
                layer = (manifest.parent / str(rel)).resolve()
                if layer.is_file():
                    layers.append(layer)
        if layers:
            return layers
    layer_tars = sorted(staging.rglob("layer.tar"))
    if layer_tars:
        return layer_tars
    return sorted(p for p in staging.rglob("*.tar") if p.resolve() != staging.resolve())


def merge_container_layers(
    staging: Path,
    merged: Path,
    *,
    budget: DecompressBudget | None = None,
) -> int:
    """Overlay OCI/docker layer tars; later layers override earlier paths."""
    merged.mkdir(parents=True, exist_ok=True)
    count = 0
    for layer_tar in _ordered_layer_tars(staging):
        with tarfile.open(layer_tar, "r:*") as tf:
            for member in tf.getmembers():
                if not member.isfile():
                    continue
                if budget is not None:
                    budget.charge(member.size)
                try:
                    target = _safe_member_path(merged, member.name)
                except ValueError:
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                extracted = tf.extractfile(member)
                if extracted is None:
                    continue
                with extracted as src, open(target, "wb") as dst:
                    while True:
                        chunk = src.read(1024 * 1024)
                        if not chunk:
                            break
                        dst.write(chunk)
                count += 1
    return count


def ingest_container_image_tar(
    upload_tar: Path,
    dest: Path,
    *,
    budget: DecompressBudget | None = None,
) -> int:
    """Unpack `docker save` output and merge layer filesystems for scanning."""
    staging = dest.parent / f"{dest.name}_oci_staging"
    staging.mkdir(parents=True, exist_ok=True)
    outer_count = safe_extract_tar(upload_tar, staging, budget=budget)
    merged_count = merge_container_layers(staging, dest, budget=budget)
    return outer_count + merged_count


def prepare_scan_tree(
    upload_path: Path,
    extract_path: Path,
    target_type: str = "zip_archive",
    *,
    budget: DecompressBudget | None = None,
) -> int:
    """Route zip vs container_image ingestion; always unpack nested archives inside tree."""
    if target_type == "container_image":
        file_count = ingest_container_image_tar(upload_path, extract_path, budget=budget)
    else:
        file_count = safe_extract_zip(upload_path, extract_path, budget=budget)
    file_count += unpack_nested_archives(extract_path, budget=budget)
    return file_count


def safe_extract_zip(zip_path: Path, dest: Path, *, budget: DecompressBudget | None = None) -> int:
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
            if budget is not None:
                budget.charge(member.file_size)
            target = (dest / name).resolve()
            if not str(target).startswith(str(dest.resolve())):
                raise ValueError("Zip slip detected")
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as src, open(target, "wb") as dst:
                while True:
                    chunk = src.read(1024 * 1024)
                    if not chunk:
                        break
                    dst.write(chunk)
            count += 1
    return count


def unpack_nested_archives(root: Path, max_depth: int = 2, *, budget: DecompressBudget | None = None) -> int:
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
                if arch.suffix.lower() == ".tar":
                    extra += safe_extract_tar(arch, dest, budget=budget)
                else:
                    extra += safe_extract_zip(arch, dest, budget=budget)
            except ValueError as exc:
                if str(exc) == DECOMPRESS_LIMIT_MESSAGE:
                    raise
                continue
            except (zipfile.BadZipFile, tarfile.TarError, OSError):
                continue
    return extra


def finding_to_bom_ref(finding: CryptoFinding) -> str:
    raw = f"{finding.name}|{finding.file_path}|{finding.line_number}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"crypto/{finding.asset_type}/{digest}"

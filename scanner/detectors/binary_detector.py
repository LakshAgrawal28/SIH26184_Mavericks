"""Binary string detector — `strings` when available, Python fallback otherwise."""
import re
from pathlib import Path

from scanner.detectors.base import CryptoFinding, rel_path

BINARY_EXTENSIONS = {".so", ".dylib", ".elf", ".bin", ".exe", ".o", ".a"}

BINARY_PATTERNS = [
    (r"\b(RSA|AES|DES|3DES|RC4|MD5|SHA1|SHA256|ECDSA|ECDH)\b", "binary-crypto-string", 0.60),
    (r"BEGIN (RSA |EC )?PRIVATE KEY", "binary-key-material", 0.80),
    (r"TLSv1\.[01]", "binary-weak-tls", 0.75),
]


def detect_binary(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    for path in root.rglob("*"):
        if path.suffix.lower() not in BINARY_EXTENSIONS or not path.is_file():
            continue
        output = _extract_strings(path)
        if not output:
            continue
        rel = rel_path(root, path)
        for pattern, method, confidence in BINARY_PATTERNS:
            for match in re.finditer(pattern, output, re.IGNORECASE):
                algo = match.group(1) if match.lastindex else match.group(0)
                findings.append(
                    CryptoFinding(
                        name=str(algo).upper()[:64],
                        asset_type="algorithm",
                        algorithm=str(algo).upper()[:64],
                        primitive="unknown",
                        file_path=rel,
                        detection_method=method,
                        confidence=confidence,
                        evidence_snippet=match.group(0)[:200],
                        raw_metadata={"source": "binary-strings"},
                    )
                )
    seen: set[tuple] = set()
    deduped = []
    for f in findings:
        key = (f.file_path, f.algorithm, f.detection_method)
        if key not in seen:
            seen.add(key)
            deduped.append(f)
    return deduped


def _extract_strings(path: Path) -> str:
    try:
        import shutil
        import subprocess

        if shutil.which("strings"):
            result = subprocess.run(
                ["strings", str(path)],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if result.returncode == 0 and result.stdout:
                return result.stdout
    except (subprocess.TimeoutExpired, OSError):
        pass
    try:
        data = path.read_bytes()
    except OSError:
        return ""
    chunks: list[str] = []
    current = bytearray()
    for b in data:
        if 32 <= b < 127:
            current.append(b)
        else:
            if len(current) >= 4:
                chunks.append(current.decode("ascii", errors="ignore"))
            current = bytearray()
    if len(current) >= 4:
        chunks.append(current.decode("ascii", errors="ignore"))
    return "\n".join(chunks)

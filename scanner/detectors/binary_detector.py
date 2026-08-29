"""Binary string detector — uses 'strings' command to extract printable strings from ELF/Mach-O files."""
import re
import shutil
import subprocess
from pathlib import Path

from scanner.detectors.base import CryptoFinding, rel_path

BINARY_EXTENSIONS = {".so", ".dylib", ".elf", ".bin", ".exe", ".o", ".a"}

BINARY_PATTERNS = [
    (r'\b(RSA|AES|DES|3DES|RC4|MD5|SHA1|SHA256|ECDSA|ECDH)\b', "binary-crypto-string", 0.60),
    (r'BEGIN (RSA |EC )?PRIVATE KEY', "binary-key-material", 0.80),
    (r'TLSv1\.[01]', "binary-weak-tls", 0.75),
]


def detect_binary(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    strings_available = shutil.which("strings") is not None
    if not strings_available:
        return findings  # Graceful degradation — strings tool not available

    for path in root.rglob("*"):
        if path.suffix.lower() not in BINARY_EXTENSIONS or not path.is_file():
            continue
        try:
            result = subprocess.run(
                ["strings", str(path)],
                capture_output=True, text=True, timeout=10
            )
            output = result.stdout
        except (subprocess.TimeoutExpired, OSError):
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
    # Deduplicate by (file_path, algorithm)
    seen = set()
    deduped = []
    for f in findings:
        key = (f.file_path, f.algorithm)
        if key not in seen:
            seen.add(key)
            deduped.append(f)
    return deduped

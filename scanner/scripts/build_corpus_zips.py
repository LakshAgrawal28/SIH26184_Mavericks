#!/usr/bin/env python3
"""Create demo zip archives for ECDAT corpus."""
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "corpus"
OUT = ROOT / "archives"
OUT.mkdir(exist_ok=True)

CORPUS_DIRS = [
    "java-rsa-aes",
    "python-crypto",
    "nodejs-jwt",
    "weak-configs",
    "go-tls",
    "openssl-certs",
    "pqc-modern",
]

for name in CORPUS_DIRS:
    src = ROOT / name
    if not src.exists():
        continue
    zpath = OUT / f"{name}.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in src.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(src))
    print(f"Created {zpath}")

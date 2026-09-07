#!/usr/bin/env python3
"""Create demo zip archives for ECDAT corpus, including the mixed-enterprise fixture."""
from __future__ import annotations

import zipfile
from datetime import datetime, timedelta, timezone
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
    "mixed-enterprise",
    "realistic-stack",
]


def write_fake_elf_so(path: Path) -> None:
    """Minimal ELF64 object whose printable strings include crypto identifiers."""
    header = bytearray(64)
    header[0:4] = b"\x7fELF"
    header[4] = 2  # 64-bit
    header[5] = 1  # little-endian
    header[6] = 1
    header[16] = 3  # ET_DYN (shared object)
    payload = bytes(header) + b"\x00" * 480
    payload += (
        b"libcrypto.so.1.1\x00"
        b"OpenSSL 1.1.1w\x00"
        b"RSA-2048\x00AES-128\x00MD5\x00EVP_PKEY_RSA\x00"
        b"BEGIN RSA PRIVATE KEY\x00"
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)


def write_expiring_rsa_cert(path: Path, days: int = 21) -> None:
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name(
        [
            x509.NameAttribute(NameOID.COMMON_NAME, "api.internal.ntro.example"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "ECDAT Mixed Corpus"),
        ]
    )
    now = datetime.now(timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(days=5))
        .not_valid_after(now + timedelta(days=days))
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .sign(key, hashes.SHA256())
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))


def prepare_mixed_enterprise() -> None:
    mixed = ROOT / "mixed-enterprise"
    write_fake_elf_so(mixed / "lib" / "libcrypto_legacy.so")
    write_expiring_rsa_cert(mixed / "certs" / "expiring-rsa.pem", days=21)


def zip_dir(name: str) -> Path | None:
    src = ROOT / name
    if not src.exists():
        return None
    zpath = OUT / f"{name}.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in src.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(src))
    return zpath


def main() -> None:
    prepare_mixed_enterprise()
    for name in CORPUS_DIRS:
        zpath = zip_dir(name)
        if zpath:
            print(f"Created {zpath}")


if __name__ == "__main__":
    main()

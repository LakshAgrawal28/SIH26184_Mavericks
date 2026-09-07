# ECDAT corpus accuracy (published)

This is the anti-LLM scoreboard. The scanner is **deterministic**: the same archive always
yields the same labelled families, and it must never invent algorithms that are not in the
fixture (GOST, Camellia, Twofish, …).

## How to run

```bash
PYTHONPATH=backend:. python -m scanner.accuracy.measure
curl -s http://localhost:8000/api/v1/accuracy
```

## What “good” means for NTRO / SIH

| Metric | Target |
|--------|--------|
| Recall of labelled families | 1.00 (every required RSA/AES/MD5/TLS/cert/binary hit) |
| Invented algorithms | 0 |
| Determinism | two consecutive runs, identical finding keys |
| Detection layers | Semgrep rules + catalog (APIs/configs/packages) + X.509 parser + config + binary strings |

Fixtures live in `scanner/corpus/`. Expected labels are in `scanner/accuracy/expected.json`.
Current published run: **23/23 required checks hit across 9 fixtures, 0 invented, deterministic.**

The mixed-enterprise archive (`scanner/corpus/archives/mixed-enterprise.zip`) is the
demo that clones fail: Java RSA/ECB + nginx TLS 1.0 + expiring RSA cert + `libcrypto_legacy.so`.

## Anti-empty-scan fixture: `realistic-stack`

`scanner/corpus/realistic-stack/` simulates an **unlabelled, multi-language real-world repo**
with none of the special-cased file names the old detectors relied on (no `CryptoService.java`,
no `nginx.conf`): a Node service, a Python API, a Spring `application.yml`, a Go TLS config, a
headless PEM (`fullchain`, no extension), and a nameless PKCS12 hint (`app.p12`). It exists to
prove the "judge uploads their own zip and gets zero artefacts" failure mode is closed —
the catalog layer alone must produce **15+ findings** across **4+ independent detection
methods** (`catalog-api`, `manifest-*`/`package-json`, `x509-parser`/`pem-marker`,
`filename-hint`) with zero invented algorithms. Enforced by
`backend/tests/test_moat.py::test_realistic_multilanguage_repo_is_not_empty`.

## What the catalog layer adds (`scanner/catalog/signatures.py`)

Beyond the original ~6 Semgrep YAML files, `catalog_detector.py` matches a reviewed
signature list covering:

- **APIs across 10+ ecosystems**: Java/Kotlin JCA-JCE + JSSE, Python (`hashlib`, `ssl`,
  `cryptography`, `jwt`, `bcrypt`), Node/Web Crypto, Go `crypto/*`, C/OpenSSL EVP, .NET,
  PHP/Ruby (`openssl_*`, `Digest::`), Rust crates.
- **40+ crypto package names** across npm/PyPI/Maven/Go/Cargo/Gemfile/Composer — including
  **lockfiles** (`package-lock.json`, `poetry.lock`, `go.sum`, `Cargo.lock`), not just manifests,
  and cloud KMS/Vault SDK references (AWS KMS, GCP KMS, Azure Key Vault, HashiCorp Vault).
- **Config keys** beyond `nginx.conf`: Spring `application.yml` TLS blocks, Docker Compose,
  `NODE_TLS_REJECT_UNAUTHORIZED=0`, generic `.conf/.yml/.properties/.env/.tf`.
- **Certs and keys without extensions**: any file whose first bytes contain
  `BEGIN CERTIFICATE` / `BEGIN ... PRIVATE KEY` is parsed regardless of name
  (`fullchain`, `server.cert`, `id_rsa`).
- **Binary formats beyond `.so`**: `.dll`, `.class`, `.pyc`, `.wasm` plus **magic-byte
  sniffing** (ELF/PE/Java class) for extensionless binaries.
- **Keystore/material filenames**: `.jks`, `.p12`, `.pfx`, `.jceks`, `id_rsa`, `id_ed25519`,
  flagged as `related-crypto-material` even with no readable content.

This is still a **reviewed catalog, not an LLM** — every finding traces to a specific regex
or filename rule in `scanner/catalog/signatures.py`, so the deterministic/anti-invention
guarantees above are unchanged. Extending coverage means adding a line to that file, not
retraining anything.

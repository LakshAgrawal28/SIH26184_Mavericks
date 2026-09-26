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

## Real-world validation

Corpus recall (above) measures whether labelled fixtures are hit. It does **not** estimate
false-positive rate or precision on code nobody on the team wrote. This section records
occasional runs against an **unmodified external repository** that is **not** under
`scanner/corpus/` and was **not** used to tune detectors.

### How to run (external repo)

```bash
git clone --depth 1 <REPO_URL> /tmp/ecdat-external-validation
cd <ECDAT_ROOT>
PYTHONPATH=backend:. python3 -c "
from pathlib import Path
from scanner.detectors.pipeline import run_all_detectors
root = Path('/tmp/ecdat-external-validation')
print('finding_rows', len(run_all_detectors(root)))
"
```

Optional: export a review sample (adjust path):

```bash
PYTHONPATH=backend:. python3 - <<'PY'
from pathlib import Path
from scanner.detectors.pipeline import run_all_detectors
root = Path("/tmp/ecdat-external-validation")
for f in run_all_detectors(root)[:50]:
    print(f"{f.detection_method}|{f.algorithm}|{f.file_path}:{f.line_number}")
PY
```

**Precision review protocol (manual):** sample 20–30 finding rows (stratify by
`detection_method` and include non-test paths when present). For each row, open the cited
file/line and mark **true positive** if it reflects real crypto usage, material, or
configuration (including test vectors and fixture keys in a crypto library). Mark **false
positive** if the hit is only a substring/name collision (e.g. identifier `JsonWebTokenError`
matched as `JWT`) or a wrong algorithm label with no crypto at that line. Report
`precision ≈ TP / (TP + FP)` on the sample; state sample size and date.

Do **not** change detectors to improve this number after the run (that would invalidate the
exercise).

### Run log template

| Field | Value |
|--------|--------|
| **Repository** | *(owner/name + URL)* |
| **Commit / clone** | `--depth 1` on `main` *(or SHA)* |
| **Scan date** | *YYYY-MM-DD* |
| **Finding rows** | *integer from `run_all_detectors`* |
| **Invented algorithms** | *0 expected; same denylist as `expected.json`* |
| **Manual sample size** | *e.g. 25 rows* |
| **Precision estimate** | *TP/(TP+FP), approximate* |
| **Notes** | *dominant FP patterns, test vs prod paths, etc.* |

### Run log — auth0/node-jsonwebtoken (preliminary)

| Field | Value |
|--------|--------|
| **Repository** | [auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) |
| **Commit / clone** | `--depth 1` on default branch, 2026-09-26 |
| **Scan date** | 2026-09-26 |
| **Finding rows** | **502** |
| **Invented algorithms** | **0** (no GOST/Camellia/Twofish-style denylist hits) |
| **Manual sample size** | **25** rows (stratified across `semgrep-rules`, `catalog-api`, `jwt`, `pem-marker`, `x509-parser`, `package-json`, plus `sign.js` / `verify.js`) |
| **Precision estimate** | **~72%** (18 TP, 7 FP on the sample) |
| **Notes** | Expected for a JWT library: many legitimate HS256/RS256/ES256 test usages, embedded PEM keys, and two parsed X.509 fixtures. Dominant noise: `catalog-api` / `jwt` rows on lines that only mention `JsonWebTokenError` or the word `jwt` in error strings, and some `jwt` rows attributing `HS256` to non-crypto require lines. Core library files (`sign.js`, `verify.js`, `lib/validateAsymmetricKey.js`, `package.json`) were **100% TP** on reviewed lines. No detector changes were made for this repo. |

Detection-method mix for this run (all rows): `catalog-api` 255, `jwt` 192, `semgrep-rules` 34, `pem-marker` 10, `algo-name` 6, `x509-parser` 2, `crypto-lib-ref` 2, `package-json` 1.

# Brief 3 — Scanner and discovery

**Reader:** Person 3 (detection / accuracy of findings)  
**Read time:** ~12 minutes  
**You own:** “How do we find crypto?” and why a scan can complete with zero artefacts.

---

## Job of this layer

Turn an extracted directory into a list of **CryptoFinding** objects:

- name / algorithm / primitive  
- asset type (algorithm, certificate, protocol, library, related-crypto-material)  
- file path + line  
- detection method + confidence  
- evidence snippet (the line or cert subject)

Pipeline: `scanner/detectors/pipeline.py` → `run_all_detectors(root)`.

---

## Detection layers (say “multi-layer,” then name them)

| Layer | Module | What it looks at |
|-------|--------|------------------|
| Semgrep rule pack | `semgrep_detector.py` | YAML in `scanner/rules/*.yaml` (Java, Python, JS, Go, …). Uses the Semgrep CLI if installed; otherwise an in-process pattern engine |
| **Catalog** | `catalog_detector.py` + `scanner/catalog/signatures.py` | Reviewed signature list: JCA/JCE, hashlib/ssl, Node/WebCrypto, Go `crypto/*`, OpenSSL EVP, .NET, PHP/Ruby, Rust — plus config keys, keystore filenames, headerless PEMs |
| Source regex | `source_detector.py` | JCE `getInstance`, hashlib, Node `crypto.createCipher`, Go TLS, JWT algs, PEM private keys |
| Manifests + lockfiles | `detect_manifests` | `package.json`/lockfiles, `pom.xml`/`build.gradle`, `requirements.txt`/`poetry.lock`, `go.mod`/`go.sum`, `Cargo.toml`/`.lock`, `Gemfile`, `composer.json` — 40+ crypto package names incl. cloud KMS/Vault SDKs |
| Certificates | `cert_detector.py` | Any file whose bytes contain `BEGIN CERTIFICATE`/`PRIVATE KEY`, regardless of extension (`fullchain`, `id_rsa`, `server.cert`) |
| TLS / configs | `detect_configs` | nginx, Spring `application.yml`, Docker Compose, generic `.conf/.yml/.properties/.env/.tf` |
| Binaries | `binary_detector.py` | `.so/.dylib/.dll/.class/.pyc/.wasm/…` plus **magic-byte sniffing** (ELF/PE/Java class) for extensionless binaries |
| Filename hints | `catalog_detector.py` | `.jks/.p12/.pfx/.jceks`, `id_rsa`/`id_ed25519` flagged as crypto material even with unreadable content |

Findings are **ranked and deduped** so Semgrep + catalog + regex on the same line do not double-count.

---

## What is intentionally skipped

`IGNORE_DIRS`: `node_modules`, `vendor`, `.venv`, `dist`, `build`, `.next`, `target`, `.git`, …

That is correct behaviour, not a bug — vendored dependency source is not *your* crypto usage.
`coverage_stats()` in the pipeline now reports `first_party_files` vs `skipped_vendor_files`
so an empty result is explainable in the UI instead of looking like a hang.

Still genuinely not covered (say this honestly if asked):

- Decompiling `.class`/`.jar` bytecode into source-level findings (we detect it exists via
  binary string/magic-byte sniffing, we do not decompile it)
- Obfuscated names (`"AE"+"S"`) — see `scanner/corpus/obfuscated-java/` as a stated false-negative boundary
- Runtime-only configuration (crypto chosen by an env var value we cannot see statically)

---

## Nested archives

`unpack_nested_archives` extracts `.zip/.jar/.war/.ear` next to the archive as `{stem}_unpacked`, depth 2.

---

## Proof this isn't cherry-picked: `realistic-stack`

`scanner/corpus/realistic-stack/` is a deliberately unlabelled, multi-language fixture that
simulates a **judge's own random zip** — Node + Python + Java + Go + Spring YAML + lockfiles
+ a headless PEM + a nameless `.p12` — with none of the filenames the old detectors
special-cased. It produces **44 findings across 7 required families** and is asserted by
`backend/tests/test_moat.py::test_realistic_multilanguage_repo_is_not_empty` to always hit
4+ independent detection methods. This is the direct fix for the earlier "1111 files, 0
artefacts" failure — see `docs/ACCURACY.md` for the full breakdown.

---

## Demo corpus (this is the proof)

Build zips:

```bash
python scanner/scripts/build_corpus_zips.py
```

**Use this in the live demo:**  
`scanner/corpus/archives/mixed-enterprise.zip`

It is designed so clones fail and we succeed:

- Java `Cipher.getInstance("RSA/ECB/...")`  
- nginx TLS 1.0  
- expiring RSA cert  
- fake `libcrypto_legacy.so` with crypto strings  

Also useful: `java-rsa-aes.zip`, `python-crypto.zip`, `ecdat-demo-vulnerable-app.zip` (9 source/cert files — **not** 1111 files).

Accuracy labels: `scanner/accuracy/expected.json`.  
Measure: `PYTHONPATH=backend:. python -m scanner.accuracy.measure`  
API: `GET /api/v1/accuracy` (recall 1.0, invented algorithms 0).

---

## Why the old "1111 files, 0 artefacts" bug happened (fixed)

The job **did run**. `total_files=1111`, `total_artefacts=0`, status `completed`. Unpack
succeeded; the old detectors only knew ~6 exact Semgrep strings plus a short regex list, so
a real app zip with unfamiliar file names or a headerless PEM matched nothing.

Now the catalog layer (see above) covers 10+ language ecosystems, config keys, lockfiles,
and keystore filenames, so this should no longer happen on a normal project. If a scan is
still empty, the stage text tells you first-party vs vendor file counts so you can tell
"genuinely no crypto" from "wrong archive uploaded."

---

## Rules vs LLM (judge line)

*“We use Semgrep-style rules and parsers so the same zip always yields the same families. We never invent GOST or Twofish if they are not in the tree. Confidence and a file:line snippet sit on every artefact.”*

If Semgrep CLI times out (60s on huge trees), the in-process engine still runs; source/cert/binary layers still run.

---

## One sentence for judges

*“Discovery is four-plus complementary layers with evidence — not a single regex and not a generative model.”*

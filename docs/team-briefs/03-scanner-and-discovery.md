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
| Source regex | `source_detector.py` | JCE `getInstance`, hashlib, Node `crypto.createCipher`, Go TLS, JWT algs, PEM private keys |
| Manifests | `detect_manifests` | `package.json`, `pom.xml`, `requirements.txt`, `go.mod`, … for known crypto libraries |
| Certificates | `cert_detector.py` | `.pem/.crt/.cer/.der` X.509 parse (algorithm, key size, days to expiry) |
| TLS / configs | `detect_configs` | nginx `ssl_protocols`, similar config files |
| Binaries | `binary_detector.py` | `.so/.dylib/.exe/…` printable strings (`RSA`, `MD5`, `BEGIN RSA PRIVATE KEY`) |

Findings are **ranked and deduped** so Semgrep + regex on the same line do not double-count.

---

## What is intentionally skipped

`IGNORE_DIRS`: `node_modules`, `vendor`, `.venv`, `dist`, `build`, `.next`, `target`, `.git`, …

So a zip of a whole Node app can report **thousands of files unpacked** while matching **nothing** in app source.

Also **not** scanned as source:

- `.class` bytecode (nested jars unpack to classes; we need `.java` or strings in `.so`)  
- Obfuscated names (`"AE"+"S"`) — see `scanner/corpus/obfuscated-java/` as a known false-negative boundary  

---

## Nested archives

`unpack_nested_archives` extracts `.zip/.jar/.war/.ear` next to the archive as `{stem}_unpacked`, depth 2.

That inflates `total_files`. It does **not** magically decompile jars. A fat Spring Boot zip of dependencies can be 1000+ files and still 0 artefacts.

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

## Why the last user zip showed “1111 files, 0 artefacts”

The job **did run**. `total_files=1111`, `total_artefacts=0`, status `completed`.

That message means: unpack succeeded; **no rule/regex/cert/config/binary hit**. Typical causes:

1. Uploaded a real app zip (frontend + tooling), not `mixed-enterprise.zip`.  
2. Crypto only inside skipped dirs (`node_modules`).  
3. Crypto only as `.jar` / `.class`.  
4. Languages / APIs we do not pattern-match.

Contrast: `mixed-enterprise-demo` in the same DB was **7 files / 31 artefacts**.

---

## Rules vs LLM (judge line)

*“We use Semgrep-style rules and parsers so the same zip always yields the same families. We never invent GOST or Twofish if they are not in the tree. Confidence and a file:line snippet sit on every artefact.”*

If Semgrep CLI times out (60s on huge trees), the in-process engine still runs; source/cert/binary layers still run.

---

## One sentence for judges

*“Discovery is four-plus complementary layers with evidence — not a single regex and not a generative model.”*

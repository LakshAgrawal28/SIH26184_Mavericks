# Brief 6 — CBOM, accuracy, security, judge Q&A

**Reader:** Person 6 (standards, evaluation, Q&A closer)  
**Read time:** ~12 minutes  
**You own:** “Is this real / standard / safe / better than X?”

---

## CycloneDX 1.6 CBOM (the audit artefact)

**CBOM** = Cryptographic Bill of Materials. Same family as SBOM, for **crypto assets**.

ECDAT emits JSON:

- `bomFormat`: CycloneDX  
- `specVersion`: `1.6`  
- `$schema`: official bom-1.6  
- components with cryptographic properties (primitive, algorithm, state, NIST quantum security level where mapped)  
- `bom-ref` per artefact, dependency edge from the scanned app  

Builder: `backend/app/cbom/builder.py`  
Validate: `backend/app/cbom/validator.py` against `backend/app/cbom/schema/bom-1.6.schema.json`  

UI: **CBOM VALID 1.6** then **Export CBOM**.

Alignment to name-drop: **ECMA-424**, **NIST SP 1800-38B** (crypto discovery), **NIST IR 8547** (PQC transition).

---

## Accuracy (anti-LLM scoreboard)

Published in `docs/ACCURACY.md` and `GET /api/v1/accuracy`.

| Metric | Target |
|--------|--------|
| Recall of labelled families | **1.00** on the corpus |
| Invented algorithms | **0** (no GOST/Camellia/Twofish unless present) |
| Determinism | two runs → same finding keys |
| Layers | Semgrep + X.509 + config + binary strings |

Fixtures: `scanner/corpus/` · expected: `scanner/accuracy/expected.json`.

Judge line:  
*“We measure recall and invention on a labelled mixed-enterprise fixture. The scanner is a function, not a chatbot.”*

---

## Security of the scanner itself

NTRO will ask “can the zip own us?”

- **Zip slip:** reject members whose resolved path leaves the extract root.  
- Size cap: `scan_max_bytes` (default 500 MB).  
- Nested unpack depth limited.  
- Workers (compose) unprivileged + timeouts.  
- Work dir wiped after the job.  
- JWT on APIs; default admin only for demo.  
- No mandatory outbound internet for a scan.

---

## How we differ from lookalikes

| Tool | They do | We add |
|------|---------|--------|
| Trivy / SonarQube | CVEs, code smells | Crypto inventory + quantum timeline |
| IBM CBOMkit | CLI inventory / CBOM | Risk + Mosca + PQC UI + evidence |
| Generic SBOM (Syft-style) | Packages | Algorithms, certs, TLS, binaries as crypto assets |

Novelty for SIH: **one platform** from zip to CBOM with Mosca and NIST names, built for **on-prem Indian gov**.

---

## SIH criteria (map our proof)

| Criterion | What you point at |
|-----------|-------------------|
| Problem understanding | HNDL + “cannot migrate what you cannot see” |
| Innovation | Discovery + risk + Mosca + PQC + CBOM together |
| Feasibility | Running Docker/local demo |
| Impact | Every PQC program needs inventory first |
| Presentation | Five-minute zip demo + this Q&A |

---

## Prepared answers (short)

**vs vulnerability scanners?**  
They find known bugs. We find **where crypto lives** and whether it survives a CRQC.

**False positives?**  
Layered detectors, confidence, file:line evidence. Analysts verify in one click. Obfuscation is a stated limit.

**Air-gap?**  
Yes. Local containers/process, no cloud LLM.

**Why not AI discovery?**  
NTRO needs reproducible, auditable findings. Rules + parsers. Accuracy harness forbids invented algs.

**Mosca?**  
\(X+Y>Z\) with Optimistic/Baseline/Aggressive/Regulatory \(Z\).

**PQC names?**  
FIPS 203 ML-KEM, 204 ML-DSA, 205 SLH-DSA, hybrids like X25519MLKEM768.

**Empty scan?**  
Wrong artefact type (jars/node_modules), not a failed engine. Demo zip is mixed-enterprise.

**Speed?**  
Corpus demo is seconds in sync mode; larger trees in workers; Semgrep CLI has a timeout then fallback.

---

## Submission / demo checklist

- [ ] mixed-enterprise.zip built  
- [ ] SYNC_SCAN or Celery actually running  
- [ ] Login works  
- [ ] One completed scan with artefacts &gt; 0  
- [ ] CBOM validates  
- [ ] Accuracy endpoint returns recall 1 / invented 0  
- [ ] Each of the six people can give their **one sentence** from briefs 1–6  

---

## One sentence for judges

*“ECDAT is standards-native (CycloneDX 1.6), measurable (labelled recall, zero invented algorithms), and deployable where NTRO actually works — on premise, with evidence, not vibes.”*

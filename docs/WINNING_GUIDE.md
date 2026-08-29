# ECDAT — Winning Guide & Knowledge Base

**Purpose:** Everything your team needs to understand, build, present, and **win** SIH Problem 26164 for NTRO.  
**Companion docs:** [`PRD.md`](PRD.md) (what to build) · Master engineering plan (how to build)

---

## Table of contents

1. [How SIH judging works — score every point](#1-how-sih-judging-works)
2. [NTRO problem statement — line-by-line compliance](#2-ntro-problem-statement-compliance)
3. [What wins vs what loses](#3-what-wins-vs-what-loses)
4. [Theory you must know (teach this first)](#4-theory-you-must-know)
5. [NIST & industry frameworks we align to](#5-nist--industry-frameworks)
6. [CycloneDX CBOM — field-by-field requirements](#6-cyclonedx-cbom-requirements)
7. [Discovery engine — what to scan and how](#7-discovery-engine-deep-dive)
8. [Quantum risk model — defensible scoring](#8-quantum-risk-model)
9. [Mosca's theorem — implementation details](#9-moscas-theorem)
10. [PQC & hybrid recommendations — complete mapping](#10-pqc--hybrid-recommendations)
11. [Competitive landscape — how we beat existing tools](#11-competitive-landscape)
12. [Presentation & demo strategy for judges](#12-presentation--demo-strategy)
13. [Judge Q&A — prepared answers](#13-judge-qa)
14. [Submission checklist (mandatory deliverables)](#14-submission-checklist)
15. [Algorithm reference tables](#15-algorithm-reference-tables)
16. [Sources & further reading](#16-sources--further-reading)

---

# 1. How SIH judging works

## Official evaluation criteria (8 parameters)

SIH evaluates ideas and implementations on:

| # | Criterion | What judges ask | Weight (PPT round) |
|---|-----------|-----------------|-------------------|
| 1 | **Novelty** | Is this genuinely new? | Part of 25% innovation |
| 2 | **Complexity** | Real technical depth? | Overall quality |
| 3 | **Clarity & detail** | Complete, no gaps? | 20% problem understanding |
| 4 | **Feasibility** | Can you actually build it? | 20% technical feasibility |
| 5 | **Practicability** | Works in real NTRO/gov context? | Overall quality |
| 6 | **Sustainability** | Maintainable long-term? | Overall quality |
| 7 | **Scale of impact** | How many systems/people affected? | 20% impact |
| 8 | **User experience** | Usable by security teams? | Overall quality |

**PPT scoring weights (internal/national rounds):**

| Criteria | Weight |
|----------|--------|
| Problem understanding & clarity | 20% |
| Innovation and uniqueness | **25%** |
| Technical feasibility | 20% |
| Impact and scalability | 20% |
| Presentation quality | 15% |

## How ECDAT maps to each criterion

| Criterion | Our answer (what to say) | Proof in demo |
|-----------|--------------------------|---------------|
| **Novelty** | First unified CBOM + quantum risk + Mosca + PQC platform for Indian gov/enterprise; integrates discovery across code + binaries + containers with evidence-backed findings | Live scan → unique risk timeline + hybrid recs |
| **Complexity** | Multi-layer scanner (Semgrep, Syft, cert parsing, binary analysis), CycloneDX CBOM generation, composite risk engine, Mosca scenarios | Show architecture diagram + evidence drill-down |
| **Clarity** | Follows NIST SP 1800-38 discovery model + CycloneDX ECMA-424 standard | Valid CBOM JSON export |
| **Feasibility** | Built on proven OSS (Semgrep, Syft, FastAPI, CycloneDX); Docker Compose one-command start | `docker compose up` → working demo |
| **Practicability** | On-prem capable, no mandatory cloud, handles air-gapped gov environments | Mention offline mode, no external API calls |
| **Sustainability** | Standard CBOM format, pluggable detectors, JSON-configured algorithm DB | Show config files, extensible architecture |
| **Scale of impact** | Every org migrating to PQC needs crypto inventory first — NIST mandates migration by 2030–2035 | Cite NIST IR 8547 timeline |
| **UX** | Security analyst dashboard with inventory, risk, Mosca timeline, prioritized recommendations | Walk through UI live |

---

# 2. NTRO problem statement compliance

Problem **26164** — Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)

## Requirement checklist (use in PPT Slide 3–4)

| # | Problem statement requirement | ECDAT feature | Demo proof |
|---|------------------------------|---------------|------------|
| i | Identify & catalogue crypto artefacts (algorithms, keys, certs, protocols, libraries, HSMs, cloud services) | Multi-layer discovery engine + unified inventory | Inventory table with type filters |
| ii | Comprehensive quantum risk assessment; identify quantum-prone systems | Composite risk engine (HNDL + operational) | Risk badges + factor breakdown |
| iii | Classify by type, lifetime, business criticality; apply Mosca's theorem | Classification + business context + Mosca engine | Mosca timeline with X, Y, Z |
| iv | Recommend PQC/hybrid alternatives based on risk, latency, cost | PQC recommendation engine with effort/performance notes | Recommendations table |
| **Deliverable 1** | CBOM analytics tool scanning repos, binaries, libraries, containers | Scanner pipeline with 4 target types | Upload → scan → results |
| **Deliverable 2** | Report in standardized format with versions/modes | CycloneDX 1.6+ CBOM JSON export | Download CBOM |
| **Deliverable 3** | Interactive GUI for scan, risk, results | Next.js dashboard | Full UI walkthrough |

## Keywords judges expect you to use correctly

- **CBOM** (Cryptographic Bill of Materials) — not just "crypto scanner"
- **Post-Quantum Cryptography (PQC)** — not "quantum encryption"
- **Mosca's theorem** — X + Y > Z, not vague "quantum timeline"
- **Harvest Now, Decrypt Later (HNDL)** — shows you understand the real threat
- **Cryptographic agility** — ability to swap algorithms without rewriting everything
- **Hybrid migration** — classical + PQC combined during transition
- **CycloneDX / ECMA-424** — the standard name for CBOM format
- **ML-KEM, ML-DSA, SLH-DSA** — NIST standard names (FIPS 203/204/205), not "Kyber/Dilithium" alone

---

# 3. What wins vs what loses

## DO — things that impress NTRO/security judges

| Action | Why it wins |
|--------|-------------|
| **Live working demo** (not slides-only) | SIH requires partial implementation + demo video |
| **Show evidence** (file:line, cert details) | Proves discovery is real, not mocked |
| **Export valid CycloneDX CBOM** | Standards credibility — ECMA-424 |
| **Explain Mosca with scenarios** (Z=5, 10, 15) | Shows intellectual honesty about uncertainty |
| **Cite NIST SP 1800-38, IR 8547, FIPS 203** | Aligns with frameworks NTRO cares about |
| **Mention HNDL explicitly** | Shows deep understanding of quantum threat model |
| **Hybrid recommendations** (X25519+ML-KEM-768) | Shows practical migration knowledge |
| **Confidence scores on findings** | Shows maturity about false positives |
| **On-prem / air-gap capability** | Critical for NTRO-style deployment |
| **Architecture diagram on slide** | Evaluators spend 2–3 min on PPT — must be visual |

## DON'T — instant credibility killers

| Mistake | Why judges reject it |
|---------|---------------------|
| "We use AI to detect crypto" without evidence | Sounds like buzzword; SIH penalizes "AI without HOW" |
| Claiming AES is "quantum broken" | Wrong — AES-256 is quantum-safe; shows ignorance |
| Single fixed "quantum will arrive in 2030" | Mosca requires scenarios, not prophecy |
| Mocked/fake scan results | Demo video must show real prototype |
| Ignoring binaries/containers | Problem statement explicitly requires them |
| No standardized output format | CBOM is the deliverable — PDF alone isn't enough |
| Claiming NIST compliance/certification | Unless actually validated — say "aligned with" |
| Copying IBM CBOMkit without differentiation | Need clear value-add (risk + Mosca + GUI) |

## Our differentiation (memorize this)

> **IBM CBOMkit** discovers crypto assets and generates CBOM.  
> **ECDAT** = discovery + **quantum risk scoring** + **Mosca timeline analysis** + **PQC/hybrid recommendations** + **prioritized migration plan** + **interactive dashboard** — the full NTRO problem statement, not just inventory.

---

# 4. Theory you must know

## 4.1 The two quantum algorithms that matter

### Shor's algorithm (1994) — breaks public-key crypto

- Factors large integers in **polynomial time** on a quantum computer
- Solves discrete logarithm (DH, ECDH, ECDSA) efficiently
- **Impact:** RSA, DSA, DH, ECDH, ECDSA, Ed25519, X25519 — ALL broken
- RSA-2048 needs ~4,096 logical qubits (Gidney & Ekerå, 2019) — not science fiction

### Grover's algorithm (1996) — weakens symmetric crypto

- Searches unsorted space in O(√N) instead of O(N)
- **Halves effective key strength** for symmetric ciphers and hashes
- AES-128 → 64-bit effective quantum security (too weak for long-term)
- AES-256 → 128-bit effective (acceptable)
- SHA-256 → 128-bit preimage resistance (acceptable)
- **Does NOT break** RSA/EC — Shor's does that

## 4.2 Threat summary table (memorize for Q&A)

| Algorithm | Classical attack | Quantum attack | Quantum status | Action |
|-----------|-----------------|----------------|----------------|--------|
| RSA (all sizes) | Hard | **Shor — broken** | CRITICAL | Migrate to ML-KEM / ML-DSA |
| ECDH / ECDSA / Ed25519 | Hard | **Shor — broken** | CRITICAL | Migrate to ML-KEM / ML-DSA |
| DH (finite field) | Hard | **Shor — broken** | CRITICAL | Migrate to ML-KEM |
| AES-128 | Hard | Grover → 64-bit | WEAKENED | Upgrade to AES-256 |
| AES-256 | Hard | Grover → 128-bit | **SAFE** | Keep |
| SHA-256 | Hard | Grover → 128-bit | **SAFE** | Keep |
| SHA-1 / MD5 | Already weak | Worse | BROKEN | Immediate replacement |
| 3DES / DES | Weak | Very weak | BROKEN | Immediate replacement |
| ML-KEM (FIPS 203) | Hard | Designed resistant | **PQC SAFE** | Deploy |
| ML-DSA (FIPS 204) | Hard | Designed resistant | **PQC SAFE** | Deploy |
| SLH-DSA (FIPS 205) | Hard | Hash-based safe | **PQC SAFE** | Deploy |

## 4.3 Harvest Now, Decrypt Later (HNDL)

**The threat most people miss:**

1. Adversary records encrypted traffic **today** (TLS, VPN, email)
2. Data is protected by RSA/ECDH key exchange
3. When quantum computer arrives, adversary decrypts recorded traffic
4. **Data is compromised retroactively** — even though it was "secure" when sent

**Who is at risk:**
- Long-retention data (medical, financial, classified, legal)
- Long-lived certificates (root CA, code signing — 5–15 year validity)
- Any RSA/ECDH-protected communication with >5 year confidentiality need

**What this means for ECDAT:**
- HNDL risk = `quantum_vulnerability × data_sensitivity × data_lifetime × exposure`
- Internet-facing RSA/ECDH with long data lifetime = highest priority

## 4.4 Mosca's theorem (full explanation)

**Origin:** Dr. Michele Mosca, Institute for Quantum Computing, University of Waterloo

**The inequality:**

```
If (X + Y) > Z  →  migration must start NOW
```

| Variable | Name | Meaning | Example |
|----------|------|---------|---------|
| **X** | Security shelf life | How long must data stay confidential? | 10 years (health records) |
| **Y** | Migration time | How long to fully migrate crypto systems? | 4 years (enterprise PKI) |
| **Z** | Collapse time | Years until CRQC can break current crypto | 7–15 years (estimate) |

**Worked example (use in presentation):**

```
Government system protecting classified data:
  X = 25 years (retention requirement)
  Y = 8 years  (full PKI + HSM + application migration)
  Z = 10 years (baseline planning scenario)

  X + Y = 33 > Z = 10  →  EXPIRED — already late, act immediately
```

**Critical nuance (GSMA extension):**
- X and Y run **concurrently** — migration doesn't pause the confidentiality clock
- Even if migration started, data protected by RSA today is still HNDL-vulnerable

**How ECDAT implements it:**
- Never show single Z — always show 3 scenarios (optimistic/baseline/aggressive)
- Label as "planning scenarios" not predictions
- Show margin: `Z - (X + Y)` — negative = late

## 4.5 NIST PQC standards (August 2024)

| FIPS | Algorithm | Old name | Purpose | Security levels |
|------|-----------|----------|---------|-----------------|
| **FIPS 203** | ML-KEM | CRYSTALS-Kyber | Key encapsulation (replaces RSA/ECDH) | ML-KEM-512, -768, -1024 |
| **FIPS 204** | ML-DSA | CRYSTALS-Dilithium | Digital signatures (replaces RSA/ECDSA) | ML-DSA-44, -65, -87 |
| **FIPS 205** | SLH-DSA | SPHINCS+ | Hash-based signatures (conservative) | SLH-DSA-SHA2-128s/f, etc. |

**Recommended defaults for enterprise:**
- Key exchange: **ML-KEM-768** (NIST Level 3)
- Signatures: **ML-DSA-65** (NIST Level 3)
- Long-term archive: **SLH-DSA** (hash-based, conservative trust assumptions)

## 4.6 Hybrid cryptography (transition period)

**Why hybrid:** Neither classical nor PQC alone during migration.

| Hybrid | Classical part | PQC part | Use case | Standard |
|--------|---------------|----------|----------|----------|
| **X25519MLKEM768** | X25519 | ML-KEM-768 | TLS 1.3 key exchange | RFC 10024 |
| **SecP256r1MLKEM768** | P-256 ECDH | ML-KEM-768 | FIPS-constrained TLS | RFC 10024 |
| **RSA + ML-DSA-65** | RSA-3072 | ML-DSA-65 | Code signing transition | NIST guidance |
| **ECDSA + ML-DSA-65** | ECDSA P-256 | ML-DSA-65 | Certificate transition | NIST guidance |

**Security property:** Attacker must break **BOTH** algorithms to compromise the session.

**Performance impact:** ~1.5ms additional latency for TLS handshake (negligible for most apps).

---

# 5. NIST & industry frameworks

## 5.1 NIST migration roadmap (follow this order in your presentation)

NIST/CISA/NSA quantum-readiness steps:

```
Step 1: Establish Quantum-Readiness Roadmap
Step 2: Prepare Cryptographic Inventory    ← ECDAT CORE
Step 3: Discuss with Technology Vendors
Step 4: Determine Supply Chain Dependencies
```

**Key quote from NIST SP 1800-38B:**
> "Automated tools should identify the cryptographic algorithms used in hardware and software modules, libraries, and embedded code... as well as algorithms used to protect data at rest, in transit, and in use."

**ECDAT positioning:** We automate Step 2 — the mandatory first step before any PQC migration.

## 5.2 NIST SP 1800-38 series

| Volume | Title | Relevance to ECDAT |
|--------|-------|-------------------|
| **SP 1800-38A** | Migration practices overview | Frame our tool in the migration lifecycle |
| **SP 1800-38B** | **Cryptographic Discovery** | Our direct alignment — discovery architecture |
| **SP 1800-38C** | Interoperability testing | Future: test PQC protocol support |

**SP 1800-38B discovery domains (we must cover):**

| Domain | What to discover | ECDAT detector |
|--------|-----------------|----------------|
| **Code development pipeline** | Crypto in source, dependencies, CI configs | Semgrep + Syft + manifest parsers |
| **Operational systems** | Running apps, keystores, cert stores | Cert parser + config scanner |
| **Network services** | TLS configs, cipher suites | nginx/apache/java.security parser |
| **Embedded/firmware** | Crypto in binaries | Binary strings/YARA (P1) |

**SP 1800-38B four dependency categories:**

1. **Network protocols** — TLS, VPN, SSH (config-level detection)
2. **PKI & certificate management** — full cert hierarchy, not just leaf certs
3. **Code signing & supply chain** — signing certs, firmware update keys
4. **Application-layer crypto** — JWT signing, database encryption, custom crypto

## 5.3 NIST IR 8547 — transition timeline

| Milestone | Date | Meaning |
|-----------|------|---------|
| PQC standards finalized | Aug 2024 | ML-KEM, ML-DSA, SLH-DSA ready |
| RSA/ECDH/ECDSA **deprecated** | **2030** | Continued use requires documented risk justification |
| RSA/ECDH/ECDSA **disallowed** | **2035** | Must be removed from all systems |
| High-risk systems | **Earlier than 2030** | HNDL-sensitive systems migrate first |

**Algorithms affected after 2030:** RSA (all sizes), ECDH, ECDSA, DSA, FFDH

**Use in Mosca engine:** Baseline Z=10 aligns with "decade to CRQC" planning; regulatory pressure at 2030.

## 5.4 CycloneDX / ECMA-424

- OWASP CycloneDX ratified as **Ecma International ECMA-424** standard
- CBOM support since **CycloneDX v1.6** (April 2024); enhanced in **v1.7** (October 2025)
- IBM Research originally contributed CBOM schema to CycloneDX
- CBOM is now part of the broader **xBOM ecosystem** (SBOM + CBOM + HBOM + OBOM)

## 5.5 CISA/NIST/NSA joint guidance

All three agencies agree:
1. **Inventory first** — you cannot migrate what you cannot see
2. **Prioritize by risk** — data sensitivity × exposure × algorithm vulnerability
3. **Start now** — migration takes years, not months
4. **Use hybrid during transition** — don't rip-and-replace overnight

---

# 6. CycloneDX CBOM requirements

## 6.1 Mandatory CBOM structure

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.6",
  "serialNumber": "urn:uuid:...",
  "version": 1,
  "metadata": {
    "timestamp": "2026-08-29T00:00:00Z",
    "component": {
      "type": "application",
      "name": "scanned-application",
      "version": "1.0"
    },
    "tools": {
      "components": [{ "type": "application", "name": "ECDAT", "version": "1.0.0" }]
    }
  },
  "components": [ /* cryptographic-asset entries */ ],
  "dependencies": [ /* uses/dependsOn/provides relationships */ ]
}
```

## 6.2 Cryptographic asset types (must support)

| assetType | Examples | Priority |
|-----------|----------|----------|
| `algorithm` | AES-256-GCM, RSA-2048, SHA-256, ML-KEM-768 | **P0** |
| `certificate` | X.509 TLS cert, code-signing cert | **P0** |
| `protocol` | TLS 1.2, TLS 1.3, SSH | **P0** |
| `related-crypto-material` | Keys, secrets, passwords | **P1** |
| `private-key` | RSA private key, EC private key | **P1** |
| `public-key` | RSA public key | **P1** |
| `secret-key` | AES key material | **P1** |

## 6.3 Algorithm properties (mandatory fields)

| Field | Example | Why it matters |
|-------|---------|----------------|
| `primitive` | `ae`, `signature`, `hash`, `block-cipher`, `kem` | Algorithm role |
| `parameterSetIdentifier` | `256`, `2048`, `768` | Key/digest size |
| `mode` | `gcm`, `cbc`, `ecb` | Cipher mode (ECB = bad) |
| `cryptoFunctions` | `["encrypt", "decrypt"]` | What it does |
| `classicalSecurityLevel` | `128` | Bits of classical security |
| `nistQuantumSecurityLevel` | `0`–`5` | **0 = quantum-vulnerable** |
| `oid` | `2.16.840.1.101.3.4.1.46` | Standard identifier |

**Critical field:** `nistQuantumSecurityLevel: 0` means quantum-vulnerable — this is what PQC migration planning scans for.

## 6.4 Evidence (our extension — high value for judges)

CycloneDX 1.7 supports `evidence.occurrences`:

```json
"evidence": {
  "occurrences": [{
    "location": "src/main/java/CryptoService.java",
    "line": 42,
    "additionalContext": "Cipher.getInstance(\"RSA/ECB/PKCS1Padding\")"
  }]
}
```

**This is a major differentiator** — most CBOM tools don't include source-level evidence.

## 6.5 Dependency relationships

| Relationship | Meaning | Example |
|-------------|---------|---------|
| `dependsOn` | Component uses another | App dependsOn OpenSSL library |
| `provides` | Component implements crypto | OpenSSL provides AES-256-GCM |
| `uses` | Runtime usage | TLS 1.3 uses ECDH/secp256r1 |

---

# 7. Discovery engine deep dive

## 7.1 NIST SP 1800-38B discovery architecture (align to this)

```
┌─────────────────────────────────────────────────────────┐
│                  DISCOVERY DOMAINS                       │
├─────────────────┬─────────────────┬─────────────────────┤
│ Code Pipeline   │ Operational     │ Network Services     │
│ - Source code   │ - Keystores     │ - TLS configs        │
│ - Dependencies  │ - Cert stores   │ - Cipher suites      │
│ - CI/CD configs │ - App configs   │ - Protocol versions  │
├─────────────────┴─────────────────┴─────────────────────┤
│              CONTAINER / BINARY LAYER                     │
│ - Docker images  - Binary executables  - Firmware         │
└─────────────────────────────────────────────────────────┘
                          ↓
              NORMALIZE → CBOM → RISK → PQC
```

## 7.2 Source code detection (by language)

| Language | Crypto libraries | API patterns to detect |
|----------|-----------------|----------------------|
| **Java** | JCE, BouncyCastle, Google Tink | `Cipher.getInstance`, `KeyPairGenerator`, `Signature.getInstance` |
| **Python** | pyca/cryptography, PyCryptodome, hashlib | `from cryptography`, `AES.new`, `rsa.generate` |
| **JavaScript** | Node crypto, node-forge, jsonwebtoken | `crypto.createCipheriv`, `jwt.sign`, WebCrypto |
| **Go** | crypto/*, x/crypto | `rsa.GenerateKey`, `tls.Config`, `ecdsa.Sign` |
| **C/C++** | OpenSSL, mbedTLS, libsodium | `EVP_*`, `SSL_CTX_new`, `#include <openssl/rsa.h>` |
| **Rust** | ring, rustls, openssl crate | `ring::aead`, `rustls::ClientConfig` |

## 7.3 Dependency/manifest scanning

| File | Ecosystem | Crypto packages to flag |
|------|-----------|------------------------|
| `package.json` | Node.js | node-forge, crypto-js, jsonwebtoken, bcrypt |
| `requirements.txt` | Python | cryptography, pycryptodome, paramiko |
| `pom.xml` / `build.gradle` | Java | bouncycastle, nimbus-jose-jwt |
| `go.mod` | Go | golang.org/x/crypto |
| `Cargo.toml` | Rust | ring, rustls, openssl |
| `Gemfile` | Ruby | openssl, bcrypt |

## 7.4 Certificate & config detection

| Source | Finds |
|--------|-------|
| `.pem`, `.crt`, `.cer` files | X.509 certs: subject, issuer, expiry, sig algorithm |
| `nginx.conf`, `apache ssl.conf` | TLS version, cipher suites, cert paths |
| `java.security` | Disabled algorithms, policy files |
| `openssl.cnf` | Default algorithms, engine configs |
| Kubernetes TLS secrets | Cert metadata (if scanning k8s manifests) |

## 7.5 Container scanning (P1 — mention in presentation)

**Tool:** cbomkit-theia (IBM/PQCA, open source) or Syft + custom plugins

| Layer | What's found |
|-------|-------------|
| Installed packages | OpenSSL version, libssl, gnutls |
| Config files | `/etc/ssl/`, java.security in image |
| Embedded certs | TLS certs in `/etc/nginx/certs/` |
| Secrets | Hardcoded keys in env files |

## 7.6 Binary scanning (P1)

| Technique | Finds | Confidence |
|-----------|-------|------------|
| `strings` extraction | "AES-256-GCM", "RSA", OpenSSL version | Medium |
| Import table (lief/readelf) | libssl.so, libcrypto.so linkage | High |
| YARA rules | OpenSSL/BoringSSL fingerprints | High |
| Entropy analysis | Encrypted/encoded key material | Low |

## 7.7 What we CAN vs CANNOT detect (be honest with judges)

| Detectable | Not reliably detectable |
|-----------|------------------------|
| Known algorithm API calls | Custom/proprietary crypto |
| OpenSSL/BouncyCastle/etc. libraries | White-box cryptography |
| X.509 certificates on disk | Runtime-selected algorithms |
| TLS config files | Encrypted/obfuscated binaries |
| Dependency versions | HSM-internal algorithms |
| Hardcoded PEM keys | Network traffic (no runtime scan in MVP) |

---

# 8. Quantum risk model

## 8.1 Why NOT "RSA = HIGH, AES = LOW"

Real risk depends on **context**:

| Factor | Question |
|--------|----------|
| Algorithm | RSA-2048 vs AES-256 — completely different quantum threat |
| Key size | RSA-1024 vs RSA-4096 — different classical AND quantum risk |
| Data sensitivity | Public website vs classified database |
| Data lifetime | Session key (minutes) vs archive (25 years) |
| Exposure | Internal only vs internet-facing |
| Detection confidence | Semgrep match vs strings guess |

## 8.2 Composite risk formula (ECDAT model)

```
HNDL_risk = quantum_vulnerability × (sensitivity/10) × (lifetime/10) × (exposure/10)
            × asymmetric_encryption_factor

Operational_risk = (QV×0.4 + classical_weakness×0.2 + exposure×0.2 + criticality×0.2)
                   × (1 + migration_complexity/20)

Final_score = (0.6 × HNDL_risk + 0.4 × Operational_risk) × confidence
```

## 8.3 Risk bands

| Band | Score | Color | Action |
|------|-------|-------|--------|
| **Critical** | ≥ 7.5 | Red | Immediate migration |
| **High** | ≥ 5.5 | Orange | Plan migration now |
| **Medium** | ≥ 3.5 | Yellow | Monitor & schedule |
| **Low** | < 3.5 | Green | Acceptable |

## 8.4 Priority score (for sorting thousands of artefacts)

```
Priority = Final_risk × Business_criticality × Mosca_urgency × (1 / migration_effort)
```

---

# 9. Mosca's theorem

## 9.1 Scenario presets (configurable)

| Scenario | Z (years) | Rationale |
|----------|-----------|-----------|
| Optimistic | 15 | Conservative planning estimate |
| Baseline | 10 | Industry median; aligns with NIST planning |
| Aggressive | 5 | HNDL-focused; high-sensitivity environments |
| Regulatory | 7 | Near NIST 2030 deprecation milestone |

## 9.2 Risk categories

| Category | Condition | UI badge |
|----------|-----------|----------|
| **EXPIRED** | X + Y > Z (baseline) | Red — "Already late" |
| **URGENT** | X + Y > Z (aggressive only) OR risk ≥ 7.5 | Orange — "Act now" |
| **PLAN** | X + Y ≤ Z but risk ≥ 5.5 | Yellow — "Schedule migration" |
| **MONITOR** | Low risk, adequate window | Green — "Watch" |

## 9.3 UI visualization (teach designers this)

```
Timeline (horizontal bars):

[========== X = 10 years ==========]  ← Data must stay secret
          [==== Y = 4 years ====]       ← Migration time
                                    | Z = 7 yrs
                                    ↑
                              Quantum threshold

X + Y = 14 > Z = 7  →  EXPIRED (red zone)
```

Toggle Z slider: show how category changes from MONITOR → EXPIRED as Z decreases.

---

# 10. PQC & hybrid recommendations

## 10.1 Complete migration mapping

| Legacy | Use case | Primary PQC | Hybrid | Action | Effort |
|--------|----------|-------------|--------|--------|--------|
| RSA-2048/4096 | Key exchange | ML-KEM-768 | X25519MLKEM768 | Hybrid Migration | Medium |
| RSA-2048/4096 | Signatures | ML-DSA-65 | RSA + ML-DSA-65 | Hybrid Migration | High |
| ECDSA P-256/P-384 | Signatures | ML-DSA-65 | ECDSA + ML-DSA-65 | Hybrid Migration | High |
| ECDH / X25519 | Key exchange | ML-KEM-768 | X25519MLKEM768 | Hybrid Migration | Medium |
| DSA | Signatures | ML-DSA-65 | — | Migrate | Medium |
| AES-128 | Encryption | AES-256 | — | Migrate | Low |
| AES-256-GCM | Encryption | Keep | — | **Keep** | None |
| SHA-256 | Hashing | Keep | — | **Keep** | None |
| SHA-1 | Hashing | SHA-256 | — | Immediate | Low |
| MD5 | Hashing | SHA-256 | — | Immediate | Low |
| 3DES | Encryption | AES-256 | — | Immediate | Low |
| TLS 1.0/1.1 | Protocol | TLS 1.3 + hybrid | — | Immediate | Medium |

## 10.2 Recommendation actions

| Action | When | Example |
|--------|------|---------|
| **Keep** | Already quantum-safe | AES-256, SHA-256, ML-KEM |
| **Monitor** | Adequate Mosca window, low exposure | Internal AES-128 with 2-year data |
| **Migrate** | Vulnerable but sufficient timeline | RSA-2048 with Z=15 scenario |
| **Hybrid Migration** | High criticality + near-term Z | TLS cert with 3-year expiry |
| **Immediate Replacement** | X+Y > Z + high exposure | Internet-facing RSA-2048 TLS |

## 10.3 Performance considerations (for judge Q&A)

| Algorithm | Key/signature size | Latency impact | Memory |
|-----------|-------------------|----------------|--------|
| ML-KEM-768 | 1,184 byte pub key | +1.5ms TLS handshake | Moderate |
| ML-DSA-65 | ~1–2 KB signatures | Slower signing | Moderate |
| SLH-DSA | 8–49 KB signatures | Much slower | High |
| X25519MLKEM768 | Combined | +1.5ms vs pure X25519 | Moderate |

---

# 11. Competitive landscape

## 11.1 Existing tools

| Tool | Org | What it does | What it lacks (our opportunity) |
|------|-----|-------------|--------------------------------|
| **CBOMkit-theia** | IBM/PQCA | Container/dir CBOM generation | No risk scoring, no Mosca, no GUI |
| **Sonar Cryptography** | CBOMkit | Source code crypto detection | No container, no risk, no PQC recs |
| **CBOMkit (GitHub)** | IBM/PQCA | Git repo scanning + CBOM | No unified dashboard, no Mosca |
| **AWS CodeQL** | Amazon | Code scanning (NIST SP 1800-38B lab) | Not CBOM-native, no PQC planning |
| **SandboxAQ AQSecure** | SandboxAQ | Enterprise crypto inventory | Commercial, not open source |
| **InfoSec Global** | ISG | Network crypto discovery | Network-only, no code scanning |

## 11.2 ECDAT unique value proposition

```
Existing tools answer:  "WHAT crypto do you have?"
ECDAT also answers:     "HOW RISKY is it?"
                        "WHEN must you act?" (Mosca)
                        "WHAT should you replace it with?" (PQC)
                        "IN WHAT ORDER?" (prioritization)
```

## 11.3 What we can leverage (not reinvent)

| Tool | Use in ECDAT | License |
|------|-------------|---------|
| Semgrep | Source code pattern matching | LGPL |
| Syft (Anchore) | SBOM/dependency discovery | Apache 2.0 |
| Trivy | Container vulnerability/config | Apache 2.0 |
| cbomkit-theia | Container CBOM enrichment | Apache 2.0 |
| CycloneDX Python library | CBOM serialization | Apache 2.0 |

**Strategy:** Wrap proven OSS tools + add our risk/Mosca/PQC layer + GUI. Don't rebuild scanners from scratch.

---

# 12. Presentation & demo strategy

## 12.1 PPT structure (follow SIH format exactly)

| Slide | Title | Content | Time |
|-------|-------|---------|------|
| 1 | Title | Team, PS ID 26164, institution, mentor | 10s |
| 2 | Problem Understanding | Restate NTRO problem; HNDL threat; "no inventory = blind migration" | 30s |
| 3 | Solution Overview | ECDAT one-liner + architecture diagram | 30s |
| 4 | Technical Architecture | Stack + data flow diagram + scanner layers | 45s |
| 5 | Innovation & Novelty | CBOM + risk + Mosca + PQC in one platform; evidence-backed | 30s |
| 6 | Feasibility & Viability | Docker Compose, OSS tools, 25-day build plan | 30s |
| 7 | Impact & Scalability | NIST 2030 deadline; every org needs this; on-prem ready | 30s |
| 8 | Demo screenshots | 4–6 screenshots of working UI | 20s |
| 9 | Roadmap | MVP → binary/container → enterprise scale | 20s |
| 10 | Team & Acknowledgments | Roles, mentor, references | 10s |

**Total: ~4 minutes** (leave time for Q&A)

## 12.2 Live demo script (5 minutes — practice this)

| Time | Action | Say this |
|------|--------|----------|
| 0:00 | Login → Dashboard | "ECDAT gives security teams a single pane for cryptographic inventory" |
| 0:30 | New Scan → Upload zip | "We scan source code, dependencies, configs, and certificates" |
| 1:00 | Progress bar animating | "Scanning runs asynchronously — 47 files analyzed" |
| 1:30 | Overview stats | "Found 47 artefacts: 3 critical, 12 high risk — mostly RSA and SHA-1" |
| 2:00 | Click RSA-2048 finding | "Evidence at CryptoService.java line 42 — Cipher.getInstance RSA/ECB" |
| 2:30 | Risk tab | "HNDL risk score 8.7 — internet-facing RSA protecting 10-year data" |
| 3:00 | Mosca tab, X=10 Y=4, Z=7 | "X plus Y equals 14, greater than Z equals 7 — migration is overdue" |
| 3:30 | Recommendations | "Hybrid migration to X25519MLKEM768 for TLS; ML-DSA-65 for signatures" |
| 4:00 | Dependency graph | "Visual map showing app depends on OpenSSL which provides AES and RSA" |
| 4:30 | Export CBOM JSON | "Standard CycloneDX CBOM — interoperable with industry tooling" |

## 12.3 Demo video requirements (SIH mandatory)

- **NOT AI-generated** video or narration
- Must show **working prototype**
- Narration by **team members only**
- Show: upload → scan → results → export
- Recommended length: 3–5 minutes
- Upload to YouTube/Drive + link in submission

## 12.4 GitHub repository requirements

Must contain:
- [ ] Source code (partial implementation minimum)
- [ ] README with: objective, features, tech stack, setup instructions, status
- [ ] Project documentation
- [ ] Well-structured commits (not one giant commit)
- [ ] `.env.example` (no secrets)
- [ ] `docker-compose.yml` for easy judge evaluation

---

# 13. Judge Q&A

## Technical questions

**Q: How is this different from a regular vulnerability scanner?**  
A: Vulnerability scanners find CVEs. ECDAT finds **cryptographic algorithms and their quantum vulnerability** — a completely different problem. NIST SP 1800-38B identifies crypto discovery as a distinct step before PQC migration. Tools like Trivy don't produce CBOM or assess Mosca timelines.

**Q: How do you detect cryptography in source code?**  
A: Three layers: (1) Semgrep rules matching crypto API patterns across Java/Python/JS/Go, (2) dependency manifest analysis for crypto libraries like OpenSSL and BouncyCastle, (3) certificate and config file parsing. Every finding includes file path, line number, and confidence score.

**Q: Why not use AI/ML?**  
A: Deterministic analysis is more defensible for security decisions. We use rule-based detection with evidence — every finding is explainable and reproducible. AI could assist with report summarization later, but detection must be auditable for NTRO use.

**Q: How accurate is your scanner?**  
A: We report confidence scores (0–1) per finding. High confidence (0.9+) for manifest/dependency matches; medium (0.6–0.9) for Semgrep API patterns; lower for strings-based binary detection. We maintain a test corpus and track precision/recall.

**Q: What about false positives?**  
A: Normalizer deduplicates findings; confidence scores let analysts filter; evidence snippets let humans verify in one click. We skip `node_modules`, `.git`, and vendor directories by default.

**Q: Can this run air-gapped / on-premise?**  
A: Yes. Docker Compose deployment with no mandatory external API calls. All scanning is local. Suitable for NTRO and classified environments.

**Q: What standard does your CBOM follow?**  
A: CycloneDX 1.6+ (ECMA-424), the industry standard for cryptographic bill of materials. IBM Research contributed to this standard. Our output includes `cryptographic-asset` components with `nistQuantumSecurityLevel` fields.

## Mosca / PQC questions

**Q: When will quantum computers break RSA?**  
A: We don't claim to know. That's why Mosca's theorem uses configurable scenarios (Z = 5, 10, 15 years). NIST IR 8547 plans RSA deprecation by 2030 regardless. HNDL means the threat exists **today** for long-lived data.

**Q: Is AES broken by quantum computers?**  
A: No. AES-256 provides 128-bit quantum security (Grover halves effective strength). AES-128 drops to 64-bit — we flag it for long-retention data. Symmetric crypto is not broken by Shor's algorithm.

**Q: Why hybrid instead of pure PQC?**  
A: NIST and IETF (RFC 10024) recommend hybrid during transition. Both classical and PQC must fail for the session to be compromised. Pure PQC-only is available but not recommended for production yet.

**Q: What PQC algorithms do you recommend?**  
A: NIST FIPS 203/204/205: ML-KEM-768 for key exchange, ML-DSA-65 for signatures, SLH-DSA for long-term archive signatures. Specific recommendations depend on the artefact's use case, risk score, and migration constraints.

## Practical questions

**Q: Can this scale to 10,000 repositories?**  
A: Architecture supports horizontal scaling via Celery worker pool and PostgreSQL. MVP demonstrates single-repo flow; production path includes incremental scanning by commit hash and result deduplication.

**Q: How long does a scan take?**  
A: Medium repo (~1000 files): under 5 minutes. We skip junk directories and cache dependency SBOMs by content hash.

**Q: What about encrypted/obfuscated code?**  
A: Honestly — custom and obfuscated crypto is hard to detect with static analysis. We flag low-confidence strings matches and recommend manual review. Runtime analysis is future work.

---

# 14. Submission checklist

## Before internal hackathon

- [ ] Team registered on SIH portal with PS 26164 selected
- [ ] Idea PPT in official SIH 2026 format (10 slides)
- [ ] Idea description written (problem understanding + solution + novelty)
- [ ] Female team member requirement met
- [ ] Faculty/industry mentor identified

## Before grand finale

- [ ] Working prototype (Docker Compose start)
- [ ] Demo video (3–5 min, team-narrated, NOT AI-generated)
- [ ] GitHub repo with README, source, docs, setup instructions
- [ ] CBOM export working (download JSON)
- [ ] At least one end-to-end scan on test corpus
- [ ] PPT updated with screenshots from working prototype
- [ ] Q&A rehearsed (section 13 above)
- [ ] Demo rehearsed 5+ times (section 12.2 script)

## README must include

```markdown
# ECDAT — Enterprise Cryptographic Discovery & Analysis Tool
## SIH 2026 · Problem Statement 26164 · NTRO

### Objective
[One paragraph]

### Features
- [ ] Crypto discovery (source, deps, certs, configs)
- [ ] CycloneDX CBOM export
- [ ] Quantum risk assessment
- [ ] Mosca timeline analysis
- [ ] PQC/hybrid recommendations
- [ ] Interactive dashboard

### Tech Stack
[Table from PRD]

### Setup
docker compose up

### Demo
[Link to demo video]

### Team
[Names and roles]
```

---

# 15. Algorithm reference tables

## 15.1 Quantum vulnerability scores (for risk engine)

| Algorithm | QV Score (0–10) | nistQuantumSecurityLevel | Attack |
|-----------|-----------------|--------------------------|--------|
| RSA (any) | 10 | 0 | Shor |
| ECDH/ECDSA/Ed25519 | 10 | 0 | Shor |
| DH | 10 | 0 | Shor |
| DSA | 10 | 0 | Shor |
| AES-128 | 4 | 1 | Grover |
| AES-256 | 2 | 2 | Grover |
| SHA-1 | 8 | 0 | Grover + classical weak |
| SHA-256 | 3 | 2 | Grover |
| SHA-384/512 | 2 | 3–4 | Grover |
| 3DES | 9 | 0 | Small block |
| DES | 10 | 0 | Broken |
| MD5 | 10 | 0 | Broken |
| RC4 | 10 | 0 | Broken |
| ML-KEM-512 | 0 | 1 | PQC safe |
| ML-KEM-768 | 0 | 3 | PQC safe |
| ML-KEM-1024 | 0 | 5 | PQC safe |
| ML-DSA-44 | 0 | 2 | PQC safe |
| ML-DSA-65 | 0 | 3 | PQC safe |
| ML-DSA-87 | 0 | 5 | PQC safe |
| SLH-DSA | 0 | 1–5 | PQC safe |

## 15.2 Crypto library risk database (sample entries)

| Library | Version | Risk | Notes |
|---------|---------|------|-------|
| OpenSSL | 1.0.2 | CRITICAL | EOL 2019, many CVEs |
| OpenSSL | 1.1.1 | HIGH | EOL 2023 |
| OpenSSL | 3.0.x | LOW | Current, ML-KEM support in 3.5+ |
| OpenSSL | 3.5+ | LOW | Native ML-KEM support |
| BouncyCastle | < 1.70 | HIGH | Old versions lack modern algos |
| pyca/cryptography | any recent | LOW | Well-maintained |
| node-forge | any | MEDIUM | Pure JS, slower, audit carefully |

## 15.3 Insecure patterns to flag (Semgrep rules)

| Pattern | Language | Severity |
|---------|----------|----------|
| `Cipher.getInstance("DES")` | Java | Critical |
| `Cipher.getInstance("RSA/ECB/PKCS1Padding")` | Java | High (no OAEP) |
| `hashlib.md5(` | Python | High |
| `crypto.createCipher('des'` | Node.js | Critical |
| `RSA/ECB/NoPadding` | Any | Critical |
| `TLSv1` or `TLSv1.1` | Config | High |
| `AES/ECB/` | Any | Medium (no IV) |
| Hardcoded password/key string | Any | Critical |
| `KeyGenerator.getInstance("DES")` | Java | Critical |
| `jwt.sign(..., 'HS256')` with weak secret | JS | Medium |

---

# 16. Sources & further reading

## Official standards (cite these in PPT)

| Source | URL | Use for |
|--------|-----|---------|
| CycloneDX CBOM Guide | https://cyclonedx.org/guides/OWASP_CycloneDX-Authoritative-Guide-to-CBOM-en.pdf | CBOM schema |
| CycloneDX Use Cases | https://cyclonedx.org/use-cases/cryptographic-algorithm/ | CBOM examples |
| NIST FIPS 203 (ML-KEM) | https://csrc.nist.gov/publications/detail/fips/203/final | PQC key exchange |
| NIST FIPS 204 (ML-DSA) | https://csrc.nist.gov/publications/detail/fips/204/final | PQC signatures |
| NIST FIPS 205 (SLH-DSA) | https://csrc.nist.gov/publications/detail/fips/205/final | Hash-based sigs |
| NIST IR 8547 | https://csrc.nist.gov/pubs/ir/8547/ipd | Transition timeline |
| NIST SP 1800-38B | https://www.nccoe.nist.gov/projects/migration-post-quantum-cryptography | Discovery architecture |
| NIST PQC Project | https://csrc.nist.gov/projects/post-quantum-cryptography | Overall PQC program |
| RFC 10024 (Hybrid TLS) | https://www.rfc-editor.org/rfc/rfc10024.html | Hybrid key exchange |
| ECMA-424 (CycloneDX) | https://ecma-international.org/publications-and-standards/standards/ecma-424/ | Standard ratification |

## Open source tools (integrate or reference)

| Tool | URL | Purpose |
|------|-----|---------|
| cbomkit-theia | https://github.com/cbomkit/cbomkit-theia | Container CBOM |
| Sonar Cryptography | https://github.com/cbomkit/sonar-cryptography | Source CBOM |
| Semgrep | https://semgrep.dev/ | Pattern matching |
| Syft | https://github.com/anchore/syft | SBOM generation |
| Trivy | https://github.com/aquasecurity/trivy | Container scanning |

## Theory & frameworks

| Source | Topic |
|--------|-------|
| Mosca, "Cybersecurity in an era with quantum computers" (2015) | Original Mosca theorem |
| GSMA Quantum Risk Management Guidelines (2023) | Mosca extensions for telecom |
| IBM CBOM blog | https://research.ibm.com/blog/quantum-safe-cbomkit | CBOM ecosystem |
| PostQuantum.com CBOM deep-dive | CBOM practice guide |

## SIH-specific

| Resource | Purpose |
|----------|---------|
| SIH 2026 PPT format | https://reskilll.com/blogs/sih-2026-ppt-template-exact-format-slides-evaluators-score/ |
| SIH 2026 guidelines | Official portal guidelines PDF |
| Problem statement 26164 | SIH portal — NTRO ECDAT |

---

## Quick teaching plan (3 sessions × 2 hours)

### Session 1 — Theory & Problem (2 hrs)
1. Read §4 (Theory) — Shor, Grover, HNDL, Mosca, PQC standards
2. Read §2 (NTRO compliance) — map every requirement
3. Read §5 (NIST frameworks) — understand discovery-first approach
4. Activity: Quiz — "Is AES-256 quantum safe?" "What does X+Y>Z mean?"

### Session 2 — Architecture & Build (2 hrs)
1. Read [`PRD.md`](PRD.md) §6–9 (Architecture, features, API)
2. Read §6–7 (CBOM requirements, discovery engine)
3. Read §11 (Competitive landscape — know our differentiation)
4. Activity: Draw architecture diagram from memory

### Session 3 — Demo & Presentation (2 hrs)
1. Read §12 (Presentation strategy + demo script)
2. Read §13 (Q&A — pair practice)
3. Read §14 (Submission checklist)
4. Activity: Mock pitch — 5 min demo + 5 min Q&A

---

*This document is the knowledge foundation for winning SIH 26164. Pair it with [`PRD.md`](PRD.md) for implementation and the master engineering plan for file-level build order.*

# ECDAT — Product Requirements Document (PRD)

**Project:** Enterprise Cryptographic Discovery & Analysis Tool  
**Problem Statement ID:** 26164  
**Organization:** National Technical Research Organisation (NTRO)  
**Category:** Software | **Theme:** Blockchain & Cybersecurity  
**Status:** Greenfield — nothing built yet  
**Last updated:** August 2026

**Related docs:**
- [`WINNING_GUIDE.md`](WINNING_GUIDE.md) — Theory, NIST frameworks, judge Q&A, demo script, and how to win SIH
- Master engineering plan — Full file-level implementation roadmap

---

## How to use this document

This PRD is written so you can **teach the entire project** to your team before anyone writes code. Read it top-to-bottom once for the big picture, then use individual sections as teaching modules.

| Section | Use it to teach… |
|---------|------------------|
| §1–2 | Why this project exists and who it’s for |
| §3 | Core concepts (CBOM, quantum risk, Mosca, PQC) |
| §4–5 | What we’re building and what “done” looks like |
| §6 | How the system works (architecture) |
| §7 | Every feature, prioritized |
| §8 | User journeys and screens |
| §9 | Tech stack and repo layout |
| §10 | Build order — what to do, step by step |
| §11 | Demo script for SIH |
| §12 | Risks, open questions, glossary |

---

## 1. Problem we are solving

### 1.1 Background

Organizations worldwide are preparing for **post-quantum cryptography (PQC)**. Quantum computers (when they become powerful enough) will break many algorithms we rely on today — especially **RSA**, **ECDH**, and **ECDSA**.

Before migrating, organizations must answer one question:

> **“Where is cryptography used in our systems, and how risky is each usage?”**

That first step is **cryptographic discovery and inventory**. Without it, PQC migration is guesswork.

### 1.2 What NTRO wants (problem statement summary)

Build a **Cryptographic Bill of Materials (CBOM) analytics platform** that:

1. **Discovers** all cryptographic artefacts across code, binaries, libraries, and containers  
2. **Assesses quantum risk** — which systems are vulnerable to future quantum attacks  
3. **Classifies** artefacts by type, lifetime, and business criticality  
4. **Applies Mosca’s theorem** — compares data lifetime + migration time vs. quantum timeline  
5. **Recommends** PQC or hybrid alternatives based on risk, performance, and cost  
6. **Produces standardized reports** (CBOM format)  
7. **Provides an interactive GUI** to explore scans, risks, and recommendations  

### 1.3 Why this matters (elevator pitch)

> “ECDAT is like a **security X-ray for cryptography**. Point it at your codebase or container, and it tells you every algorithm, key, certificate, and library you’re using — how quantum-vulnerable each one is — and exactly what to replace it with.”

---

## 2. Product vision & goals

### 2.1 Vision

**ECDAT** (Enterprise Cryptographic Discovery & Analysis Tool) becomes the central platform for cryptographic inventory, quantum risk assessment, and PQC migration planning.

### 2.2 Primary goals

| # | Goal | Success metric |
|---|------|----------------|
| G1 | Discover crypto artefacts automatically | ≥90% of known patterns in test corpus detected |
| G2 | Assess quantum risk meaningfully | Every artefact gets a scored, explainable risk rating |
| G3 | Apply Mosca-style timeline analysis | User can configure X, Y, Z and see risk categories |
| G4 | Recommend PQC/hybrid alternatives | Every high-risk legacy algorithm gets an actionable recommendation |
| G5 | Export standard CBOM reports | Valid CycloneDX 1.6+ JSON export |
| G6 | Demo convincingly at SIH | End-to-end flow works live in ≤5 minutes |

### 2.3 Non-goals (for MVP)

- Real-time network TLS scanning  
- Full HSM hardware integration  
- ML/AI-based detection (deterministic rules first)  
- Multi-tenant SaaS at scale  
- Claiming NIST or government certification  

### 2.4 Target users

| Persona | Role | What they need from ECDAT |
|---------|------|---------------------------|
| **Security Analyst** | Runs scans, reviews findings | Inventory table, risk scores, evidence |
| **CISO / Decision maker** | Prioritizes migration | Executive summary, Mosca timeline, PDF report |
| **Developer** | Fixes crypto issues | File:line evidence, specific PQC replacement |
| **Auditor** | Compliance review | Standard CBOM export, provenance, timestamps |

---

## 3. Core concepts (teach this first)

### 3.1 Cryptographic Bill of Materials (CBOM)

A **CBOM** is a structured inventory of all cryptographic assets in a system — similar to how an SBOM lists software components.

**What it includes:**

- Algorithms (RSA, AES, SHA-256, ML-KEM, etc.)
- Keys and certificates
- Protocols (TLS 1.2, SSH, etc.)
- Cryptographic libraries (OpenSSL, BouncyCastle, etc.)
- Relationships (app → uses → library → provides → algorithm)

**Standard we follow:** [CycloneDX CBOM](https://cyclonedx.org/) (ECMA-424), version 1.6+.

### 3.2 Cryptographic artefacts

Anything in a system that involves cryptography:

| Type | Examples |
|------|----------|
| Algorithm | RSA-2048, AES-256-GCM, SHA-1 |
| Certificate | X.509 TLS cert, code-signing cert |
| Key | Hardcoded AES key, RSA private key (PEM) |
| Protocol | TLS 1.0, SSH, IPsec |
| Library | OpenSSL 1.0.2, pyca/cryptography, BouncyCastle |
| Config | nginx SSL ciphers, Java security policy |

### 3.3 Quantum vulnerability

| Algorithm family | Quantum risk | Why |
|------------------|--------------|-----|
| RSA, DH, ECDH, ECDSA | **Critical** | Broken by Shor’s algorithm on a quantum computer |
| AES-128 | **Moderate** | Grover’s algorithm halves effective key strength |
| AES-256 | **Low** | Still 128-bit quantum security — acceptable |
| SHA-256 | **Low–Moderate** | Grover reduces collision resistance |
| SHA-1, MD5, DES, 3DES | **High (classical too)** | Already weak; quantum makes it worse |
| ML-KEM, ML-DSA, SLH-DSA | **None** | NIST PQC standards (FIPS 203/204/205) |

### 3.4 Mosca’s theorem

Dr. Michele Mosca’s framework for **when you must start migrating**:

```
IF (X + Y) > Z  →  YOU ARE ALREADY LATE
```

| Variable | Meaning | Example |
|----------|---------|---------|
| **X** | How long data must stay confidential | 10 years (medical records) |
| **Y** | How long migration will take | 4 years (replace all RSA in PKI) |
| **Z** | Years until a quantum computer breaks current crypto | 7 years (planning estimate) |

**Example:** X=10, Y=4, Z=7 → X+Y=14 > 7 → **urgent action required now**.

**Important:** Z is **not known with certainty**. We show **scenarios** (optimistic Z=15, baseline Z=10, aggressive Z=5), not a single prediction.

### 3.5 Post-Quantum Cryptography (PQC)

NIST finalized three PQC standards in August 2024:

| Standard | Algorithm | Replaces |
|----------|-----------|----------|
| FIPS 203 | **ML-KEM** (was CRYSTALS-Kyber) | RSA/ECDH key exchange |
| FIPS 204 | **ML-DSA** (was CRYSTALS-Dilithium) | RSA/ECDSA signatures |
| FIPS 205 | **SLH-DSA** (was SPHINCS+) | Long-term hash-based signatures |

**Hybrid approach:** During migration, combine classical + PQC (e.g., X25519 + ML-KEM-768 in TLS) so both must be broken.

### 3.6 Harvest Now, Decrypt Later (HNDL)

Attackers can **record encrypted traffic today** and decrypt it later when quantum computers exist. This makes long-lived RSA/ECDH usage especially dangerous for sensitive, long-retention data — even if the quantum computer is years away.

---

## 4. What we are building

### 4.1 Product summary

ECDAT is a **web platform** with:

1. **Scanner** — analyzes source code, dependencies, configs, binaries, containers  
2. **Analysis engines** — risk scoring, Mosca analysis, PQC recommendations  
3. **Dashboard** — interactive UI to explore everything  
4. **Reporting** — CycloneDX CBOM JSON + PDF executive summary  

### 4.2 Current state

```
Repository: EMPTY (only .git exists, 0 commits)
Everything: TO BE BUILT FROM SCRATCH
```

### 4.3 MVP scope (must work for demo)

```
Upload a code archive
        ↓
Scan runs (async, with progress bar)
        ↓
Crypto artefacts discovered (algorithms, certs, libraries)
        ↓
Risk scores calculated (Critical / High / Medium / Low)
        ↓
Mosca timeline shown (with scenario slider)
        ↓
PQC recommendations generated (RSA → ML-KEM, etc.)
        ↓
Interactive dashboard to explore findings
        ↓
Export CycloneDX CBOM JSON + PDF report
```

### 4.4 Full scope (post-MVP)

- Git URL scanning (with SSRF protection)  
- Binary analysis (strings, YARA, import tables)  
- Container image scanning (Syft + Trivy)  
- Dependency graph visualization  
- RBAC (admin / analyst / viewer)  
- Incremental/rescan by commit hash  

---

## 5. Requirements

### 5.1 Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | User can upload a source archive (zip/tar) for scanning | P0 |
| FR-02 | System discovers cryptographic algorithms in source code | P0 |
| FR-03 | System discovers crypto libraries from dependency manifests | P0 |
| FR-04 | System parses X.509 certificates and TLS configs | P0 |
| FR-05 | System normalizes all findings into a unified artefact model | P0 |
| FR-06 | System generates CycloneDX 1.6+ CBOM JSON | P0 |
| FR-07 | System calculates quantum risk score per artefact | P0 |
| FR-08 | User can set business context (sensitivity, lifetime, criticality) | P0 |
| FR-09 | System runs Mosca analysis with configurable X, Y, Z scenarios | P0 |
| FR-10 | System recommends PQC/hybrid replacements per artefact | P0 |
| FR-11 | Dashboard shows inventory, risk, Mosca, recommendations | P0 |
| FR-12 | User can export CBOM JSON and PDF report | P0 |
| FR-13 | Scan runs asynchronously with real-time progress | P0 |
| FR-14 | User can authenticate (login) | P0 |
| FR-15 | System scans binary files (strings/YARA) | P1 |
| FR-16 | System scans Docker container images | P1 |
| FR-17 | Dependency graph visualization | P1 |
| FR-18 | Git repository URL scanning | P1 |
| FR-19 | Role-based access control | P1 |
| FR-20 | HSM / cloud crypto service detection in IaC | P2 |

### 5.2 Non-functional requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Scan a medium repo (~1000 files) in | < 5 minutes |
| NFR-02 | API response time (non-scan) | < 500ms |
| NFR-03 | Scanner runs in isolated container | Mandatory |
| NFR-04 | No customer code sent to external APIs | Default off |
| NFR-05 | Evidence includes file path + line number | Where applicable |
| NFR-06 | Every finding has a confidence score (0–1) | Mandatory |
| NFR-07 | System runs via Docker Compose | One command start |

---

## 6. System architecture

### 6.1 High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND — Next.js Dashboard                 │
│   Login │ Scan Wizard │ Inventory │ Risk │ Mosca │ Reports  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API + WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                 BACKEND — FastAPI (Python)                   │
│        Auth │ Scans │ Artefacts │ Risk │ Reports             │
└──────┬───────────────────────────────┬──────────────────────┘
       │                               │
       ▼                               ▼
┌──────────────┐              ┌─────────────────────┐
│  PostgreSQL  │              │  Redis + Celery      │
│  (all data)  │              │  Scanner Workers     │
└──────────────┘              └──────────┬───────────┘
                                         │
              ┌──────────────────────────┼──────────────────┐
              ▼                          ▼                  ▼
        Semgrep Rules            Syft (SBOM)          Cert/Config
        Language Detectors       Dependency DB         Parsers
              └──────────────────────────┬──────────────────┘
                                         ▼
                              Normalizer → CBOM Builder
                                         ▼
                            Risk → Mosca → PQC Engines
                                         ▼
                              MinIO (files & exports)
```

### 6.2 Data flow (one scan)

```
1. INGEST    User uploads zip → stored in MinIO
2. EXTRACT   Unzip → enumerate files (skip node_modules, .git)
3. DETECT    Run detectors in parallel:
               - Semgrep (source patterns)
               - Manifest parsers (package.json, requirements.txt, etc.)
               - Certificate parser (PEM files)
               - Config parser (nginx, java.security)
               - Syft (dependency SBOM)
4. NORMALIZE Merge findings → deduplicate → assign confidence
5. PERSIST   Save artefacts to PostgreSQL
6. ANALYZE   Risk engine → Mosca engine → PQC engine
7. CBOM      Build CycloneDX JSON
8. REPORT    Generate PDF + store exports in MinIO
9. NOTIFY    WebSocket pushes progress/completion to frontend
```

### 6.3 Tech stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui | Modern, fast to build, good for dashboards |
| Backend | Python 3.12, FastAPI | Best crypto/security library ecosystem |
| Task queue | Celery + Redis | Long scans must be async |
| Database | PostgreSQL 16 | Structured relational data |
| File storage | MinIO | S3-compatible, works on-prem |
| Scanning | Semgrep, Syft, Trivy (CLI wrappers) | Industry-proven, don’t reinvent |
| Charts | Recharts | Risk visualizations |
| Graphs | React Flow | Dependency graph |
| Containers | Docker Compose | Portable demo + deployment |
| CBOM format | CycloneDX 1.6+ | Industry standard |

### 6.4 Repository structure (to be created)

```
ecdat/
├── README.md
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry
│   │   ├── api/v1/              # REST routes
│   │   ├── models/              # Database models
│   │   ├── schemas/             # Pydantic request/response
│   │   ├── services/            # Business logic
│   │   ├── engines/             # Risk, Mosca, PQC
│   │   ├── cbom/                # CycloneDX builder
│   │   └── workers/             # Celery tasks
│   └── tests/
├── scanner/
│   ├── detectors/               # Per-language detectors
│   ├── rules/semgrep/           # Semgrep crypto rules
│   ├── data/                    # Algorithm & library DBs
│   └── corpus/                  # Test fixtures
├── frontend/
│   └── src/app/                 # Next.js pages
├── infra/docker/                # Dockerfiles
└── docs/
    ├── PRD.md                   # This file
    ├── architecture.md
    └── demo-script.md
```

---

## 7. Features (detailed)

### 7.1 Scan management

**What:** User creates a scan, uploads a target, watches progress, views results.

| Feature | Description |
|---------|-------------|
| Create scan | Name + target type (upload / git / binary / container) |
| Upload file | Zip/tar archive up to 500MB |
| Scan progress | Real-time WebSocket progress bar |
| Scan history | List all past scans with status and summary stats |
| Cancel scan | Stop a running scan |

### 7.2 Cryptographic discovery

**What:** Find every crypto artefact in the target.

| Detector | Input | Finds |
|----------|-------|-------|
| Source (Semgrep) | .java, .py, .js, .go, .rs, .c | Algorithm API calls, cipher modes, key sizes |
| Dependency (Syft) | Manifests, lockfiles | OpenSSL, BouncyCastle, pyca, etc. |
| Certificate | .pem, .crt, .cer files | X.509 certs, expiry, signature algorithm |
| Config | nginx.conf, java.security | TLS versions, cipher suites |
| Binary (P1) | .exe, .so, .dll | OpenSSL strings, crypto constants |
| Container (P1) | Docker image tar | Installed packages, layer configs |

**Every finding includes:**
- What was found (algorithm, library, cert, etc.)
- Where (file path, line number)
- How (detection method: semgrep, regex, syft, etc.)
- Confidence (0.0 – 1.0)
- Evidence snippet (redacted if sensitive)

### 7.3 Quantum risk engine

**What:** Score every artefact for quantum-related risk.

**Inputs:**
- Algorithm type and key size  
- Data sensitivity (user-configured, 1–10)  
- Data lifetime in years (X)  
- Business criticality (1–10)  
- Internet exposure (1–10)  
- Detection confidence  

**Outputs:**
- `hndl_risk` — Harvest Now, Decrypt Later score  
- `operational_risk` — Overall operational impact  
- `final_risk_score` — Combined score (0–10)  
- `risk_band` — Critical / High / Medium / Low  

**Risk bands:**

| Band | Score | Meaning |
|------|-------|---------|
| Critical | ≥ 7.5 | Migrate immediately |
| High | ≥ 5.5 | Plan migration now |
| Medium | ≥ 3.5 | Monitor and schedule |
| Low | < 3.5 | Acceptable for now |

### 7.4 Mosca analysis

**What:** Timeline-based urgency assessment.

**User inputs:**
- X = data confidentiality lifetime (years)  
- Y = estimated migration time (years)  

**System provides scenarios for Z:**
- Optimistic: Z = 15 years  
- Baseline: Z = 10 years  
- Aggressive: Z = 5 years  

**Outputs per scenario:**
- `mosca_margin` = Z − (X + Y)  
- Category: EXPIRED / URGENT / PLAN / MONITOR  

**UI:** Horizontal timeline bars for X, Y, and Z threshold — with scenario toggle.

### 7.5 PQC recommendation engine

**What:** Tell users what to replace and how.

| Legacy | Recommended PQC | Hybrid (transition) | Action |
|--------|-----------------|---------------------|--------|
| RSA key exchange | ML-KEM-768 | X25519 + ML-KEM-768 | Migrate / Hybrid |
| ECDSA signatures | ML-DSA-65 | ECDSA + ML-DSA-65 | Hybrid Migration |
| RSA signatures | ML-DSA-65 | RSA + ML-DSA-65 | Hybrid Migration |
| Long-term archive sig | SLH-DSA | SLH-DSA alone | Migrate |
| AES-256-GCM | Keep | — | Keep |
| SHA-256 | Keep | — | Keep |
| SHA-1 / MD5 / DES | SHA-256 / AES-256 | — | Immediate Replacement |

**Each recommendation includes:**
- Action (Keep / Monitor / Migrate / Hybrid / Immediate)  
- Primary PQC algorithm  
- Hybrid pairing (if applicable)  
- Rationale (human-readable bullets)  
- Estimated migration effort (Low / Medium / High / Very High)  
- Performance impact note  

### 7.6 CBOM export

**What:** Standard machine-readable cryptographic inventory.

- Format: CycloneDX JSON 1.6+  
- Component type: `cryptographic-asset`  
- Includes: algorithms, certificates, protocols, libraries  
- Relationships: `dependsOn`, `provides`, `uses`  
- Custom properties: source path, line number, confidence, detection method  

### 7.7 Dashboard & reporting

**What:** Interactive web UI + downloadable reports.

| Screen | Purpose |
|--------|---------|
| Dashboard | Org-wide KPIs: total scans, critical findings, risk trend |
| New Scan | Wizard: choose type → upload → configure → start |
| Scan Overview | Progress, summary stats, risk heatmap |
| Inventory | Searchable/filterable table of all artefacts |
| Artefact Detail | Evidence, cert info, risk breakdown, recommendation |
| Risk Analysis | Charts: risk distribution, HNDL vs operational |
| Mosca Timeline | X/Y/Z visualization with scenario toggle |
| Recommendations | Prioritized action list with effort estimates |
| Dependency Graph | Visual map: app → library → algorithm |
| Reports | Generate and download CBOM JSON + PDF |

---

## 8. User journeys

### 8.1 Primary journey (demo flow)

```
Login
  ↓
Dashboard (see past scans or empty state)
  ↓
"New Scan" → Upload sample-vulnerable-repo.zip
  ↓
Scan runs (progress bar, ~30–60 seconds)
  ↓
Scan Overview: "47 artefacts, 12 high risk, 3 critical"
  ↓
Inventory tab → filter by "Critical" → click RSA-2048 finding
  ↓
Artefact Detail: file path, line 42, evidence snippet, risk factors
  ↓
Mosca tab → set X=10, Y=4 → toggle Z scenario → see "EXPIRED" badge
  ↓
Recommendations tab → "Immediate Replacement: RSA-2048 → ML-KEM-768"
  ↓
Reports tab → Download CycloneDX CBOM JSON + PDF
```

### 8.2 CISO journey

```
Login → Dashboard (high-level risk KPIs)
  ↓
Open latest scan → Mosca tab → review timeline scenarios
  ↓
Recommendations tab → sort by priority → export PDF for board
```

### 8.3 Developer journey

```
Login → Open scan → Inventory → filter by their service
  ↓
Click finding → see exact file:line → read PQC recommendation
  ↓
Export CBOM JSON for CI/CD integration
```

---

## 9. API overview (for backend team)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/login` | Get JWT token |
| POST | `/api/v1/scans` | Create new scan |
| GET | `/api/v1/scans` | List scans |
| GET | `/api/v1/scans/{id}` | Scan detail + status |
| WS | `/api/v1/scans/{id}/progress` | Real-time progress |
| GET | `/api/v1/scans/{id}/artefacts` | List findings (filterable) |
| GET | `/api/v1/scans/{id}/artefacts/{aid}` | Single finding + evidence |
| GET | `/api/v1/scans/{id}/summary` | Dashboard metrics |
| GET | `/api/v1/scans/{id}/risk` | Risk breakdown |
| GET | `/api/v1/scans/{id}/mosca` | Mosca analysis |
| GET | `/api/v1/scans/{id}/recommendations` | PQC recommendations |
| PUT | `/api/v1/scans/{id}/context` | Set X, Y, sensitivity, etc. |
| POST | `/api/v1/scans/{id}/reports` | Generate CBOM/PDF |
| GET | `/api/v1/reports/{id}` | Download report |

---

## 10. Build plan — what to do, in order

### Phase 1: Foundation (Days 1–3)

**Goal:** Empty repo → running services with health check and login.

| Step | Task | Owner hint |
|------|------|------------|
| 1 | Create folder structure + README + .gitignore | Full team |
| 2 | Write docker-compose.yml (PG, Redis, MinIO, API, worker) | DevOps / Backend |
| 3 | FastAPI skeleton + `/health` endpoint | Backend |
| 4 | Database models + Alembic migrations | Backend |
| 5 | JWT auth (login endpoint) | Backend |
| 6 | Next.js skeleton + login page | Frontend |

**Done when:** `docker compose up` starts everything; login returns a token.

---

### Phase 2: Scan orchestration (Days 3–5)

**Goal:** User can upload a file and a background job processes it.

| Step | Task | Owner hint |
|------|------|------------|
| 7 | Scan CRUD API (create, list, get, delete) | Backend |
| 8 | File upload → MinIO storage | Backend |
| 9 | Celery worker + Redis queue | Backend |
| 10 | WebSocket progress events | Backend |
| 11 | File extraction + ignore rules | Backend |

**Done when:** Upload zip → scan status goes queued → running → completed.

---

### Phase 3: Discovery engine (Days 5–10)

**Goal:** Scanner finds real crypto artefacts in code.

| Step | Task | Owner hint |
|------|------|------------|
| 12 | CryptoFinding internal schema | Backend |
| 13 | Semgrep crypto rules (RSA, AES, EC, SHA, TLS) | Security / Backend |
| 14 | Python detector | Backend |
| 15 | JavaScript/TypeScript detector | Backend |
| 16 | Java detector | Backend |
| 17 | Go + Rust detectors (basic) | Backend |
| 18 | Certificate + config parser | Backend |
| 19 | Dependency detector (Syft wrapper) | Backend |
| 20 | Crypto library knowledge base (JSON) | Security |
| 21 | Normalizer (merge + dedup + confidence) | Backend |
| 22 | Persist artefacts to PostgreSQL | Backend |

**Done when:** Scanning test corpus finds RSA, AES, SHA, OpenSSL, certs.

---

### Phase 4: CBOM (Days 10–12)

**Goal:** Export valid CycloneDX CBOM JSON.

| Step | Task | Owner hint |
|------|------|------------|
| 23 | CycloneDX CBOM builder | Backend |
| 24 | CBOM schema validator | Backend |
| 25 | CBOM export API endpoint | Backend |

**Done when:** Downloaded JSON validates against CycloneDX 1.6 schema.

---

### Phase 5: Analysis engines (Days 12–15)

**Goal:** Risk scores, Mosca analysis, and PQC recommendations.

| Step | Task | Owner hint |
|------|------|------------|
| 26 | Algorithm taxonomy JSON (quantum vuln scores) | Security |
| 27 | Quantum risk engine | Backend |
| 28 | Business context API (X, Y, sensitivity) | Backend |
| 29 | Mosca engine (3 scenarios) | Backend |
| 30 | PQC mapping JSON + recommendation engine | Security / Backend |
| 31 | Prioritizer (sort recommendations) | Backend |

**Done when:** Every artefact has risk score + recommendation; Mosca categories computed.

---

### Phase 6: Dashboard (Days 15–20)

**Goal:** Full interactive UI for demo.

| Step | Task | Owner hint |
|------|------|------------|
| 32 | Dashboard overview page | Frontend |
| 33 | Scan creation wizard | Frontend |
| 34 | Scan list + detail page with tabs | Frontend |
| 35 | Scan progress (WebSocket) | Frontend |
| 36 | Inventory table with filters | Frontend |
| 37 | Artefact detail drawer | Frontend |
| 38 | Risk charts | Frontend |
| 39 | Mosca timeline visualization | Frontend |
| 40 | Recommendations table | Frontend |
| 41 | Report download UI | Frontend |

**Done when:** Full demo journey works in browser without touching API directly.

---

### Phase 7: Binary + container (Days 20–22, P1)

| Step | Task | Owner hint |
|------|------|------------|
| 42 | Binary strings/YARA detector | Backend |
| 43 | Container Syft/Trivy detector | Backend |
| 44 | Dependency graph (React Flow) | Frontend |

---

### Phase 8: Hardening + demo prep (Days 22–25)

| Step | Task | Owner hint |
|------|------|------------|
| 45 | Scanner worker sandbox (resource limits, no egress) | DevOps |
| 46 | Test corpus (8+ scenarios) + automated tests | Full team |
| 47 | PDF report generator | Backend |
| 48 | CI pipeline (GitHub Actions) | DevOps |
| 49 | Demo script + rehearsal | Full team |

---

## 11. Demo strategy (SIH)

### Must work live

1. Upload prepared vulnerable repo  
2. Real-time scan progress  
3. Inventory with RSA, AES, SHA, TLS, OpenSSL findings  
4. Risk badges (Critical / High)  
5. Mosca timeline with scenario slider  
6. PQC recommendations (RSA → ML-KEM, ECDSA → ML-DSA)  
7. CycloneDX CBOM download  
8. PDF executive summary  

### Impressive differentiators

- Evidence drill-down (file:line snippets)  
- Dependency graph visualization  
- Hybrid migration recommendations with rationale  
- Multi-scenario Mosca (not a single timeline)  

### Do NOT demo (not MVP)

- GitHub OAuth  
- Real-time network scanning  
- ML/AI features  
- 10,000 repo batch scanning  

### Demo script (5 minutes)

| Time | Action | What judges see |
|------|--------|-----------------|
| 0:00 | Login → Dashboard | Clean UI |
| 0:30 | New Scan → Upload `java-rsa-aes.zip` | Simple workflow |
| 1:00 | Watch progress bar | Real scanning, not fake |
| 1:30 | Overview: "47 artefacts, 12 high, 3 critical" | Immediate value |
| 2:00 | Click RSA-2048 → evidence at file:line | Credibility |
| 2:30 | Mosca tab → X=10, Y=4, Z=7 → "EXPIRED" | Framework knowledge |
| 3:30 | Recommendations → "Replace with ML-KEM-768" | Actionable output |
| 4:00 | Dependency graph | Visual wow factor |
| 4:30 | Export CBOM JSON + PDF | Standards compliance |

---

## 12. Team roles (suggested)

| Role | Responsibilities | Primary phases |
|------|------------------|----------------|
| **Backend lead** | FastAPI, DB, Celery, API design | 1, 2, 4, 5 |
| **Scanner engineer** | Detectors, Semgrep rules, Syft integration | 3, 7 |
| **Security analyst** | Algorithm taxonomy, risk model, PQC mappings, test corpus | 3, 5, 8 |
| **Frontend lead** | Next.js dashboard, all screens, charts | 1, 6 |
| **DevOps** | Docker, CI, worker sandbox | 1, 8 |
| **Demo lead** | Demo script, sample data, presentation | 8, 11 |

---

## 13. Security requirements

The scanner processes **untrusted input** — treat every upload as potentially malicious.

| Threat | Mitigation |
|--------|------------|
| Malicious binary | Scan in isolated Docker worker; CPU/memory/time limits |
| Path traversal in zip | Validate extracted paths; reject `../` and symlinks |
| SSRF via git URL | Allowlist https; block internal IPs |
| Command injection | No `shell=True`; parameterized subprocess only |
| Secrets in findings | Redact private keys in evidence; store hashes |
| Data leakage | Org-scoped DB queries; no external API calls by default |

---

## 14. Testing strategy

### Test corpus (create in `scanner/corpus/`)

| Fixture | What it tests |
|---------|---------------|
| `java-rsa-aes/` | JCE RSA-2048, AES-CBC, BouncyCastle |
| `python-crypto/` | pyca, weak MD5, TLS |
| `nodejs-jwt/` | jsonwebtoken RS256 |
| `go-tls/` | crypto/tls usage |
| `openssl-certs/` | RSA + EC certs, expiring cert |
| `weak-configs/` | TLS 1.0 nginx config |
| `pqc-modern/` | ML-KEM reference code |
| `obfuscated/` | Base64-encoded key material |

### Test types

| Type | What it validates |
|------|-----------------|
| Unit tests | Risk engine, Mosca calc, PQC mapper, CBOM builder |
| Integration tests | Upload → scan → DB → API response |
| Scanner accuracy | Expected findings per corpus fixture |
| E2E (Playwright) | Full UI flow: login → scan → view results |
| Security tests | Path traversal upload, oversized file rejection |

---

## 15. Priority matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Source code scanner | 10 | 7 | **P0** |
| Dependency scanner | 9 | 5 | **P0** |
| CycloneDX CBOM export | 10 | 5 | **P0** |
| Quantum risk engine | 10 | 6 | **P0** |
| Mosca analysis | 9 | 4 | **P0** |
| PQC recommendations | 10 | 5 | **P0** |
| Dashboard + inventory | 9 | 8 | **P0** |
| Async scan orchestration | 9 | 6 | **P0** |
| PDF report | 7 | 4 | **P0** |
| Certificate parsing | 8 | 4 | **P0** |
| Binary scanner | 6 | 6 | **P1** |
| Container scanner | 7 | 6 | **P1** |
| Dependency graph | 6 | 5 | **P1** |
| Git URL scanning | 6 | 5 | **P1** |
| HSM/cloud detection | 4 | 7 | **P2** |
| AI/LLM summaries | 3 | 4 | **P2** |

---

## 16. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Too many false positives | Confidence scores + dedup + clean-repo baseline test |
| Scan too slow for live demo | Pre-warmed corpus; skip node_modules; cache Syft output |
| Mosca timeline looks arbitrary | Show scenario ranges; cite Mosca/GSMA; never claim certainty |
| Malicious upload compromises worker | Isolated container; no network egress; timeouts |
| Scope creep (AI, network scanning) | Strict P0 gate; defer P2/P3 explicitly |
| CycloneDX validation fails | Use official JSON schema in CI |

---

## 17. Open decisions

| # | Question | Recommended default |
|---|----------|---------------------|
| 1 | Deployment target | Docker Compose (works everywhere) |
| 2 | Git scanning in demo | Upload-only for MVP |
| 3 | Default Z scenario | Baseline Z = 10 years |
| 4 | Auth for demo | Single admin user |
| 5 | External CVE lookups | Off by default (air-gap safe) |

---

## 18. Glossary

| Term | Definition |
|------|------------|
| **CBOM** | Cryptographic Bill of Materials — inventory of all crypto assets |
| **SBOM** | Software Bill of Materials — inventory of software components |
| **PQC** | Post-Quantum Cryptography — algorithms safe against quantum attacks |
| **CRQC** | Cryptographically Relevant Quantum Computer |
| **HNDL** | Harvest Now, Decrypt Later — steal ciphertext today, decrypt later |
| **ML-KEM** | Module-Lattice Key Encapsulation (FIPS 203) — replaces RSA/ECDH |
| **ML-DSA** | Module-Lattice Digital Signature (FIPS 204) — replaces RSA/ECDSA |
| **SLH-DSA** | Stateless Hash-Based Signature (FIPS 205) — conservative signatures |
| **Hybrid crypto** | Classical + PQC combined — both must be broken |
| **Semgrep** | Open-source static analysis tool — pattern matching on source code |
| **Syft** | SBOM generator — discovers packages in containers and filesystems |
| **CycloneDX** | OWASP BOM standard (ECMA-424) — includes native CBOM support |
| **Mosca’s theorem** | X + Y > Z framework for PQC migration urgency |
| **Artefact** | Any discovered cryptographic asset (algorithm, cert, key, library, etc.) |

---

## 19. References

- [CycloneDX CBOM Authoritative Guide](https://cyclonedx.org/guides/OWASP_CycloneDX-Authoritative-Guide-to-CBOM-en.pdf)
- [NIST FIPS 203 — ML-KEM](https://csrc.nist.gov/publications/detail/fips/203/final)
- [NIST FIPS 204 — ML-DSA](https://csrc.nist.gov/publications/detail/fips/204/final)
- [NIST FIPS 205 — SLH-DSA](https://csrc.nist.gov/publications/detail/fips/205/final)
- [NIST Post-Quantum Cryptography Project](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Mosca’s Theorem — PostQuantum.com](https://postquantum.com/post-quantum/moscas-theorem/)
- [Semgrep](https://semgrep.dev/)
- [Syft (Anchore)](https://github.com/anchore/syft)

---

## 20. Quick reference — BUILD ORDER

For the implementation team, build in this exact order:

1. Repo skeleton + Docker Compose + FastAPI health check  
2. Database models + migrations + JWT auth  
3. Next.js login page  
4. Scan CRUD API + file upload to MinIO  
5. Celery worker + WebSocket progress  
6. File extraction with ignore rules  
7. Semgrep crypto rules  
8. Language detectors (Python, JS, Java, Go, Rust)  
9. Certificate + config parser  
10. Dependency detector (Syft) + crypto library DB  
11. Normalizer + persist artefacts  
12. CycloneDX CBOM builder + export API  
13. Quantum risk engine  
14. Business context API  
15. Mosca engine  
16. PQC recommendation engine + prioritizer  
17. Dashboard overview + scan wizard  
18. Scan detail page with all tabs  
19. Inventory table + artefact detail  
20. Risk charts + Mosca timeline + recommendations  
21. Report download UI  
22. Test corpus + automated tests  
23. Binary + container detectors (P1)  
24. PDF report + CI + demo rehearsal  

---

*This PRD is the teaching and planning document for ECDAT. The detailed engineering plan with API schemas, data models, and file-level changes lives in the master plan. Start here, then implement following the build order above.*

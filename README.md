# ECDAT — Enterprise Cryptographic Discovery & Analysis Tool

[![SIH 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in/)
[![Problem Statement ID](https://img.shields.io/badge/PS%20ID-26164-orange.svg)](https://sih.gov.in/)
[![Organization](https://img.shields.io/badge/Organization-NTRO-green.svg)](https://ntro.gov.in/)
[![CBOM Standard](https://img.shields.io/badge/CBOM-CycloneDX%201.6%2B%20(ECMA--424)-purple.svg)](https://cyclonedx.org/)
[![NIST Alignment](https://img.shields.io/badge/NIST-SP%201800--38B%20%7C%20IR%208547-red.svg)](https://csrc.nist.gov/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

> **"ECDAT is a security X-ray for enterprise cryptography. Point it at your codebases, dependencies, certificates, binaries, or container images, and it discovers every algorithm, key, certificate, and library — computes quantum vulnerability and Mosca timelines — and recommends exact Post-Quantum Cryptography (PQC) and hybrid replacements."**

---

## 📄 Executive Summary & Problem Context

Organizations worldwide face an unprecedented cybersecurity transition: **Post-Quantum Cryptography (PQC)** migration. Quantum computers running **Shor’s algorithm** will break foundational public-key cryptosystems—including **RSA**, **ECDH**, **ECDSA**, and **DSA**—putting enterprise PKIs, encrypted data, and authentication mechanisms at risk.

Furthermore, under the **Harvest Now, Decrypt Later (HNDL)** threat model, adversarial state actors are actively capturing encrypted network traffic and long-retention sensitive data today, intending to decrypt it retroactively once a Cryptographically Relevant Quantum Computer (CRQC) becomes operational.

Before any organization can migrate to PQC, it must answer the critical question:
> **“Where is cryptography deployed across our repositories, binaries, and infrastructure—and what is the exact quantum risk profile of each asset?”**

**ECDAT** (Enterprise Cryptographic Discovery & Analysis Tool) solves this problem for **National Technical Research Organisation (NTRO)** by automating multi-layer cryptographic discovery, generating standardized **CycloneDX 1.6+ Cryptographic Bill of Materials (CBOM)** JSON files, quantifying **quantum risk scores**, analyzing migration urgency using **Mosca’s Theorem ($X + Y > Z$)**, and producing actionable, prioritized **PQC and hybrid migration plans**.

---

## ✨ Key Features & Capabilities

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ECDAT PLATFORM                                       │
├───────────────────┬───────────────────┬───────────────────┬────────────────────────────┤
│ 🔍 Multi-Layer    │ 📊 Composite      │ ⏳ Mosca’s        │ 🛡️ PQC & Hybrid             │
│    Discovery      │    Quantum Risk   │    Theorem        │    Recommendations         │
│  - Source Code    │  - HNDL Scoring   │  - X+Y > Z Math   │  - NIST FIPS 203 (ML-KEM)  │
│  - Dependencies   │  - Operational    │  - Scenario       │  - NIST FIPS 204 (ML-DSA)  │
│  - Certificates   │    Risk Index     │    Sliders        │  - NIST FIPS 205 (SLH-DSA) │
│  - TLS Configs    │  - Prioritized    │  - Expiry Margin  │  - Dual-Algo Hybrid        │
│  - Binaries       │    Bands (0-10)   │    Categorization │    Pairings (RFC 10024)    │
│  - Containers     │                   │                   │                            │
├───────────────────┴───────────────────┴───────────────────┴────────────────────────────┤
│ 📋 Standardized CBOM Export (CycloneDX 1.6+ ECMA-424) + PDF Executive Summary Reports  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. 🔍 Multi-Layer Discovery Engine
- **Source Code Scanner**: Uses Semgrep pattern rules to detect cryptographic API calls, hardcoded keys, weak cipher modes (e.g. `RSA/ECB`, `DES`), and hash primitives across Java, Python, JavaScript/TypeScript, Go, Rust, and C/C++.
- **Dependency & Manifest Analyzer**: Wraps Syft to parse package manifests (`pom.xml`, `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`) and identify legacy/vulnerable crypto libraries (OpenSSL <3.0, BouncyCastle, pyca/cryptography).
- **Certificate & Key Parser**: Extracts metadata from X.509 PEM/DER certificates (`.pem`, `.crt`), evaluating key size, signature algorithm, issuer hierarchy, and expiration timestamps.
- **Protocol & Configuration Scanner**: Analyzes web server and application security configurations (`nginx.conf`, `apache2.conf`, `java.security`, `openssl.cnf`) for deprecated TLS versions (TLS 1.0/1.1) and weak cipher suites.
- **Binary & Container Inspection**: Performs strings extraction, LIEF ELF/PE import table analysis, YARA fingerprinting, and Syft container layer inspection to discover compiled cryptographic assets.

### 2. 📊 Composite Quantum Risk Engine
Calculates defensible, explainable risk scores ($0.0 - 10.0$) combining:
- **HNDL Risk Score**: Evaluates data confidentiality lifetime ($X$), business sensitivity, exposure level (internet-facing vs. internal), and algorithm quantum vulnerability.
- **Operational Risk Index**: Combines classical algorithm weakness (e.g. SHA-1, MD5, DES), key length degradation, and business criticality with migration complexity.
- **Risk Classification Bands**: Categorizes every asset into **Critical (≥7.5)**, **High (≥5.5)**, **Medium (≥3.5)**, or **Low (<3.5)**.

### 3. ⏳ Mosca’s Theorem Urgency Analyzer
Implements Dr. Michele Mosca’s framework ($X + Y > Z$) to determine migration deadlines:
- **$X$ (Shelf Life)**: How long data must remain confidential (user-configured).
- **$Y$ (Migration Time)**: Estimated years to migrate infrastructure and applications.
- **$Z$ (Collapse Time)**: Years until CRQC availability.
- **Interactive Scenarios**: Allows toggle between **Optimistic ($Z=15$)**, **Baseline ($Z=10$)**, **Aggressive ($Z=5$)**, and **Regulatory ($Z=7$, NIST 2030)** timelines.
- **Urgency Badges**: Automatically flags assets as **EXPIRED** (already late), **URGENT**, **PLAN**, or **MONITOR**.

### 4. 🛡️ PQC & Hybrid Migration Engine
Generates explicit replacement recommendations aligned with finalized **NIST August 2024 PQC Standards**:
- **Key Exchange**: Migrate RSA/ECDH $\rightarrow$ **ML-KEM-768 (FIPS 203)** or **X25519MLKEM768 (RFC 10024)** hybrid.
- **Digital Signatures**: Migrate RSA/ECDSA $\rightarrow$ **ML-DSA-65 (FIPS 204)** or dual-signature hybrid.
- **Long-Term Archival**: Migrate to **SLH-DSA (FIPS 205)**.
- **Symmetric Encryption**: Upgrade AES-128 $\rightarrow$ **AES-256-GCM** (retains 128-bit security under Grover's algorithm).
- **Insecure Primitives**: Flag SHA-1, MD5, DES, 3DES for **Immediate Replacement**.

### 5. 📋 CycloneDX 1.6+ CBOM & PDF Reporting
- Exports valid **CycloneDX 1.6+ JSON (ECMA-424)** with `cryptographic-asset` components, algorithm parameters, OIDs, NIST quantum security levels, dependency graphs, and code location evidence snippets.
- Generates executive-ready **PDF summary reports** for CISOs and compliance auditors.

---

## 🏗️ System Architecture

```
                               ┌──────────────────────────────────────────┐
                               │       Next.js 14 Web Dashboard           │
                               │ (Login | Wizard | Inventory | Mosca UI)  │
                               └────────────────────┬─────────────────────┘
                                                    │ REST API / WebSockets
                               ┌────────────────────▼─────────────────────┐
                               │          FastAPI Backend Service         │
                               │  Auth | Scan CRUD | DB Models | Engine   │
                               └──────────┬───────────────────────┬───────┘
                                          │                       │
                                          ▼                       ▼
                               ┌────────────────────┐   ┌─────────────────┐
                               │   PostgreSQL 16    │   │  Redis Queue +  │
                               │ (Metadata & DB)    │   │  Celery Worker  │
                               └────────────────────┘   └────────┬────────┘
                                                                 │
                       ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                       ▼                                         ▼                                         ▼
            ┌──────────────────────┐                  ┌──────────────────────┐                  ┌──────────────────────┐
            │   Semgrep Engine     │                  │  Syft SBOM Scanner   │                  │ Cert & Config Parser │
            │ (Source Code Rules)  │                  │ (Manifests & Deps)   │                  │ (X.509, TLS, Nginx)  │
            └──────────┬───────────┘                  └──────────┬───────────┘                  └──────────┬───────────┘
                       │                                         │                                         │
                       └─────────────────────────────────────────┼─────────────────────────────────────────┘
                                                                 ▼
                                                  ┌──────────────────────────────┐
                                                  │ Normalizer & Evidence Merger │
                                                  └──────────────┬───────────────┘
                                                                 ▼
                                                  ┌──────────────────────────────┐
                                                  │  CycloneDX 1.6+ CBOM Builder │
                                                  └──────────────┬───────────────┘
                                                                 ▼
                                                  ┌──────────────────────────────┐
                                                  │ Risk, Mosca & PQC Engines    │
                                                  └──────────────┬───────────────┘
                                                                 ▼
                                                  ┌──────────────────────────────┐
                                                  │    MinIO Object Storage      │
                                                  │  (Archives, CBOMs & PDFs)    │
                                                  └──────────────────────────────┘
```

---

## 📐 Standards & Framework Alignment

| Framework / Standard | Scope & Relevance | ECDAT Implementation |
|----------------------|-------------------|----------------------|
| **NIST SP 1800-38B** | Cryptographic Discovery & Inventory Architecture | Multi-layer scanning across code pipelines, operational configs, and binaries. |
| **NIST IR 8547** | Transition Timeline & Deprecation Milestones | Enforces 2030/2035 deprecation rules for RSA/ECDH/ECDSA. |
| **NIST FIPS 203** | ML-KEM (Module-Lattice Key Encapsulation) | Recommends ML-KEM-768 for post-quantum key exchange. |
| **NIST FIPS 204** | ML-DSA (Module-Lattice Digital Signature) | Recommends ML-DSA-65 for post-quantum digital signatures. |
| **NIST FIPS 205** | SLH-DSA (Stateless Hash-Based Digital Signature) | Recommends SLH-DSA for conservative archival signatures. |
| **CycloneDX 1.6+** | ECMA-424 International Standard for CBOM | Standardized JSON export featuring `cryptographic-asset` properties and evidence. |
| **RFC 10024** | Hybrid Key Exchange in TLS 1.3 | Specifies dual classical + PQC transition pairings (e.g., X25519MLKEM768). |
| **Mosca’s Theorem** | PQC Migration Urgency Model ($X + Y > Z$) | Configurable $X, Y, Z$ math engine with 4 planning scenario models. |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts, React Flow | Interactive analyst dashboard, risk charts, Mosca sliders, dependency graphs. |
| **Backend API** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 | Async REST API, WebSockets, JWT authentication, business logic. |
| **Async Tasks** | Celery 5.3, Redis 7 | Distributed job queue for long-running codebase and image scans. |
| **Database** | PostgreSQL 16 | Relational storage for scan runs, discovered artefacts, risk scores, and recommendations. |
| **Storage** | MinIO | S3-compatible object storage for uploaded zip archives, generated CBOM JSONs, and PDF reports. |
| **Scanning** | Semgrep, Syft, LIEF, PyOpenSSL, Cryptography | Static analysis rules, SBOM package parsing, binary inspection, X.509 parsing. |
| **Deployment** | Docker, Docker Compose | One-command on-premise and air-gapped container orchestration. |

---

## 🚀 Quick Start Guide

### Prerequisites
- Docker Engine 24.0+ and Docker Compose v2.20+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/LakshAgrawal28/SIH26184_Mavericks.git
cd SIH26184_Mavericks
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

### 3. Launch Services with Docker Compose
```bash
docker compose up -d --build
```

This starts:
- **Frontend Dashboard**: http://localhost:3000
- **FastAPI Backend API**: http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
- **PostgreSQL Database**: localhost:5432
- **Redis Queue**: localhost:6379
- **MinIO Console**: http://localhost:9001 (API at http://localhost:9000)
- **Celery Worker**: Background task scanner worker

### 4. Perform a Test Scan
1. Open http://localhost:3000 in your browser and log in with default credentials (`admin@example.com` / `admin123`).
2. Click **New Scan** and upload a sample project archive (e.g. `scanner/corpus/java-rsa-aes.zip`).
3. Monitor real-time progress via WebSockets.
4. Explore discovered cryptographic inventory, risk scores, Mosca timeline calculations, and PQC recommendations.
5. Click **Export CBOM** to download the CycloneDX 1.6+ JSON file.

---

## 📂 Repository Directory Layout

```
SIH26184_Mavericks/
├── README.md                     # Root overview & user guide
├── ARCHITECTURE.md               # Deep system architecture & technical specification
├── CONTEXT.md                    # Problem context, theory, NIST & Mosca frameworks
├── IMPLEMENTATION.md             # Master engineering plan & build roadmap
├── SECURITY.md                   # Threat model, sandboxing, & security policy
├── CONTRIBUTING.md               # Developer guidelines & contribution workflow
├── docker-compose.yml            # Container orchestration manifest
├── .env.example                  # Environment variable configuration template
├── docs/                         # Detailed documentation suite
│   ├── PRD.md                    # Product Requirements Document
│   ├── WINNING_GUIDE.md          # SIH judging criteria, pitch & theory guide
│   ├── CBOM_SPEC.md              # CycloneDX 1.6+ ECMA-424 specification mapping
│   └── API_SPEC.md               # OpenAPI / REST & WebSocket contract docs
├── backend/                      # FastAPI service & Celery workers
│   ├── app/                      # Application source code
│   │   ├── main.py               # FastAPI application entry point
│   │   ├── api/v1/               # API route handlers
│   │   ├── models/               # SQLAlchemy database models
│   │   ├── schemas/              # Pydantic data validation schemas
│   │   ├── engines/              # Risk, Mosca, and PQC recommendation engines
│   │   ├── cbom/                 # CycloneDX CBOM serializer & validator
│   │   └── workers/              # Celery background scan tasks
│   └── tests/                    # Unit and integration test suite
├── scanner/                      # Multi-layer cryptographic discovery subsystem
│   ├── detectors/                # Language-specific & cert/config detectors
│   ├── rules/semgrep/            # Semgrep cryptographic pattern rules
│   ├── data/                     # Algorithm taxonomy & library risk databases
│   └── corpus/                   # Test fixtures & sample code bases
├── frontend/                     # Next.js 14 React web dashboard
│   └── src/app/                  # Pages, components, and hooks
└── infra/docker/                 # Dockerfiles for services & worker sandboxes
```

---

## 📖 Comprehensive Documentation Suite

For exhaustive technical detail, consult the specialized documentation files:

- 🏗️ [**ARCHITECTURE.md**](ARCHITECTURE.md): System components, data pipelines, database schemas, scanner internals, and sandboxing.
- 📚 [**CONTEXT.md**](CONTEXT.md): Quantum computing theory, Shor’s/Grover’s algorithms, HNDL threat vectors, Mosca’s theorem math, and competitive analysis.
- 🛠️ [**IMPLEMENTATION.md**](IMPLEMENTATION.md): 8-phase master engineering roadmap, step-by-step build sequence, API specs, and detector rules.
- 📑 [**docs/PRD.md**](docs/PRD.md): Official Product Requirements Document.
- 🏆 [**docs/WINNING_GUIDE.md**](docs/WINNING_GUIDE.md): SIH judging alignment, presentation script, and live demo guide.
- 📋 [**docs/CBOM_SPEC.md**](docs/CBOM_SPEC.md): CycloneDX 1.6+ ECMA-424 JSON schema field mapping.
- 🔌 [**docs/API_SPEC.md**](docs/API_SPEC.md): Full REST & WebSocket API specification.
- 🔒 [**SECURITY.md**](SECURITY.md): Threat model, scanner isolation, and security controls.
- 🤝 [**CONTRIBUTING.md**](CONTRIBUTING.md): Code style, testing, and contribution standards.

---

## 🏆 SIH 2026 Evaluation Compliance

| Judging Parameter | Weight | How ECDAT Demonstrates Excellence |
|-------------------|--------|------------------------------------|
| **Problem Understanding** | 20% | Addresses NTRO PS 26164 directly; solves the pre-requisite inventory phase for NIST 2030 PQC migration. |
| **Innovation & Uniqueness** | 25% | First unified platform combining discovery + composite quantum risk + Mosca timeline scenarios + NIST PQC recommendations + evidence snippets. |
| **Technical Feasibility** | 20% | Production-grade stack (FastAPI, Next.js, Celery, PostgreSQL, Semgrep, Syft) deployable via single Docker Compose. |
| **Impact & Scalability** | 20% | Serves all government, defense, and enterprise organizations needing PQC migration; air-gap ready. |
| **Presentation Quality** | 15% | Live end-to-end interactive dashboard demo, downloadable CycloneDX CBOM, and PDF summary reports. |

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👥 Team & Contact

Developed for **Smart India Hackathon 2026 (SIH 2026)** — **Problem Statement 26164** by **Team Mavericks** for **National Technical Research Organisation (NTRO)**.

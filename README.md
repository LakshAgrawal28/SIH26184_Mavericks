# ECDAT — Enterprise Cryptographic Discovery & Analysis Tool

[![SIH 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in/)
[![Problem Statement 26164](https://img.shields.io/badge/PS%20ID-26164-orange.svg)](https://sih.gov.in/)
[![NTRO](https://img.shields.io/badge/Organization-NTRO-green.svg)](https://ntro.gov.in/)
[![CycloneDX CBOM](https://img.shields.io/badge/CBOM-CycloneDX%201.6%2B-purple.svg)](https://cyclonedx.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

**ECDAT** is a cryptographic discovery and risk analysis platform built for **Smart India Hackathon 2026** (Problem Statement **26164**, **NTRO**). Upload a codebase archive and ECDAT inventories every algorithm, certificate, TLS configuration, and crypto library it finds — scores quantum vulnerability, applies **Mosca's theorem**, recommends **NIST PQC / hybrid** replacements, and exports a standards-compliant **CycloneDX 1.6+ CBOM**.

> *You cannot migrate what you cannot see. ECDAT is the security X-ray for enterprise cryptography.*

---

## Live Demo

| Service | URL |
|---------|-----|
| **Dashboard** | [https://ecdat-frontend.onrender.com](https://ecdat-frontend.onrender.com) |
| **API** | [https://ecdat-api-iqgx.onrender.com](https://ecdat-api-iqgx.onrender.com) |
| **Swagger docs** | [https://ecdat-api-iqgx.onrender.com/docs](https://ecdat-api-iqgx.onrender.com/docs) |

**Login:** `admin@example.com` / `admin123`

> Free-tier Render services spin down after inactivity. First load may take 30–60 seconds.

---

## Features

| Capability | Description |
|------------|-------------|
| **Multi-layer discovery** | Source code (Semgrep), dependency manifests, X.509 certificates, TLS/nginx configs, binary fingerprints |
| **Quantum risk scoring** | Composite 0–10 score combining HNDL threat and operational weakness |
| **Mosca timeline** | Interactive \(X + Y > Z\) analysis with Optimistic / Baseline / Aggressive / Regulatory scenarios |
| **PQC recommendations** | Maps legacy crypto to **ML-KEM**, **ML-DSA**, **SLH-DSA** and hybrid pairings (e.g. X25519+ML-KEM-768) |
| **CycloneDX CBOM export** | Valid CycloneDX 1.6+ JSON (ECMA-424 `cryptographic-asset` schema) |
| **Evidence-backed findings** | Every artefact includes file path, line number, and code snippet |
| **On-prem ready** | Runs locally or in Docker with no mandatory cloud dependencies |

---

## Screenshots

| Dashboard | New Scan | Scan Results |
|-----------|----------|--------------|
| Stats, recent scans, quick-start corpus | Drag-and-drop upload + live Mosca panel | Inventory, Mosca sliders, PQC recs, CBOM export |

---

## Architecture

```
┌─────────────┐     REST / JWT      ┌──────────────────┐
│  Next.js 14 │ ◄─────────────────► │  FastAPI API     │
│  Dashboard  │                     │  (auth, scans)   │
└─────────────┘                     └────────┬─────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
            ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
            │   Scanner    │      │ Risk / Mosca │      │  CBOM Builder│
            │  (4 layers)  │      │  / PQC       │      │  (CycloneDX) │
            └──────────────┘      └──────────────┘      └──────────────┘
                    │
     ┌──────────────┼──────────────┬──────────────┐
     ▼              ▼              ▼              ▼
  Semgrep       Catalog/SBOM    Cert parser    Binary sniff
```

**Stack:** Python 3.12 · FastAPI · SQLAlchemy · Celery/Redis (optional) · Next.js 14 · Tailwind CSS · Semgrep · CycloneDX

---

## Quick Start

### Prerequisites

- **Docker** (recommended) or Python 3.12+ and Node.js 20+
- Git

### Option A — Docker Compose (full stack)

```bash
git clone https://github.com/LakshAgrawal28/SIH26184_Mavericks.git
cd SIH26184_Mavericks
cp .env.example .env
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API / Swagger | http://localhost:8000/docs |
| MinIO console | http://localhost:9001 |

Login: `admin@example.com` / `admin123`

### Option B — Local development (no Docker)

**Backend** (terminal 1):

```bash
export PYTHONPATH="$(pwd)"
export DATABASE_URL=sqlite:///./ecdat_dev.db
export SYNC_SCAN=true
export JWT_SECRET=dev-secret

cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the helper script:

```bash
bash scripts/dev-api.sh
```

**Frontend** (terminal 2):

```bash
cd frontend
cp .env.example .env.local   # sets NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

Open http://localhost:3000

---

## Demo Walkthrough (5 minutes)

1. **Sign in** with the default credentials above.
2. Go to **Scans → New scan**.
3. Upload `scanner/corpus/archives/mixed-enterprise.zip`  
   *(Java RSA, nginx TLS 1.0, expiring cert, native `.so` library)*
4. Set **Data lifetime (X)** = 10 years, **Migration time (Y)** = 4 years.
5. Watch the **Mosca panel** — baseline \(Z = 10\) shows **At Risk** when \(X + Y > Z\).
6. After the scan completes, open the **Artefacts** tab — click a row for file:line evidence.
7. On the **Mosca** tab, drag sliders to flip urgency between EXPIRED / URGENT / PLAN.
8. Click **Export CBOM** — download valid CycloneDX 1.6 JSON.

To rebuild corpus zips from source fixtures:

```bash
python scanner/scripts/build_corpus_zips.py
```

---

## Project Structure

```
├── backend/                 # FastAPI app, engines, CBOM builder, tests
│   ├── app/
│   │   ├── api/v1/          # REST endpoints (auth, scans, reports)
│   │   ├── engines/         # Risk, Mosca, PQC, cert expiry
│   │   ├── cbom/            # CycloneDX 1.6 builder + validator
│   │   └── services/        # Scan pipeline orchestration
│   └── tests/
├── frontend/                # Next.js 14 dashboard
│   └── src/
│       ├── app/(main)/      # Dashboard, scans, artefacts, settings
│       └── components/      # AppShell, StatCard, MoscaRiskPanel, etc.
├── scanner/                 # Discovery engine (standalone Python package)
│   ├── detectors/           # Semgrep, catalog, cert, binary, source
│   ├── rules/               # Semgrep YAML rules
│   ├── corpus/              # Labelled test fixtures + archives
│   └── accuracy/            # Corpus accuracy scoreboard
├── docs/                    # Architecture, API spec, SIH guides, team briefs
├── infra/docker/            # Dockerfiles for API, worker, frontend
├── scripts/                   # dev-api.sh
├── docker-compose.yml
├── render.yaml              # Render Blueprint (production deploy)
└── .env.example
```

---

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | JWT login |
| `/api/v1/scans` | GET / POST | List scans / upload archive |
| `/api/v1/scans/{id}` | GET | Scan status + progress |
| `/api/v1/scans/{id}/artefacts` | GET | Discovered crypto inventory |
| `/api/v1/scans/{id}/mosca` | GET | Mosca timeline (live X/Y params) |
| `/api/v1/scans/{id}/recommendations` | GET | PQC / hybrid migration actions |
| `/api/v1/scans/{id}/reports/cbom` | POST | Download CycloneDX CBOM JSON |
| `/api/v1/accuracy` | GET | Corpus accuracy scoreboard |
| `/health` | GET | API + database health check |

Full spec: [`docs/API_SPEC.md`](docs/API_SPEC.md)

---

## Testing

**Backend** (pytest):

```bash
cd backend
pip install -r requirements.txt
pytest tests -q
```

**Frontend** (build check):

```bash
cd frontend
npm install && npm run build
```

**Corpus accuracy:** 23/23 labelled crypto families detected, 0 invented algorithms, deterministic. See [`docs/ACCURACY.md`](docs/ACCURACY.md).

---

## Deployment (Render)

The repo includes a [`render.yaml`](render.yaml) Blueprint for one-command deploy:

- **ecdat-api** — Python/FastAPI, sync-scan mode, SQLite
- **ecdat-frontend** — Next.js, `NEXT_PUBLIC_API_URL` pointed at API

```bash
# Validate blueprint locally (requires Render CLI)
render blueprints validate render.yaml
```

Or connect the GitHub repo in the [Render Dashboard](https://dashboard.render.com) and deploy from `main`.

---

## Standards & Frameworks

| Standard | Role |
|----------|------|
| [CycloneDX 1.6 / ECMA-424](https://cyclonedx.org/) | CBOM output format |
| [NIST FIPS 203/204/205](https://csrc.nist.gov/projects/post-quantum-cryptography) | ML-KEM, ML-DSA, SLH-DSA recommendations |
| [NIST IR 8547](https://csrc.nist.gov/pubs/ir/8547/ipd) | PQC transition timeline |
| [NIST SP 1800-38B](https://www.nccoe.nist.gov/projects/migration-post-quantum-cryptography) | Cryptographic discovery architecture |
| Mosca's theorem | \(X + Y > Z\) migration urgency model |

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design and data flow |
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | REST API reference |
| [`docs/CBOM_SPEC.md`](docs/CBOM_SPEC.md) | CycloneDX field mapping |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements |
| [`docs/WINNING_GUIDE.md`](docs/WINNING_GUIDE.md) | SIH judging prep + Q&A |
| [`docs/PRESENTATION_SCRIPT.md`](docs/PRESENTATION_SCRIPT.md) | 4-minute pitch script |
| [`docs/team-briefs/00-INDEX.md`](docs/team-briefs/00-INDEX.md) | Per-member reading briefs |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Contribution guidelines |

---

## Team

**Team Mavericks** — Smart India Hackathon 2026  
**Problem Statement:** 26164 — Enterprise Cryptographic Discovery & Analysis Tool  
**Organization:** National Technical Research Organisation (NTRO)  
**Theme:** Blockchain & Cybersecurity

---

## License

This project is licensed under the [MIT License](LICENSE).

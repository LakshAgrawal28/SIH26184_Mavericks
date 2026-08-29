# ECDAT — Enterprise Cryptographic Discovery & Analysis Tool

[![SIH 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in/)
[![Problem Statement ID](https://img.shields.io/badge/PS%20ID-26164-orange.svg)](https://sih.gov.in/)
[![Organization](https://img.shields.io/badge/Organization-NTRO-green.svg)](https://ntro.gov.in/)
[![CBOM Standard](https://img.shields.io/badge/CBOM-CycloneDX%201.6%2B%20(ECMA--424)-purple.svg)](https://cyclonedx.org/)
[![NIST Alignment](https://img.shields.io/badge/NIST-SP%201800--38B%20%7C%20IR%208547-red.svg)](https://csrc.nist.gov/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

> **"ECDAT is a security X-ray for enterprise cryptography. Point it at your codebases, dependencies, certificates, binaries, or container images, and it discovers every algorithm, key, certificate, and library — computes quantum vulnerability and Mosca timelines — and recommends exact Post-Quantum Cryptography (PQC) and hybrid replacements."**

---

## Executive Summary & Problem Context

Organizations worldwide face an unprecedented cybersecurity transition: **Post-Quantum Cryptography (PQC)** migration. Quantum computers running **Shor’s algorithm** will break foundational public-key cryptosystems—including **RSA**, **ECDH**, **ECDSA**, and **DSA**—putting enterprise PKIs, encrypted data, and authentication mechanisms at risk.

Under the **Harvest Now, Decrypt Later (HNDL)** threat model, adversaries can capture encrypted traffic today and decrypt it later once a Cryptographically Relevant Quantum Computer (CRQC) exists.

**ECDAT** (Enterprise Cryptographic Discovery & Analysis Tool) solves this for **NTRO** by automating multi-layer cryptographic discovery, generating **CycloneDX 1.6+ CBOM** JSON, scoring quantum risk, applying **Mosca’s Theorem ($X + Y > Z$)**, and recommending **PQC / hybrid** migrations.

---

## Implementation Status (MVP)

This branch includes a working MVP:

| Area | Status |
|------|--------|
| FastAPI backend + JWT auth | Done |
| Crypto detectors (source, certs, configs, binary) | Done |
| Risk / Mosca / PQC engines + CBOM export | Done |
| Next.js dashboard (scan, inventory, Mosca, export) | Done |
| Docker Compose + CI pytest | Done |
| Local sync-scan (no Redis/Celery required) | Done |

---

## Documentation (`docs/` Index)

### Teaching & SIH prep
- [`docs/TEACHING_GUIDE.md`](docs/TEACHING_GUIDE.md)
- [`docs/CRYPTO_CHEAT_SHEET.md`](docs/CRYPTO_CHEAT_SHEET.md)
- [`docs/PRESENTATION_SCRIPT.md`](docs/PRESENTATION_SCRIPT.md)
- [`docs/WINNING_GUIDE.md`](docs/WINNING_GUIDE.md)
- [`docs/PRD.md`](docs/PRD.md)

### Technical specs
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/CONTEXT.md`](docs/CONTEXT.md)
- [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md)
- [`docs/API_SPEC.md`](docs/API_SPEC.md)
- [`docs/CBOM_SPEC.md`](docs/CBOM_SPEC.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)

---

## Quick Start

### Option A — Docker Compose (full stack)

```bash
cp .env.example .env
docker compose up -d --build
```

- Frontend: http://localhost:3000  
- API / Swagger: http://localhost:8000/docs  
- MinIO: http://localhost:9001  

Login: `admin@example.com` / `admin123`

### Option B — Local sync-scan (no Docker)

```bash
# Backend
export PYTHONPATH=backend:scanner
export DATABASE_URL=sqlite:///./ecdat_dev.db
export SYNC_SCAN=true
export JWT_SECRET=dev-secret
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Or use: `bash scripts/dev-api.sh`

### Demo scan

1. Build sample zips: `python scanner/scripts/build_corpus_zips.py`
2. Upload `scanner/corpus/archives/java-rsa-aes.zip` via **New Scan**
3. Review inventory, Mosca scenarios, PQC recommendations
4. Export CycloneDX CBOM JSON

---

## Repository Layout

```
SIH26184_Mavericks/
├── README.md
├── docker-compose.yml
├── .env.example
├── docs/                 # All documentation
├── backend/              # FastAPI + Celery + engines
├── frontend/             # Next.js dashboard
├── scanner/              # Detectors, rules, corpus
├── infra/docker/         # Dockerfiles
└── scripts/              # Local dev helpers
```

---

## Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests -q
```

```bash
cd frontend
npm install && npm run build
```

---

## Team & Contact

Developed for **Smart India Hackathon 2026** — **Problem Statement 26164** by **Team Mavericks** for **National Technical Research Organisation (NTRO)**.

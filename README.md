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

Under the **Harvest Now, Decrypt Later (HNDL)** threat model, adversarial state actors are actively capturing encrypted network traffic today, intending to decrypt it retroactively once a Cryptographically Relevant Quantum Computer (CRQC) becomes operational.

**ECDAT** (Enterprise Cryptographic Discovery & Analysis Tool) solves this problem for **National Technical Research Organisation (NTRO)** by automating multi-layer cryptographic discovery, generating standardized **CycloneDX 1.6+ Cryptographic Bill of Materials (CBOM)** JSON files, quantifying **quantum risk scores**, analyzing migration urgency using **Mosca’s Theorem ($X + Y > Z$)**, and producing actionable **PQC and hybrid migration plans**.

---

## 📚 Complete Project Documentation (`docs/` Index)

All technical architecture, theoretical context, implementation roadmaps, specifications, and learning/teaching guides are consolidated inside the [`docs/`](docs/) directory:

### 🎓 Teaching, Learning & Team Understanding
- 📖 [**`docs/TEACHING_GUIDE.md`**](docs/TEACHING_GUIDE.md): **Master Team Teaching & Study Guide** — Plain-English walkthrough of ECDAT, quantum concepts, Mosca's theorem, PQC standards, and a 15-question self-assessment quiz for team learning.
- ⚡ [**`docs/CRYPTO_CHEAT_SHEET.md`**](docs/CRYPTO_CHEAT_SHEET.md): **Cryptography, Quantum Risk & PQC Quick Reference** — Algorithm vulnerability lookup table, NIST FIPS 203/204/205 cheat sheet, Semgrep code patterns, and CBOM fields.
- 🎤 [**`docs/PRESENTATION_SCRIPT.md`**](docs/PRESENTATION_SCRIPT.md): **Team Presentation Pitch & Live Demo Script** — Slide-by-slide 4-minute pitch narrative, 5-minute live demo walkthrough script, and top 15 judge Q&A master answers.

### 🏗️ Technical & Architecture Specifications
- 🏛️ [**`docs/ARCHITECTURE.md`**](docs/ARCHITECTURE.md): **System Architecture & Technical Specification** — Component layout, 9-stage scan data pipeline, quantum risk math formulas, Mosca inequality math, ERD schema, and worker sandboxing security.
- 🔬 [**`docs/CONTEXT.md`**](docs/CONTEXT.md): **Domain Context & Cryptographic Theory** — Shor's vs Grover's algorithms, HNDL threat vectors, NIST SP 1800-38B / IR 8547 alignment, target personas, and competitive analysis vs. IBM CBOMkit.
- 🛠️ [**`docs/IMPLEMENTATION.md`**](docs/IMPLEMENTATION.md): **Master Engineering Build Plan** — 8-phase implementation roadmap, directory structure, 24-step build order, Semgrep rule definitions, and API route contracts.
- 📑 [**`docs/PRD.md`**](docs/PRD.md): **Product Requirements Document** — Product vision, functional/non-functional requirements, features, and priority matrix.
- 🏆 [**`docs/WINNING_GUIDE.md`**](docs/WINNING_GUIDE.md): **SIH Judging Alignment & Knowledge Base** — 8 evaluation criteria mapping, theory teaching plan, and submission checklist.
- 📋 [**`docs/CBOM_SPEC.md`**](docs/CBOM_SPEC.md): **CycloneDX 1.6+ ECMA-424 Specification** — Field-by-field JSON mapping for cryptographic assets, algorithms, certificates, and evidence occurrences.
- 🔌 [**`docs/API_SPEC.md`**](docs/API_SPEC.md): **REST & WebSocket API Specification** — Complete API contract detailing auth, scans, inventory, risk, Mosca, and report export endpoints.
- 🔒 [**`docs/SECURITY.md`**](docs/SECURITY.md): **Security Model & Threat Mitigation** — Zip-slip defense, container sandboxing, air-gap guidelines, and vulnerability reporting.
- 🤝 [**`docs/CONTRIBUTING.md`**](docs/CONTRIBUTING.md): **Development & Contribution Guidelines** — Local setup, pytest commands, code style, and pull request procedures.

---

## ⚡ Quick Start Guide

### Prerequisites
- Docker Engine 24.0+ & Docker Compose v2.20+

### 1. Launch Services
```bash
cp .env.example .env
docker compose up -d --build
```

### 2. Service Endpoints
- **Frontend Dashboard**: http://localhost:3000
- **FastAPI Backend API**: http://localhost:8000 (Swagger docs: http://localhost:8000/docs)
- **MinIO Console**: http://localhost:9001

---

## 👥 Team & Contact

Developed for **Smart India Hackathon 2026 (SIH 2026)** — **Problem Statement 26164** by **Team Mavericks** for **National Technical Research Organisation (NTRO)**.

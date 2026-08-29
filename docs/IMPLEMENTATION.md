# ECDAT — Master Engineering & Implementation Plan

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**Problem Statement ID:** 26164 (NTRO)  
**Document Version:** 1.0.0  

---

## 🗺️ 1. Eight-Phase Engineering Roadmap

```
Phase 1: Foundation & Core Stack ──────────> Phase 2: Ingestion & Scan Worker ──────────> Phase 3: Discovery Engine
(Repo, FastAPI, DB Models, JWT)              (Celery, Redis, MinIO, WebSockets)             (Semgrep, Syft, Cert Parsers)
                                                                                                      │
                                                                                                      ▼
Phase 6: Next.js Interactive Dashboard <─── Phase 5: Risk, Mosca & PQC Engines <───────── Phase 4: CBOM Serializer
(Inventory, Risk, Mosca UI, Reports)        (Scoring Math, Scenarios, FIPS 203)            (CycloneDX 1.6+ JSON)
           │
           ▼
Phase 7: Binary & Container Scanner ────────> Phase 8: Hardening & Demo Readiness
(Strings, YARA, Docker Layer Scan)           (Corpus Tests, PDF Report, CI/CD)
```

---

## 📂 2. Repository Directory Layout & File Allocation

```
SIH26184_Mavericks/
├── README.md
├── ARCHITECTURE.md
├── CONTEXT.md
├── IMPLEMENTATION.md
├── SECURITY.md
├── CONTRIBUTING.md
├── docker-compose.yml
├── .env.example
├── docs/
│   ├── PRD.md
│   ├── WINNING_GUIDE.md
│   ├── CBOM_SPEC.md
│   └── API_SPEC.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                     # FastAPI entry point
│       ├── config.py                   # Environment settings
│       ├── db/
│       │   ├── session.py              # Async SQLAlchemy engine
│       │   └── base.py                 # DB base models
│       ├── api/v1/
│       │   ├── auth.py                 # JWT login & user management
│       │   ├── scans.py                # Scan CRUD & upload handlers
│       │   ├── artefacts.py            # Inventory & evidence endpoints
│       │   ├── risk.py                 # Risk evaluation endpoints
│       │   ├── mosca.py                # Mosca scenario math endpoints
│       │   └── reports.py              # CBOM JSON & PDF generation
│       ├── models/
│       │   ├── scan.py                 # Scan ORM model
│       │   ├── artefact.py             # CryptoArtefact ORM model
│       │   ├── risk.py                 # RiskAssessment ORM model
│       │   └── mosca.py                # MoscaContext ORM model
│       ├── schemas/
│       │   ├── scan.py                 # Pydantic schemas for scans
│       │   ├── artefact.py             # Pydantic schemas for artefacts
│       │   └── cbom.py                 # CycloneDX schemas
│       ├── engines/
│       │   ├── risk_engine.py          # Quantum risk scoring calculations
│       │   ├── mosca_engine.py         # X+Y>Z scenario timeline math
│       │   └── pqc_engine.py           # NIST FIPS 203/204/205 mapping
│       ├── cbom/
│       │   ├── builder.py              # CycloneDX 1.6 JSON serializer
│       │   └── validator.py            # ECMA-424 schema validator
│       └── workers/
│           ├── celery_app.py           # Celery task configuration
│           └── scan_worker.py          # Background scan execution
├── scanner/
│   ├── detectors/
│   │   ├── base.py                     # Detector abstract base class
│   │   ├── semgrep_detector.py         # Source code static detector
│   │   ├── syft_detector.py            # Dependency SBOM detector
│   │   ├── cert_detector.py            # X.509 certificate parser
│   │   └── config_detector.py          # TLS/Nginx config parser
│   ├── rules/semgrep/
│   │   ├── java_crypto.yaml            # Java JCE pattern rules
│   │   ├── python_crypto.yaml          # Python pyca pattern rules
│   │   ├── js_crypto.yaml              # JS Node crypto rules
│   │   ├── go_crypto.yaml              # Go crypto/tls rules
│   │   └── rust_crypto.yaml            # Rust ring/rustls rules
│   ├── data/
│   │   ├── algorithm_taxonomy.json     # Quantum vulnerability database
│   │   └── library_database.json       # Known crypto library index
│   └── corpus/                         # Test fixtures & sample targets
│       ├── java-rsa-aes/
│       ├── python-crypto/
│       └── weak-configs/
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/app/
        ├── page.tsx                    # Landing / Overview dashboard
        ├── login/page.tsx              # Authentication view
        ├── scans/
        │   ├── page.tsx                # Scan history table
        │   ├── new/page.tsx            # Scan creation wizard
        │   └── [id]/
        │       ├── page.tsx            # Scan detail tabs layout
        │       ├── inventory/          # Discovered artefacts table
        │       ├── risk/               # Risk charts & heatmaps
        │       ├── mosca/              # Interactive Mosca timeline
        │       └── recommendations/    # Actionable PQC action items
        └── components/                 # Reusable UI components
```

---

## 🛠️ 3. Step-by-Step 24-Task Build Sequence

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             24-STEP BUILD SEQUENCE                               │
├────┬─────────────────────────────────────────────┬───────────────────────────────┤
│ #  │ Task Name                                   │ Primary Deliverable File      │
├────┼─────────────────────────────────────────────┼───────────────────────────────┤
│ 01 │ Setup Repo & Environment Configuration      │ `.env.example`, `.gitignore`  │
│ 02 │ Multi-Container Docker Compose Setup        │ `docker-compose.yml`          │
│ 03 │ FastAPI Skeleton & Health Endpoint          │ `backend/app/main.py`         │
│ 04 │ Database Models & Alembic Migrations        │ `backend/app/models/`         │
│ 05 │ JWT Authentication System                   │ `backend/app/api/v1/auth.py`  │
│ 06 │ Next.js 14 Dashboard Skeleton               │ `frontend/src/app/page.tsx`   │
│ 07 │ Scan Management REST Endpoints              │ `backend/app/api/v1/scans.py` │
│ 08 │ MinIO Object Storage Integration            │ `backend/app/services/s3.py`  │
│ 09 │ Celery & Redis Distributed Task Queue       │ `backend/app/workers/`        │
│ 10 │ WebSocket Real-time Progress Pipeline        │ `backend/app/api/v1/scans.py` │
│ 11 │ Archive Unpacking & Zip-Slip Defense        │ `scanner/detectors/base.py`   │
│ 12 │ Semgrep Cryptographic Ruleset (5 languages) │ `scanner/rules/semgrep/`      │
│ 13 │ Semgrep Source Code Detector Plugin         │ `semgrep_detector.py`         │
│ 14 │ Syft Dependency SBOM Detector Plugin        │ `syft_detector.py`            │
│ 15 │ X.509 Certificate & TLS Config Parsers      │ `cert_detector.py`            │
│ 16 │ Artefact Normalizer & Dedup Engine          │ `backend/app/services/norm.py`│
│ 17 │ CycloneDX 1.6+ CBOM Serializer & Validator   │ `backend/app/cbom/builder.py` │
│ 18 │ Quantum Risk Scoring Engine                 │ `engines/risk_engine.py`      │
│ 19 │ Mosca’s Theorem Urgency Calculator          │ `engines/mosca_engine.py`     │
│ 20 │ PQC & Hybrid Recommendation Generator       │ `engines/pqc_engine.py`       │
│ 21 │ Next.js Inventory & Evidence Drawer UI      │ `frontend/src/app/scans/`     │
│ 22 │ Next.js Mosca Timeline & Scenario Slider UI │ `frontend/src/app/scans/mosca`│
│ 23 │ Executive PDF Summary Report Generator      │ `backend/app/api/v1/reports`  │
│ 24 │ Test Corpus Execution & Verification        │ `scanner/corpus/`             │
└────┴─────────────────────────────────────────────┴───────────────────────────────┘
```

---

## 🔍 4. Semgrep Ruleset & Insecure Cryptographic Patterns

The discovery engine uses custom Semgrep rules to parse abstract syntax trees (ASTs) for cryptographic calls:

### Java Insecure Cipher Pattern (`java_crypto.yaml`)
```yaml
rules:
  - id: java-insecure-rsa-ecb
    pattern: Cipher.getInstance("RSA/ECB/$PADDING")
    message: "RSA in ECB mode detected without OAEP padding."
    severity: ERROR
    metadata:
      primitive: "encryption"
      algorithm: "RSA-2048"
      quantum_risk: 10.0
```

### Python Hash Primitive Pattern (`python_crypto.yaml`)
```yaml
rules:
  - id: python-weak-md5-hash
    pattern: hashlib.md5(...)
    message: "Deprecated MD5 hash function used."
    severity: WARNING
    metadata:
      primitive: "hash"
      algorithm: "MD5"
      quantum_risk: 10.0
```

### JavaScript / Node.js Crypto Pattern (`js_crypto.yaml`)
```yaml
rules:
  - id: js-deprecated-des-cipher
    pattern: crypto.createCipher("des", ...)
    message: "Deprecated DES cipher initialization."
    severity: ERROR
    metadata:
      primitive: "block-cipher"
      algorithm: "DES"
      quantum_risk: 10.0
```

---

## 🔌 5. API Route Contracts

### Auth & System Routes
- `POST /api/v1/auth/login`: Authenticate and issue JWT bearer token.
- `GET /health`: System services health check (Postgres, Redis, MinIO connectivity).

### Scan Routes
- `POST /api/v1/scans`: Upload project archive and initialize async scan task.
- `GET /api/v1/scans`: List all past scan executions with summary statistics.
- `GET /api/v1/scans/{id}`: Detailed metadata for a specific scan.
- `WS /api/v1/scans/{id}/progress`: Real-time WebSocket connection for progress updates.

### Analysis & Export Routes
- `GET /api/v1/scans/{id}/artefacts`: Paginated, filterable list of discovered assets.
- `GET /api/v1/scans/{id}/risk`: Aggregated risk metrics and risk band distribution.
- `GET /api/v1/scans/{id}/mosca`: Mosca scenario timeline computations.
- `GET /api/v1/scans/{id}/recommendations`: Prioritized list of PQC replacement items.
- `POST /api/v1/scans/{id}/reports/cbom`: Generate and download CycloneDX 1.6+ CBOM JSON.
- `POST /api/v1/scans/{id}/reports/pdf`: Generate and download executive PDF report.

---

## 🧪 6. Test Corpus & Automated Verification Plan

The codebase includes 8 test corpus fixtures in `scanner/corpus/` for integration testing:

1. `java-rsa-aes/`: Contains JCE RSA-2048, AES-CBC, and BouncyCastle usage. Verifies Semgrep Java rules.
2. `python-crypto/`: PyCryptodome, weak MD5, and pyca/cryptography. Verifies Python rules.
3. `nodejs-jwt/`: Hardcoded secrets and RS256 token signing. Verifies JS rules.
4. `go-tls/`: `crypto/tls` configuration with insecure cipher suites.
5. `openssl-certs/`: X.509 PEM certificates with expiring RSA keys. Verifies cert parser.
6. `weak-configs/`: `nginx.conf` and `java.security` files with TLS 1.0 enabled.
7. `pqc-modern/`: Reference ML-KEM and ML-DSA implementations. Verifies zero-risk scoring.
8. `obfuscated/`: Base64-encoded key materials. Verifies fallback detection.

### Automated Test Command
```bash
pytest backend/tests/ -v --cov=app
```

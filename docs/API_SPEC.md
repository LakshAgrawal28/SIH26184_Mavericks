# ECDAT — REST & WebSocket API Specification

**Base URL:** `/api/v1`  
**Protocol:** HTTP/1.1 & WebSockets (WSS)  
**Authentication:** HTTP Bearer Token (`Authorization: Bearer <JWT>`)  
**Version:** 1.0.0  

---

## 🔐 1. Authentication Endpoints

### `POST /api/v1/auth/login`
Authenticate user credentials and receive a JWT token.

#### Request Body (`application/json`)
```json
{
  "email": "analyst@ntro.gov.in",
  "password": "secure_password_123"
}
```

#### Response (`200 OK`)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "u-991203",
    "name": "Security Analyst",
    "role": "analyst"
  }
}
```

---

## 🔍 2. Scan Management Endpoints

### `POST /api/v1/scans`
Create a new scan job by uploading a zip file or targeting a repository.

#### Request (`multipart/form-data`)
- `name` (string): Scan identifier name.
- `target_type` (string): `zip_archive` | `git_repo` | `container_image` | `binary`.
- `file` (file binary): Project zip file (max 500MB).
- `data_lifetime_x` (float, optional): Data shelf life in years (default: 10.0).
- `migration_time_y` (float, optional): Estimated migration time in years (default: 4.0).

#### Response (`201 Created`)
```json
{
  "scan_id": "sc-881290-a",
  "name": "enterprise-banking-core",
  "target_type": "zip_archive",
  "status": "queued",
  "created_at": "2026-08-29T23:10:00Z"
}
```

---

### `GET /api/v1/scans`
List all historical and active scans.

#### Response (`200 OK`)
```json
{
  "scans": [
    {
      "scan_id": "sc-881290-a",
      "name": "enterprise-banking-core",
      "status": "completed",
      "total_files": 412,
      "total_artefacts": 38,
      "critical_risk_count": 5,
      "created_at": "2026-08-29T23:10:00Z"
    }
  ]
}
```

---

### `WS /api/v1/scans/{scan_id}/progress`
WebSocket endpoint streaming scan progress notifications.

#### Server Message Frame (`application/json`)
```json
{
  "scan_id": "sc-881290-a",
  "status": "running",
  "progress_percentage": 65,
  "current_stage": "SemgrepDetector scanning Java files",
  "artefacts_found_so_far": 24
}
```

---

## 📊 3. Artefacts & Inventory Endpoints

### `GET /api/v1/scans/{scan_id}/artefacts`
Query discovered cryptographic assets with filtering.

#### Query Parameters
- `asset_type`: `algorithm` | `certificate` | `protocol` | `library`
- `risk_band`: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
- `limit` (int, default 50)
- `offset` (int, default 0)

#### Response (`200 OK`)
```json
{
  "total": 38,
  "artefacts": [
    {
      "artefact_id": "art-1029",
      "name": "RSA-2048",
      "asset_type": "algorithm",
      "primitive": "public-key-encryption",
      "file_path": "src/main/java/com/ntro/CryptoService.java",
      "line_number": 42,
      "confidence": 0.95,
      "evidence_snippet": "Cipher.getInstance(\"RSA/ECB/PKCS1Padding\")",
      "risk": {
        "final_score": 9.4,
        "risk_band": "CRITICAL"
      },
      "recommendation": {
        "action": "Hybrid Migration",
        "primary_pqc": "ML-KEM-768",
        "hybrid_pair": "X25519MLKEM768"
      }
    }
  ]
}
```

---

## ⏳ 4. Mosca & Risk Endpoints

### `GET /api/v1/scans/{scan_id}/mosca`
Retrieve Mosca scenario math calculations ($X + Y > Z$).

#### Response (`200 OK`)
```json
{
  "scan_id": "sc-881290-a",
  "parameters": {
    "data_lifetime_x": 10.0,
    "migration_time_y": 4.0,
    "total_time_needed": 14.0
  },
  "scenarios": [
    {
      "name": "Baseline Scenario (Z=10)",
      "z_value": 10.0,
      "margin": -4.0,
      "category": "EXPIRED",
      "status_badge": "Red"
    },
    {
      "name": "Optimistic Scenario (Z=15)",
      "z_value": 15.0,
      "margin": 1.0,
      "category": "PLAN",
      "status_badge": "Yellow"
    }
  ]
}
```

---

## 📑 5. Report Generation Endpoints

### `POST /api/v1/scans/{scan_id}/reports/cbom`
Generate and stream CycloneDX 1.6+ CBOM JSON file.

### `POST /api/v1/scans/{scan_id}/reports/pdf`
Generate executive PDF summary report.

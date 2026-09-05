# Brief 2 — Architecture and backend

**Reader:** Person 2 (system / backend)  
**Read time:** ~12 minutes  
**You own:** Architecture slide, APIs, how a scan job actually runs.

---

## Layout of the repo

```
sih 2k26/
├── backend/     FastAPI, engines, CBOM, workers
├── frontend/    Next.js 14 dashboard
├── scanner/     Detectors, Semgrep YAML, labelled corpus
├── docs/        Specs + these briefs
├── infra/docker Dockerfiles
└── scripts/     Local API helper (SYNC_SCAN)
```

Two ways to run:

| Mode | When | How scans run |
|------|------|----------------|
| **Local sync** | Demo laptop | `SYNC_SCAN=true` — FastAPI runs the scan in the same request |
| **Compose** | Full stack | Upload to MinIO → Celery worker → Redis progress pub/sub |

Login (dev): `admin@example.com` / `admin123`  
API: http://localhost:8000/docs · UI: http://localhost:3000  

---

## Request path (remember this diagram)

```
Browser (Next.js)
    │  REST + WebSocket
    ▼
FastAPI  (/api/v1/auth, /scans, /reports, /accuracy)
    │
    ├─ SQLite (local) or PostgreSQL (compose)
    ├─ Scan job: extract zip → detectors → risk/Mosca/PQC → artefacts
    └─ Optional: Redis progress, MinIO for the raw zip, Celery worker
```

**Air-gap principle:** scanning and scoring happen inside our process. No OpenAI / cloud crypto APIs.

---

## Scan lifecycle (9 practical stages)

1. Authenticated user POSTs multipart zip to `POST /api/v1/scans`.  
2. Row created (`queued` / then `running`). Zip stored on disk (`/tmp/ecdat-scans/<id>/upload.zip`) or MinIO key `scans/raw/<id>.zip`.  
3. **Zip-slip check:** each member’s resolved path must stay under the extract directory.  
4. Extract; **nested `.zip` / `.jar` / `.war` / `.ear`** unpacked up to depth 2.  
5. Detectors run (Person 3). Findings are **normalized and deduped**.  
6. Each finding gets HNDL + operational risk, band, and a PQC recommendation (Person 4).  
7. Rows written to `artefacts`. Scan marked `completed` (or `failed` with `error_message`).  
8. UI polls `GET /scans/{id}` every 800 ms and/or listens on `WS /scans/{id}/progress`.  
9. User can load artefacts, Mosca, recommendations, validate/export CBOM.

If **zero** findings, status is still `completed`. The UI shows “unpacked N files but no crypto matched.” That is success with an empty inventory, not a hang.

---

## Important APIs (you should name these)

| Method | Path | Role |
|--------|------|------|
| POST | `/api/v1/auth/login` | JWT |
| POST | `/api/v1/scans` | Create + (sync) run |
| GET | `/api/v1/scans` | Dashboard list |
| GET | `/api/v1/scans/{id}` | Status, file/artefact counts, stage |
| GET | `/api/v1/scans/{id}/artefacts` | Inventory |
| GET | `/api/v1/scans/{id}/mosca` | Live X/Y/Z |
| PUT | `/api/v1/scans/{id}/context` | Save X/Y |
| GET | `/api/v1/scans/{id}/recommendations` | PQC actions |
| POST | `/api/v1/scans/{id}/reports/cbom` | Download JSON |
| GET | `/api/v1/scans/{id}/reports/cbom/validate` | Schema badge |
| GET | `/api/v1/accuracy` | Corpus scoreboard |

Health: `GET /health` (API + DB + optional Redis).

---

## Code map (if someone asks “where?”)

| Concern | Location |
|---------|----------|
| App + CORS + routers | `backend/app/main.py` |
| Settings (`SYNC_SCAN`, JWT, scan dir) | `backend/app/config.py` |
| Create/list/WS | `backend/app/api/v1/scans.py` |
| Job runner | `backend/app/services/scan_service.py` |
| Celery task | `backend/app/workers/celery_app.py` |
| Risk / Mosca / PQC | `backend/app/engines/` |
| CBOM build + schema | `backend/app/cbom/` |

Local helper: `scripts/dev-api.sh` sets `SYNC_SCAN=true` and starts uvicorn.

---

## Design choices to defend

1. **Sync scan for SIH laptops** so Redis/Celery outages do not leave scans **queued forever**.  
2. **JWT** on REST; WebSocket progress is status-only.  
3. **Deterministic engines** — formulas in Python, not a model.  
4. **Work directory deleted after the job** (`shutil.rmtree`) so `/tmp` does not keep customer source.

---

## Failure modes you must know

| Symptom | Likely cause |
|---------|----------------|
| Scan stays `queued` | `SYNC_SCAN=false` and no Celery worker |
| 401 on dashboard | Token missing / expired — login again |
| Scan completed, 0 artefacts | Zip had no matching crypto (Person 3) |
| Frontend 500 / middleware-manifest | Stale `.next` — restart `npm run dev` |

---

## One sentence for judges

*“FastAPI is the control plane; isolated extract-and-detect is the data plane; artefacts in SQL are the system of record; CycloneDX is the interchange format.”*

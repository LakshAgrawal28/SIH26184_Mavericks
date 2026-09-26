# ECDAT — Website & Deployment Improvement Plan (v2)

**Scope:** authentication, access control, CORS, secrets/deployment configuration, and input/resource handling in the FastAPI backend and Next.js frontend.
**Out of scope (tracked separately):** detection engine, risk scoring, Mosca timeline, PQC recommendations, CBOM mapping — see [`ECDAT_v1.1_Engine_Improvement_Plan.md`](ECDAT_v1.1_Engine_Improvement_Plan.md).
**Current baseline:** app version `1.0.0` (`backend/app/main.py`)

---

## 1. Why this document exists

The engine-layer document covers whether ECDAT's *analysis* is correct. This one covers whether the *application around it* is safe to demo, deploy, and eventually run in production. Several of the items below are self-referential in an uncomfortable way: this is a security-assessment tool, and a judge with a security background is the single most likely person to test exactly these things. None of these require touching the detection/scoring engine — they're contained to the API layer, auth, and deployment config.

---

## 2. Summary of changes

| ID | Area | Current state | Change | Severity | Target version |
|----|------|---------------|--------|----------|-----------------|
| D1 | Access control | Any authenticated user can view/export any other user's scans | Add ownership to `Scan`, filter every query | Critical | v2.0.0 |
| D2 | WebSocket auth | `/scans/{id}/progress` has no auth check at all | Require the same JWT auth as every REST route | Critical | v2.0.0 |
| D3 | Deployment secrets | `docker-compose.yml` loads `.env.example` directly | Load `.env` (git-ignored); `.env.example` stays a template only | Critical | v2.0.0 |
| D4 | Docs vs. code mismatch | `SECURITY.md` describes controls (container hardening, secret redaction, SSRF guard for a nonexistent git-scan feature) that don't exist in code | Rewrite to match reality, or implement the claims | Critical | v2.0.0 |
| D5 | Default admin account | Auto-created with `admin@example.com` / `admin123`, no forced change | Require password change on first login, or generate a random password and print it once at startup | High | v2.1.0 |
| D6 | Login brute-force | No rate limiting or lockout on `/auth/login` | Add per-IP/per-account rate limiting | High | v2.1.0 |
| D7 | Token handling | JWT stored in `localStorage`; no revocation; 24h expiry with no logout invalidation | Move to `httpOnly` cookie or add a revocation list; shorten expiry + add refresh | High | v2.1.0 |
| D8 | CORS policy | `allow_origin_regex` trusts any `*.vercel.app` subdomain with `allow_credentials=True` | Restrict to the exact deployed origin(s) | Medium | v2.1.0 |
| D9 | RBAC | `role` field exists on `User`, never checked anywhere | Either enforce it or remove it — decorative RBAC is worse than none | Medium | v2.1.0 |
| D10 | Zip-bomb protection | No cap on total extracted size; nested archive unpacking (2 levels) compounds it | Add a running extracted-byte counter with a hard ceiling | Medium | v2.2.0 |
| D11 | Input validation | `uuid.UUID(scan_id)` parsed without try/except in several routes | Wrap and return 400 on malformed IDs | Low | v2.2.0 |
| D12 | Resource limits | `limit` query param on `/scans/{id}/artefacts` is unbounded | Cap to a sane maximum (e.g. 500) | Low | v2.2.0 |
| D13 | Info disclosure | `/health` returns raw exception text for DB/Redis failures | Return a generic status; log the detail server-side only | Low | v2.2.0 |

---

## 3. Detailed changes

### D1 — Broken object-level authorization (IDOR)

**Files:** `backend/app/models/__init__.py`, `backend/app/api/v1/scans.py`, `backend/app/api/v1/reports.py`

**Problem:** `Scan` and `Artefact` have no `owner_id`/`user_id` field. Every route depends on `get_current_user` for *authentication* but never checks *ownership* — `list_scans`, `get_scan`, `list_artefacts`, `/mosca`, `/recommendations`, and both CBOM/PDF export endpoints will return data for any scan ID to any logged-in user. This is the single most serious issue in the app: an authenticated but unrelated user can read and export every other user's uploaded code's findings.

**Fix:**
1. Add `owner_id: Mapped[uuid.UUID]` (foreign key to `User.id`) on `Scan`.
2. Set it from `user.id` in `create_scan`.
3. Add `.filter(Scan.owner_id == user.id)` to every query that fetches a scan by ID or lists scans, unless the requester's role is explicitly an admin role that's meant to see everything (see D9 — don't gate this on `role` until D9 makes that check real).

**Acceptance criteria:**
- [ ] A second test user cannot fetch, list, or export a scan created by the first test user (expect 404, not the data)
- [ ] Existing single-user test flows (`test_scan_pipeline.py`, `test_realistic_stack_e2e.py`) still pass unchanged
- [ ] New test explicitly asserting cross-user isolation added to the suite

---

### D2 — Unauthenticated WebSocket endpoint

**File:** `backend/app/api/v1/scans.py::scan_progress_ws`

**Problem:** Every REST endpoint requires `Depends(get_current_user)`. The WebSocket route `/scans/{scan_id}/progress` accepts the connection with zero token check, so scan progress (including artefact counts and risk counts as they populate) is visible to anyone who can reach the route, authenticated or not.

**Fix:** Accept the JWT as a query parameter or subprotocol header on the WebSocket handshake (WebSocket connections can't send an `Authorization` header the way REST calls do), decode it the same way `get_current_user` does, and reject the connection with a close code before `await websocket.accept()` if it's missing or invalid. Once D1 lands, this must also check ownership of `scan_id`.

**Acceptance criteria:**
- [ ] Connecting without a valid token is rejected before any scan data is sent
- [ ] Connecting with another user's valid token to a scan they don't own is rejected once D1's ownership model exists

---

### D3 — Deployment loads example secrets as real config

**File:** `docker-compose.yml`

**Problem:** Both the `api` and `worker` services declare `env_file: - .env.example`. Running the exact command the README tells people to run (`docker compose up`) starts the stack with `admin123`, `ecdat_secret`, and `change-me-in-production-use-long-random-string` as live runtime values, not placeholders.

**Fix:**
1. Change `env_file` to `.env` (already `.gitignore`'d, confirmed no `.env` was ever committed).
2. Add a `Makefile` target or a one-line README step: `cp .env.example .env` before first run, with a comment in `.env.example` telling the reader to replace every value before deploying anywhere beyond a local demo.
3. Optionally, have the app refuse to start in a non-debug/non-demo mode if `jwt_secret` still equals its hardcoded default.

**Acceptance criteria:**
- [ ] `docker compose up` with no `.env` present fails clearly (missing env file) rather than silently starting with demo secrets
- [ ] README updated with the copy step

---

### D4 — `SECURITY.md` describes controls that don't exist

**File:** `docs/SECURITY.md`

**Problem:** The document claims container hardening (`uid=10001`, `read_only_rootfs: true` — not present in `docker-compose.yml` or the worker Dockerfile), secret redaction before writing findings to Postgres (no `redact`/`REDACT` logic anywhere in `backend/` or `scanner/`), and SSRF protection for "Git URL scan targets" — a feature that doesn't exist at all (the product only accepts zip uploads). This is the highest-reputational-risk item on this list: it's a security document making false claims about a security tool, and it's the first place a technically-minded judge would look to cross-check the code.

**Fix:** Choose one path per claim:
- **Implement it** (worth doing for container `uid`/read-only rootfs — cheap in `docker-compose.yml` and the Dockerfile), or
- **Remove the claim** (the Git-URL/SSRF section should be deleted entirely until/unless that feature is built; secret redaction should either be implemented — see note below — or removed from the doc).

Secret redaction is worth actually building regardless, independent of the doc: `evidence_snippet` currently stores raw matched text, which could include a real private key or credential if one is present in the scanned code. Add a redaction pass (e.g., truncate/mask anything matching a private-key or high-entropy-secret pattern) before the snippet is persisted.

**Acceptance criteria:**
- [ ] Every claim in `SECURITY.md` is either backed by code (link the relevant file/line) or removed
- [ ] If implemented: a test confirms a private key embedded in a fixture never appears in full in a stored `evidence_snippet`

---

### D5 — Default admin credentials

**File:** `backend/app/core/security.py::ensure_default_admin`

**Problem:** A user `admin@example.com` / `admin123` is created automatically on first boot with no mechanism to force a change.

**Fix:** On creation, either (a) generate a random password and print it once to the startup logs (never store it in code), forcing whoever deploys it to retrieve and change it, or (b) set a `must_change_password` flag that blocks all non-password-change API calls until cleared.

**Acceptance criteria:**
- [ ] Fresh deployment does not have a guessable, documented default password sitting in a public repo
- [ ] Login with the initial credential still works for the demo flow, just not with a value anyone could find on GitHub

---

### D6 — No login rate limiting

**File:** `backend/app/api/v1/auth.py::login`

**Problem:** No limiting or lockout on repeated failed attempts — combined with D5's known default email, this is brute-forceable.

**Fix:** Add a simple counter (in-memory dict is fine for a hackathon demo; Redis-backed for anything more durable) keyed by email or IP, e.g. 5 failed attempts → 60-second lockout with exponential backoff on repeat offenses.

**Acceptance criteria:**
- [ ] Automated test: 6th rapid failed login attempt for the same account is rejected before credentials are even checked
- [ ] Successful login is unaffected under normal use

---

### D7 — Token storage and revocation

**Files:** `frontend/src/lib/api.ts`, `frontend/src/app/login/page.tsx`, `backend/app/core/security.py`

**Problem:** The JWT is stored in `localStorage`, readable by any script that runs on the page — a single XSS bug anywhere in the frontend becomes a full account takeover. Tokens also can't be revoked; a stolen or leaked token remains valid for its full 24-hour life with no way to kill it.

**Fix:**
1. Move the token to an `httpOnly`, `Secure`, `SameSite=Lax` cookie set by the backend on login, so frontend JS never touches it directly.
2. Add a minimal revocation mechanism — a `token_version` column on `User`, bumped on logout/password change, embedded in the JWT payload and checked in `get_current_user`; bumping it invalidates every previously issued token instantly.
3. Shorten default expiry (e.g., 2 hours) and add a refresh flow if longer sessions are needed.

**Acceptance criteria:**
- [ ] Token is not accessible via `document.cookie` reads from arbitrary JS if `httpOnly` is set correctly (verify in browser devtools)
- [ ] Logging out invalidates the token for any future request, verified by a test that captures a token, logs out, and reuses the old token

---

### D8 — Overly broad CORS trust

**File:** `backend/app/main.py`

**Problem:** `allow_origin_regex=r"https://.*\.vercel\.app"` combined with `allow_credentials=True` trusts every Vercel-hosted subdomain, not just the team's own deployment — anyone who deploys their own app on `*.vercel.app` is a trusted credentialed origin as far as this API is concerned.

**Fix:** Replace the regex with an explicit list of the actual deployed frontend origin(s) via `backend_cors_origins` (the setting already exists and is unused for this purpose — the regex is layered on top of it unnecessarily).

**Acceptance criteria:**
- [ ] A request from an arbitrary `*.vercel.app` origin not in the explicit allowlist is rejected by CORS
- [ ] The actual production frontend origin still works

---

### D9 — Decorative RBAC

**File:** `backend/app/models/__init__.py` (`User.role`), all route handlers

**Problem:** Every user is created with `role="admin"` and nothing anywhere branches on the value — it's stored but never enforced. A field that looks like access control but isn't is arguably worse than no field at all, since it implies a guarantee the code doesn't provide.

**Fix:** Either remove the field until it's actually used, or pick one concrete restriction to enforce it with (e.g., only `admin` role can view scans belonging to other users, once D1's ownership model exists) so it does something real.

**Acceptance criteria:**
- [ ] `role` either gates at least one real behavior, or is removed from the schema and API responses

---

### D10 — Zip-bomb / decompression exhaustion

**File:** `scanner/detectors/pipeline.py::safe_extract_zip`, `unpack_nested_archives`

**Problem:** Zip-slip (path traversal) is correctly handled, but there's no cap on total decompressed size. `unpack_nested_archives` recurses two levels deep on top of that, so a small crafted upload containing nested zips can expand disproportionately on disk before any per-file size check applies.

**Fix:** Track a running total of bytes written during extraction across both `safe_extract_zip` and the nested-archive pass; abort the scan with a clear "archive too large when decompressed" error once a ceiling (e.g., 2–5× `scan_max_bytes`) is exceeded.

**Acceptance criteria:**
- [ ] A synthetic highly-compressed test archive is rejected before filling the work directory
- [ ] Normal-sized real-world archives are unaffected

---

### D11 — Unvalidated scan ID parsing

**Files:** `backend/app/api/v1/scans.py`, `backend/app/api/v1/reports.py` (every `uuid.UUID(scan_id)` call)

**Problem:** A malformed `scan_id` in the URL raises an unhandled `ValueError`, surfacing as a generic 500 instead of a clean 400.

**Fix:** Wrap each parse in a small helper (`parse_scan_id(scan_id: str) -> uuid.UUID`) that raises `HTTPException(400, "Invalid scan ID")` on failure, and use it everywhere `uuid.UUID(scan_id)` currently appears directly.

**Acceptance criteria:**
- [ ] Requesting `/scans/not-a-uuid` returns 400, not 500

---

### D12 — Unbounded pagination

**File:** `backend/app/api/v1/scans.py::list_artefacts`

**Problem:** `limit: int = 100` has no upper bound enforced — a caller can request an arbitrarily large page.

**Fix:** Add `Query(..., le=500)` (or similar) to cap it server-side regardless of what the client requests.

**Acceptance criteria:**
- [ ] A request with `limit=999999` is capped rather than honored literally

---

### D13 — Health endpoint information disclosure

**File:** `backend/app/main.py::health`

**Problem:** `status["database"] = f"error: {exc}"` returns the raw exception string (potentially including connection strings or internal paths) to any caller, unauthenticated.

**Fix:** Return a generic `"error"` string in the response; log `str(exc)` server-side only.

**Acceptance criteria:**
- [ ] `/health` never returns exception detail in its response body
- [ ] The same detail is still visible in server logs for debugging

---

## 4. Proposed version sequence

| Version | Contents | Theme |
|---|---|---|
| v2.0.0 | D1–D4 | "Close the access-control and secrets gaps that a judge could find in five minutes" |
| v2.1.0 | D5–D9 | "Auth hardening: credentials, tokens, CORS, and making RBAC real or removing it" |
| v2.2.0 | D10–D13 | "Input and resource hardening" |

## 5. Release sign-off checklist (per version)

- [ ] All acceptance criteria above checked for items included in this version
- [ ] Cross-user isolation test suite passes (D1, D2)
- [ ] `docker compose up` from a clean checkout never starts with a value that appears verbatim in `.env.example` (D3)
- [ ] `docs/SECURITY.md` claims verified against code, line by line (D4)
- [ ] Full test suite (`backend/tests/`) green in CI
- [ ] No known-default credential or secret string appears in any file tracked by git

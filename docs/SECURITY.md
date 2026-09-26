# ECDAT — Security Model & Threat Mitigation

**Document Version:** 2.0.0  

This document describes mitigations that exist in the current codebase. Claims without an implementation reference have been omitted.

---

## 1. Security philosophy

ECDAT accepts untrusted zip archives uploaded by users and runs static analysis on extracted files. The platform limits path traversal during extraction, avoids shell-based subprocess invocation for external tools, and redacts PEM private-key material from stored evidence snippets before persisting artefacts.

---

## 2. Threat model & mitigations

| Threat vector | Mitigation (as implemented) | Code reference |
|---------------|-----------------------------|----------------|
| **Zip-slip / path traversal** | Each zip member is resolved under the extraction root; entries that escape the destination raise `ValueError("Zip slip detected")`. | `scanner/detectors/pipeline.py` (`safe_extract_zip`) |
| **Command injection via CLI wrappers** | Semgrep, `strings`, and similar tools are invoked with argument lists (default `shell=False`). | `scanner/detectors/semgrep_detector.py`, `scanner/detectors/binary_detector.py` |
| **Private key material in API data** | PEM `PRIVATE KEY` blocks in `evidence_snippet` are replaced with `[REDACTED PRIVATE KEY]` before artefacts are written to the database. | `backend/app/core/redact.py`, `backend/app/services/scan_service.py` |
| **Health endpoint information disclosure** | `/health` reports `error` for failed database or Redis checks; exception details are logged server-side only. | `backend/app/main.py` (`health`) |

**Out of scope for this release:** Git URL scanning (upload-only), container hardening (`read_only_rootfs`, fixed non-root UID), and isolated worker networks without egress are not configured in the current `docker-compose.yml`.

**Deployment secrets:** Docker Compose loads variables from `.env` (git-ignored). Copy from `.env.example` and replace all secrets before deploying beyond a local demo. See `README.md` (Quick Start) and `.env.example`.

---

## 3. Vulnerability disclosure

If you discover a potential security flaw in ECDAT, please report it via encrypted email to:

- **Security contact:** `security@ecdat.local` / `mavericks-sih@ntro.gov.in`

Please do not disclose vulnerabilities publicly until a patch has been released.

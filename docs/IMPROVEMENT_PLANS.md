# ECDAT improvement plans (index)

Two parallel roadmaps split **analysis engine** work from **application security & deployment** work. Baseline: API version `1.0.0` in `backend/app/main.py`.

| Document | Scope | First milestone |
|----------|--------|-----------------|
| [`ECDAT_v1.1_Engine_Improvement_Plan.md`](ECDAT_v1.1_Engine_Improvement_Plan.md) | Detection, risk, Mosca, PQC, CBOM, accuracy, optional AI narration (E1–E10) | **v1.1.0** — E1–E4 correctness & transparency |
| [`ECDAT_v2_Website_Deployment_Improvement_Plan.md`](ECDAT_v2_Website_Deployment_Improvement_Plan.md) | Auth, IDOR, WebSocket, secrets, CORS, zip bombs (D1–D13) | **v2.0.0** — D1–D4 judge-visible security gaps |

## Suggested execution order before SIH finals

1. **v2.0.0 (D1–D4)** — IDOR and unauthenticated WebSocket are the fastest way to lose credibility in a security demo.
2. **v1.2.0 E8** — Container image scanning is called out in the PRD and `WINNING_GUIDE.md` as a likely judge expectation.
3. **v1.1.0 (E1–E4)** — Low-risk engine fixes plus `RISK_MODEL.md` for Q&A.
4. **v1.3.0 E9** — Scan diff for “migration progress” storytelling.
5. **v1.4.0 E10** — Only if time remains; keep feature-flagged off by default.

Track acceptance criteria in each document’s §5 checklists when cutting a release.

## Implementation status (parallel agent pass — 2026-09-26)

| Track | Items | Status |
|-------|--------|--------|
| Engine v1.1 | E1–E4 | Implemented (`canonicalize_algorithm`, PQC primitive fallback, `docs/RISK_MODEL.md`) |
| Engine v1.2 | E5–E8 | Implemented (labels, `c-crypto.yaml`, container `.tar`, E7 in `ACCURACY.md`) |
| Engine v1.3 | E9 | Implemented (diff API + scan detail UI) |
| Engine v1.4 | E10 | **Implemented** (Groq narration/chat, `AI_NARRATION_ENABLED`, grounding checks) |
| Security v2.0 | D1–D4 | Implemented (ownership, WS JWT, `.env`, `SECURITY.md`, redaction, health) |
| Security v2.1 | D5–D9 | Implemented (admin password, rate limit, CORS, `token_version` + logout, admin list) |
| Security v2.2 | D10–D13 | Implemented (decompress budget, `parse_scan_id`, artefact limit cap) |

**Verification:** `cd backend && PYTHONPATH=.. pytest tests -q` → 51 passed. API version bumped to `2.0.0`.

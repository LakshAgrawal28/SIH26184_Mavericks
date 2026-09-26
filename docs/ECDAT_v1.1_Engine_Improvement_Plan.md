# ECDAT — Engine & Pipeline Improvement Plan

**Scope:** detection engine, risk-scoring model, Mosca timeline, PQC recommendation engine, CBOM mapping layer, accuracy validation, and the proposed AI narrative/comparison layer.
**Out of scope (tracked separately):** authentication, multi-tenancy, deployment, and general web-app hardening — see the security follow-up notes from the earlier review instead.
**Current baseline:** app version `1.0.0` (`backend/app/main.py`)

---

## 1. Why this document exists

Every scoring, timing, and recommendation decision ECDAT makes today is a hardcoded lookup table or an if/else chain — confirmed by inspecting `taxonomy.py`, `risk_engine.py`, `mosca_engine.py`, `pqc_engine.py`, and `cbom/crypto_map.py`, and by the absence of any ML library in `requirements.txt`. That is the *correct* architecture for this domain (deterministic, auditable, reproducible — exactly what a defense-context CBOM tool needs), so nothing here proposes replacing it with a model. This document tracks:

- Correctness bugs in the existing rule-based logic
- Places where "hardcoded" has drifted into "fragile" (silent fallback instead of visible failure)
- Capability gaps against the project's own PRD/problem-statement requirements
- The scope and guardrails for the one new AI-assisted feature that's actually justified: a narration/comparison chat layer that sits **on top of** the deterministic engine and never inside its decision path

---

## 2. Summary of changes

| ID | Area | Current state | Change | Priority | Target version |
|----|------|---------------|--------|----------|-----------------|
| E1 | Algorithm name matching | Substring match against ~50-entry dict, silent `5.0`/`10.0` fallback | Canonicalize once, log unmapped algorithms | High | v1.1.0 |
| E2 | PQC recommendation fallback | Defaults to ML-KEM regardless of primitive type | Branch on `primitive` (KEM vs signature vs hash) before fallback | High | v1.1.0 |
| E3 | Risk formula transparency | Hardcoded weights with no cited rationale | Document rationale inline + in `CRYPTO_CHEAT_SHEET.md` | Medium | v1.1.0 |
| E4 | Mosca Z-value sourcing | Fixed constants (15/10/5/7 years), no citation | Cite source (e.g. GRI quantum-threat survey) or clearly label as internal estimate | Medium | v1.1.0 |
| E5 | Binary detection method | `strings`-style literal name matching only | Explicitly scope/label as "readable strings," add constant-table detection as stretch goal | Medium | v1.2.0 |
| E6 | Source-language coverage | Real AST rules only for Java/Python/JS/TS/partial Go | Add a C/OpenSSL Semgrep rule pack | High | v1.2.0 |
| E7 | Accuracy validation | Recall measured only against self-authored fixtures | Run against one real, unmodified external repo; publish precision estimate | High | v1.2.0 |
| E8 | Container scanning | `target_type` field exists but is never branched on; no `.tar`/OCI support | Implement Docker-image-tar ingestion into the existing pipeline | Critical | v1.2.0 |
| E9 | Scan comparison / trend | Each scan is an isolated snapshot; no diff, no history | Deterministic scan-to-scan diff engine + trend endpoint | High | v1.3.0 |
| E10 | AI narrative/chat layer | Not present | Optional, bounded LLM layer for narration and Q&A over deterministic data only | Nice-to-have | v1.4.0 (flagged) |

---

## 3. Detailed changes

### E1 — Algorithm name canonicalization

**File:** `backend/app/engines/taxonomy.py::get_qv()`

**Problem:** Quantum-vulnerability lookup is done by substring-matching a detector's raw output string against dictionary keys (`k in key or key.startswith(k)`), then falling back to a generic `5.0` (or `10.0` for anything containing "RSA/EC/ED25519/X25519") if nothing matches — silently, with no record that a fallback was used. The same pattern repeats in `pqc_engine.py::recommend()` and `cbom/crypto_map.py::map_primitive()`.

**Fix:**
1. Introduce a single `canonicalize_algorithm(raw: str) -> str` function used by every detector before a finding is written to the database, so all three downstream consumers (risk engine, PQC engine, CBOM mapper) work off one normalized value instead of three independent guesses.
2. When no canonical match is found, set an explicit `unmapped: true` flag on the artefact (new column or metadata field) instead of silently defaulting.
3. Surface unmapped findings in the dashboard as "needs manual review" rather than presenting a confident-looking score for something the tool didn't actually recognize.

**Acceptance criteria:**
- [ ] Unit test: an algorithm string not in any lookup table produces a flagged, visibly-marked finding, not a silent default score
- [ ] Unit test: known name variants (`aes-256-cbc`, `AES256`, `RSA-PSS`) resolve to the same canonical form
- [ ] No behavior change for already-recognized algorithms

---

### E2 — PQC recommendation primitive mismatch

**File:** `backend/app/engines/pqc_engine.py::recommend()`

**Problem:**
```python
if risk_band in ("CRITICAL", "HIGH"):
    return "Migrate", "ML-KEM-768", "X25519MLKEM768", ...
```
This fallback fires for *any* unrecognized algorithm at CRITICAL/HIGH risk, regardless of whether the underlying primitive is a key-exchange mechanism, a signature scheme, or a hash. Recommending a KEM replacement for a broken signature algorithm is factually wrong migration guidance.

**Fix:** Check the finding's `primitive` field (already captured on the `Artefact` model) before selecting a fallback:
- `primitive == "signature"` → fallback to `ML-DSA-65` / FIPS 204
- `primitive in ("kem", "key-agree", "pke")` → fallback to `ML-KEM-768` / FIPS 203
- `primitive == "hash"` → fallback to "review manually," no PQC primitive applies
- otherwise → keep current generic "Monitor / review manually" behavior

**Acceptance criteria:**
- [ ] Unit test: an unrecognized signature algorithm at CRITICAL risk never receives an ML-KEM recommendation
- [ ] Existing recognized-algorithm test cases (`test_engines.py`) still pass unchanged

---

### E3 — Risk formula rationale

**File:** `backend/app/engines/risk_engine.py::compute_risk()`

**Problem:** Weights (`0.6` HNDL / `0.4` operational, `asym_factor = 1.5`, complexity multipliers, band cutoffs `7.5/5.5/3.5`) are defensible as a heuristic but currently uncited anywhere.

**Fix:** No code change required — add a short rationale block to `docs/CRYPTO_CHEAT_SHEET.md` (or a new `docs/RISK_MODEL.md`) explaining why HNDL is weighted higher than operational risk (harvest-now-decrypt-later is the primary quantum threat vector for long-lived data) and why the band cutoffs sit where they do. This turns a "why these numbers" question from a weakness into a prepared talking point.

**Acceptance criteria:**
- [ ] `docs/RISK_MODEL.md` exists and is linked from the README
- [ ] Formula in the doc matches the formula in code (add a CI check comparing the two if feasible)

---

### E4 — Mosca Z-value sourcing

**File:** `backend/app/engines/taxonomy.py::MOSCA_SCENARIOS`

**Problem:** `{"Optimistic": 15, "Baseline": 10, "Aggressive": 5, "Regulatory": 7}` — years-to-CRQC estimates with no cited source.

**Fix:** Either cite a real source (e.g., the Global Risk Institute's annual quantum-threat expert survey, or NIST IR 8547's timeline) and adjust constants to match, or explicitly document them in `docs/RISK_MODEL.md` as "internal planning estimates, not a specific external forecast" so the team has an honest, prepared answer either way.

**Acceptance criteria:**
- [ ] Source (or explicit "internal estimate" framing) documented alongside the constants in code comments and in `docs/RISK_MODEL.md`

---

### E5 — Binary detection scoping

**File:** `scanner/detectors/binary_detector.py`

**Problem:** Detection is `strings`-style regex matching for literal algorithm names (`RSA|AES|DES|...`) inside binary files. This finds almost nothing in stripped production binaries, where such names don't appear as readable text — it mainly works on debug builds, Java `.class`/`.pyc`, and JS bundles.

**Fix (v1.2.0, stretch):**
1. Immediate: relabel this capability precisely in the UI/docs as "binary string scanning," not "binary crypto analysis," to avoid overclaiming.
2. Stretch goal if time allows: add constant-table fingerprinting (e.g., detecting the AES S-box byte sequence or SHA-256 round constants as raw bytes) as a second, independent binary detection method — this works even on stripped binaries and is a genuine differentiator few competing tools implement at hackathon scope.

**Acceptance criteria:**
- [ ] Documentation and UI copy accurately describe the current method's scope and limitations
- [ ] (Stretch) at least one constant-table fingerprint implemented and covered by a corpus fixture

---

### E6 — C/OpenSSL detection coverage

**Files:** `scanner/rules/*.yaml`

**Problem:** Real AST-level Semgrep rules exist only for Java, Python, JS/TS, and partial Go. C/C++, .NET, PHP, Ruby, and Rust are covered only by the shallow regex/filename catalog layer (`scanner/catalog/signatures.py`), not source parsing — despite the README implying broad "10+ ecosystem" support at equal depth.

**Fix:** Add `scanner/rules/c-crypto.yaml` covering common OpenSSL EVP-layer calls (`EVP_EncryptInit_ex`, `RSA_generate_key`, `SHA1_Init`, `DES_set_key`, etc.). Prioritized over other languages because NTRO's likely legacy/government stack skews C/C++.

**Acceptance criteria:**
- [ ] New rule file with at least 5 distinct detection patterns
- [ ] Corpus fixture (`scanner/corpus/c-openssl/`) added with matching entries in `scanner/accuracy/expected.json`
- [ ] Accuracy suite still reports 0 invented algorithms after the addition

---

### E7 — Real-world accuracy validation

**Files:** `scanner/accuracy/measure.py`, `docs/ACCURACY.md`

**Problem:** Published accuracy ("23/23 checks, 0 invented, deterministic") is measured only against fixtures the team wrote and labeled itself — recall on your own test set, not a measure of real-world precision or false-positive rate.

**Fix:** Run the full pipeline once against a real, unmodified, moderately-sized open-source repository not used to design any detector (e.g., a public Spring Boot or Express service). Manually review a sample of findings and report an approximate precision figure alongside the existing recall number.

**Acceptance criteria:**
- [ ] `docs/ACCURACY.md` includes a "real-world validation" section with repo name, finding count, and manually-reviewed precision estimate
- [ ] No detector changes made specifically to improve this number after the fact (would defeat the purpose)

---

### E8 — Container image scanning (Critical)

**Files:** `backend/app/api/v1/scans.py`, `scanner/detectors/pipeline.py`

**Problem:** `target_type` is stored on every scan (`"zip_archive"` etc.) but never branched on anywhere in the code. `NESTED_ARCHIVE_EXTS = {".zip", ".jar", ".war", ".ear"}` has no `.tar` entry, so a Docker image export is invisible to the scanner. This is listed as **P1** in the project's own `docs/PRD.md` (FR-16: "System scans Docker container images") and is explicitly called out in `docs/WINNING_GUIDE.md` as an instant-rejection risk if missing — it is currently unbuilt.

**Fix:**
1. Accept a `.tar` produced by `docker save` as an upload target.
2. Untar the outer archive; each layer inside is itself a `.tar` — untar each layer into a merged filesystem view (later layers override earlier ones, standard OCI layering).
3. Run the *existing* detection pipeline unchanged against the merged filesystem — no new detector logic needed, this is purely an ingestion-format addition.
4. Update `target_type` to actually route to this path when set to `"container_image"`.

**Acceptance criteria:**
- [ ] A `docker save`-produced tar of a sample image with a known embedded crypto artefact (e.g., a baked-in TLS cert) produces the expected finding
- [ ] Existing zip-upload path is unaffected
- [ ] `test_moat.py`-style test added for the container path specifically

---

### E9 — Scan comparison and migration-progress tracking

**Files:** new — `backend/app/api/v1/scans.py` (new endpoint), `backend/app/models/__init__.py` (optional `parent_scan_id` on `Scan`)

**Problem:** Every scan is an isolated report. There is no way to show that re-scanning the same codebase after remediation reduced the CRITICAL count or moved the Mosca category from EXPIRED to PLAN — despite the PRD listing "risk trend" as a dashboard KPI.

**Fix:**
1. Add an optional `parent_scan_id` to `Scan`.
2. New endpoint `GET /scans/{scan_id}/diff?against={other_scan_id}` returning: artefacts added, artefacts removed, artefacts whose risk band changed, and the before/after Mosca category.
3. Dashboard view showing this diff visually (e.g., a simple "12 CRITICAL → 4 CRITICAL" delta card).

This is entirely deterministic — no model involved — and it directly enables E10 below.

**Acceptance criteria:**
- [ ] Diff endpoint returns correct added/removed/changed sets for two scans of slightly different versions of the same fixture
- [ ] Dashboard renders the delta without requiring the AI layer to be enabled

---

### E10 — AI narrative and comparison chat layer (optional, feature-flagged)

**Status:** Proposed, not yet built. Ships disabled by default; the tool must be fully functional with this off (preserves the air-gapped/offline deployment story).

**Explicit scope boundary — read this before implementing anything:**

| Allowed | Not allowed |
|---|---|
| Narrating already-computed findings, scores, and diffs in plain English | Deciding what counts as a finding |
| Answering questions about a scan or a scan-to-scan diff (E9) | Computing or adjusting a risk score, Mosca category, or PQC recommendation |
| Drafting an executive-summary paragraph from structured data | Reading raw source code as its primary input |

**Architecture:**
1. **No RAG / no vector store.** A scan's findings are a few hundred structured rows — they fit directly in a prompt. Pull the exact rows from Postgres and serialize them as compact structured context. This is more accurate than retrieval for this data size and avoids an entire class of "the retriever missed the relevant finding" bugs.
2. **Diff-first for comparisons.** For "compare scan A to scan B," always run the deterministic diff (E9) first and hand the LLM the *computed diff*, not the two raw finding sets — never ask the model to compute the comparison itself.
3. **Prompt injection guarding (required, not optional).** `evidence_snippet` is a literal excerpt of attacker-controlled uploaded code. Before any snippet reaches a prompt: wrap it in an explicit, clearly delimited block with a system instruction stating that content inside the block is data to describe, never instructions to follow. Prefer passing only structured fields (algorithm, path, score, band) to the model and reserve raw snippets for cases where they're genuinely needed for the answer.
4. **Grounding check.** Every model response should be checked against the underlying deterministic data before being shown — e.g., if the model states a risk band, it must match the actual stored `risk_band` for that artefact, or the response is rejected/regenerated. This prevents the narration layer from silently drifting away from ground truth.
5. **Offline fallback.** If the LLM endpoint is unreachable (air-gapped deployment, demo without internet), the deterministic tables and CBOM export remain fully functional; only the narration/chat panel degrades to "unavailable," never blocking core functionality.

**Acceptance criteria:**
- [ ] Feature flag exists; entire tool passes existing test suite with the flag off
- [ ] A test case with an injection attempt embedded in a fixture's evidence snippet does not alter the model's stated risk assessment for that finding
- [ ] Chat responses are checked against underlying `Artefact` rows before being returned; a deliberately mismatched test case is caught
- [ ] UI visually distinguishes "AI-generated narrative" from the deterministic findings table

---

## 4. Proposed version sequence

| Version | Contents | Theme for presentation |
|---|---|---|
| v1.1.0 | E1–E4 | "Correctness and transparency pass on the existing engine" |
| v1.2.0 | E5–E8 | "Coverage expansion + closing the container-scanning gap" |
| v1.3.0 | E9 | "Migration-progress tracking, not just point-in-time snapshots" |
| v1.4.0 | E10 (flagged off by default) | "Optional AI narration layer, strictly bounded to presentation, never detection" |

## 5. Release sign-off checklist (per version)

- [ ] All acceptance criteria above checked for items included in this version
- [ ] `scanner/accuracy/measure.py` still reports 0 invented algorithms
- [ ] `docs/ACCURACY.md`, `docs/RISK_MODEL.md`, and `docs/PRD.md` updated to reflect actual current capability (no doc/code mismatches)
- [ ] Full test suite (`backend/tests/`) green in CI
- [ ] If E10 is included: flag defaults to off, and a full pipeline run with the flag off passes every test that a run with it on passes

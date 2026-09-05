# Brief 5 — Dashboard and live demo

**Reader:** Person 5 (UI + live demo driver)  
**Read time:** ~10 minutes  
**You own:** Hands on the laptop. Everyone else talks; you click.

---

## Screens (Next.js, `frontend/src/app`)

| Route | Purpose |
|-------|---------|
| `/login` | JWT; stored in the browser for `apiFetch` |
| `/dashboard` | Totals, corpus accuracy blurb, recent scans, sample zip paths |
| `/scans/new` | Name, zip upload, X and Y sliders, Mosca preview, Start Scan |
| `/scans/[id]` | Tabs: Overview · Artefacts · Mosca · Recommendations · Export CBOM |

API base comes from `frontend/.env.local` (`NEXT_PUBLIC_API_URL`, usually `http://localhost:8000`).

---

## Five-minute demo script (do not improvise the zip)

**Prep (before judges walk in)**

- API: `bash scripts/dev-api.sh` or the uvicorn command with `SYNC_SCAN=true`.  
- UI: `cd frontend && npm run dev` (port 3000).  
- Zip ready: **`scanner/corpus/archives/mixed-enterprise.zip`**  
  If missing: `python scanner/scripts/build_corpus_zips.py`  
- Logged in. Do **not** upload a random GitHub project or the whole repo.

**0:00 Login & dashboard**  
Show total scans / critical / high. Mention published accuracy (recall 1.0, 0 invented algorithms) if the card is visible.

**0:30 New Scan**  
Name: `mixed-enterprise-demo`.  
File: **mixed-enterprise.zip only**.  
Leave X=10, Y=4 so \(X+Y=14 > Z=10\). Start Scan.

**1:15 Progress**  
Status goes queued → running → completed. Stage text updates. If it finishes instantly (sync mode), that is fine — say “same pipeline, in-process for the laptop.”

**1:45 Overview**  
Files small (about 7), artefacts **non-zero** (tens). Critical/high &gt; 0. **CBOM VALID 1.6** badge.

**2:00 Artefacts**  
Filter Critical. Open a row: path like `src/CryptoService.java`, snippet `RSA/ECB`, confidence, detection method.

**2:30 Mosca**  
Point at EXPIRED: 10+4 vs Z=10. Drag X/Y until the badge moves (e.g. lower X so margin turns positive). Save if you want to show persistence.

**3:30 Recommendations**  
RSA → ML-KEM + hybrid; TLS 1.0 → TLS 1.3; call out FIPS 203/204.

**4:15 Export CBOM**  
Click Export CBOM. Download JSON. Optional: open it and show `"bomFormat": "CycloneDX"`, `"specVersion": "1.6"`, `"type": "cryptographic-asset"`.

**If anything is empty:** you uploaded the wrong zip. Stop, go New Scan, use mixed-enterprise. Do not debug 1111-file archives live.

---

## What empty UI means (so you don’t freeze)

The yellow box:

> The archive was unpacked (N files) but no crypto APIs, certificates, TLS configs, or binaries matched.

Means the **scan finished**. Inventory and recommendations stay empty by design. Dashboard still lists the scan (`demo-scan`, 0 artefacts).

Wrong zip examples we already hit: 80 files / 0 hits; **1111 files / 0 hits**. Right zip: **7 files / 31 artefacts**.

---

## UX details worth a sentence

- Progress: HTTP poll 800 ms + WebSocket; poll is enough if WS drops.  
- Mosca sliders are live; they do not wait for a rescan.  
- Artefact search + risk filter are client-side.  
- Dark dashboard, risk badges, CBOM pill — screenshot these for the PPT if the live net fails.

---

## Backup if live demo dies

1. Screenshots / recording of a completed mixed-enterprise scan.  
2. Pre-exported `ecdat-cbom-*.json`.  
3. `curl` health + `GET /api/v1/accuracy`.  
4. Show `scanner/corpus/mixed-enterprise/` source in the editor.

---

## One sentence for judges

*“The dashboard is for a security lead: one upload, evidence-backed inventory, a Mosca calendar, a PQC action list, and a file they can hand to an auditor.”*

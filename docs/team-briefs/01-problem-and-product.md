# Brief 1 — Problem and product

**Reader:** Person 1 (opening speaker / product)  
**Read time:** ~10 minutes  
**You own:** Slides 1–2, 9–10, and the “why this matters” story.

---

## Who we are pitching to

- **Event:** Smart India Hackathon 2026  
- **Problem ID:** 26164  
- **Org:** National Technical Research Organisation (NTRO)  
- **Team:** Mavericks  
- **Product:** ECDAT — Enterprise Cryptographic Discovery & Analysis Tool  

NTRO needs an **on-premise** way to find cryptography across code, configs, certificates, and binaries, then plan a **post-quantum** migration. Cloud-only SaaS is a poor fit for classified / air-gapped work.

---

## The crisis in four sentences

1. A cryptographically relevant quantum computer (CRQC) running **Shor’s algorithm** will break public-key crypto: **RSA, ECDH, ECDSA, DSA**.
2. **Harvest Now, Decrypt Later (HNDL):** adversaries copy ciphertext **today** and wait. Long-lived government data is already at risk.
3. NIST and similar programs push PQC (ML-KEM, ML-DSA, SLH-DSA) on a 2030–2035 clock.
4. Enterprises cannot migrate what they cannot **see**. Inventory is the blocker, not the math.

Say this line out loud:  
**“You cannot migrate what you cannot see.”**

---

## What ECDAT does (the value chain)

Existing tools (for example IBM CBOMkit) often stop at a raw inventory dump.

ECDAT does the full chain:

1. **Discover** cryptographic artefacts (algorithms, libraries, certs, TLS configs, binary strings).  
2. **Score** quantum + operational risk (HNDL vs classical weakness).  
3. **Timeline** with **Mosca’s theorem**: if data lifetime \(X\) plus migration time \(Y\) exceeds CRQC arrival \(Z\), confidentiality is already expired.  
4. **Recommend** NIST PQC / hybrid pairs (e.g. RSA → ML-KEM-768 + X25519MLKEM768).  
5. **Export** a standards **CycloneDX 1.6 CBOM** (ECMA-424 cryptographic-asset schema).

Pitch sentence:  
*“Point ECDAT at a zip of your systems. It finds every algorithm, key, certificate, and library it can prove, computes quantum vulnerability and Mosca timelines, and tells you the exact PQC replacement.”*

---

## What is actually built (MVP)

| Area | Status |
|------|--------|
| FastAPI + JWT login | Done |
| Detectors: Semgrep rules, source regex, certs, TLS configs, binaries | Done |
| Risk + Mosca + PQC engines | Done |
| Next.js dashboard (scan, inventory, Mosca sliders, CBOM export) | Done |
| Docker Compose **or** local `SYNC_SCAN=true` (no Celery needed) | Done |
| Deterministic corpus accuracy scoreboard | Done |

Not a research paper. A working upload → scan → inventory → Mosca → CBOM loop.

---

## What we are *not*

- Not a CVE scanner (Trivy / SonarQube find **bugs**; we find **crypto usage**).  
- Not an LLM classifier (findings must be **deterministic and evidence-backed** for NTRO).  
- Not a magic unpacker of every language or `.class` bytecode. Empty scans usually mean the zip had no matching APIs/certs/configs — not that the app “failed.”

---

## Feasibility talking points (your closing)

- **Air-gap first:** no required external APIs.  
- **One-command deploy:** `docker compose up` or `scripts/dev-api.sh`.  
- **Horizontal scale later:** Celery workers + Redis in the full stack.  
- **Standard output:** CycloneDX 1.6 so other gov tools can ingest the CBOM.

Close with:  
*“ECDAT moves NTRO from quantum blindness to a concrete, standards-based migration plan.”*

---

## What you should ask the other five

- Person 2: “Walk the request from upload to database.”  
- Person 3: “What layers fire on mixed-enterprise.zip?”  
- Person 4: “Why do X=10, Y=4, Z=10 show EXPIRED?”  
- Person 5: “What exact clicks do we do in five minutes?”  
- Person 6: “How do we prove we did not invent algorithms?”

# Brief 4 — Risk, Mosca, and PQC

**Reader:** Person 4 (crypto theory / engines)  
**Read time:** ~12 minutes  
**You own:** Slides on quantum risk, Mosca’s theorem, NIST PQC recommendations.

---

## After discovery, three engines run on each artefact

Code: `backend/app/engines/` (`risk_engine.py`, `mosca_engine.py`, `pqc_engine.py`, `taxonomy.py`).

---

## 1. Composite risk (0–10)

Two ideas blended:

**HNDL (harvest now, decrypt later)**  
Public-key algorithms (RSA, ECDH, ECDSA) used to protect data that must stay secret for many years are urgent **now**, even before a quantum computer exists.

**Operational risk**  
Classical weakness: MD5, SHA-1, TLS 1.0, `InsecureSkipVerify`, RSA/ECB, certs expiring in &lt;30 days.

Inputs include algorithm, mode (e.g. ECB), scan context (sensitivity, data lifetime \(X\), exposure, business criticality), detector confidence, asset type, cert days-to-expiry.

Output:

- `hndl_risk`, `operational_risk`, `final_risk_score`  
- **Band:** CRITICAL / HIGH / MEDIUM / LOW  

Dashboard cards sum CRITICAL and HIGH counts for the scan.

---

## 2. Mosca’s theorem

\[
\text{If } X + Y > Z \text{ then confidentiality is already expired.}
\]

| Symbol | Meaning | In the UI |
|--------|---------|-----------|
| \(X\) | How many years the data must stay secret | “Data lifetime” slider |
| \(Y\) | Years to finish migration | “Migration time” slider |
| \(Z\) | Years until a CRQC is assumed | Scenario presets |

**Default demo:** \(X=10\), \(Y=4\) → need **14 years**. Baseline \(Z=10\) → margin \(-4\) → **EXPIRED**.

Categories (`classify_margin`):

| Category | When |
|----------|------|
| EXPIRED | margin &lt; 0 (\(X+Y > Z\)) |
| URGENT | 0 ≤ margin &lt; 2 years |
| PLAN | margin OK but final risk ≥ 5.5 |
| MONITOR | otherwise |

Scenarios (names live in taxonomy): Optimistic / Baseline / Aggressive / Regulatory (different \(Z\)). Worst category across scenarios is the headline; **Baseline** is what leaders quote.

Sliders call `GET /scans/{id}/mosca?x=&y=` for a live recompute; **Save** writes X/Y via `PUT .../context`.

Spoken line:  
*“Mosca says if your secrets outlive your migration, you are already too late under harvest-now-decrypt-later.”*

---

## 3. PQC recommendations (NIST 2024)

Map legacy → primary PQC + optional **hybrid** (classical + PQC so both must break).

| Legacy family | Primary | Hybrid (typical) | NIST |
|---------------|---------|------------------|------|
| RSA / ECDH (key exchange) | ML-KEM-768 | X25519MLKEM768 | FIPS 203 |
| RSA / ECDSA signatures | ML-DSA-65 | hybrid as mapped | FIPS 204 |
| Long-term / archival sigs | SLH-DSA | — | FIPS 205 |
| AES-128 | AES-256-GCM | — | SP 800-38D |
| MD5 / SHA-1 | SHA-256 | — | FIPS 180-4 |
| TLS 1.0 / 1.1 | TLS 1.3 + ML-KEM | — | FIPS 203 |

Actions: **Migrate**, **Harden**, **Monitor**, **Keep**.  
High/critical bands get **IMMEDIATE** urgency.

Hybrids matter for the transition decade: if PQC has a surprise break, X25519 still holds, and vice versa.

Unknown algorithms with high risk fall back to “Migrate toward ML-KEM-768” rather than inventing a fantasy cipher.

---

## How this shows in the product

- Overview: critical / high counts from bands.  
- Artefacts table: score + band + evidence.  
- Mosca tab: formula, sliders, scenario table, EXPIRED badge.  
- Recommendations tab: de-duplicated migrate/harden actions (pure “Keep” is hidden).

If artefacts = 0, Mosca still runs with max risk 0 — **empty inventory means no migration list**. Always demo a corpus zip first.

---

## Theory you must not mix up

- **Shor** breaks RSA/ECC (asymmetric).  
- **Grover** weakens symmetric (AES-128 → prefer AES-256); it does not “kill AES” the way Shor kills RSA.  
- **CBOM** is inventory format; **Mosca** is timeline; **FIPS 203/204/205** are algorithms. Three different layers.

---

## One sentence for judges

*“We score what is quantum-fragile versus classically broken, apply Mosca’s X+Y versus Z so leadership sees calendar risk, and map each hit to a named NIST PQC or hybrid control.”*

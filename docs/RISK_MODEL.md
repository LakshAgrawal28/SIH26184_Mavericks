# ECDAT Risk Model

This document describes the deterministic risk formula in `backend/app/engines/risk_engine.py` and the Mosca timeline scenarios in `backend/app/engines/taxonomy.py`. It matches the code as of v1.1.0.

## Composite risk score

For each artefact:

1. **Quantum vulnerability (QV)** — from `get_qv()` / `ALGORITHM_QV` in `taxonomy.py` (0 = PQC-safe, 10 = fully Shor-vulnerable asymmetric or broken primitive).
2. **Classical weakness** — from `get_classical_weakness()` for mode/name combinations (e.g. ECB, weak key sizes).

### Harvest-now, decrypt-later (HNDL)

```
hndl = qv × (sensitivity/10) × min(lifetime_years/10, 3) × (exposure/10) × asym_factor
hndl = min(hndl, 10)
```

- **Why HNDL is weighted 60% in the final score:** Long-lived confidential data protected by asymmetric or weak crypto is the primary quantum threat in enterprise settings (harvest now, decrypt later). Operational issues matter, but timeline × exposure drives urgency for migration planning.
- **`asym_factor = 1.5`** when `asset_type` is `algorithm` or `certificate` and `qv ≥ 8`, else `1.0`. Amplifies Shor-vulnerable public-key use where HNDL applies most.

### Operational risk

```
operational = 0.4×qv + 0.2×classical + 0.2×(exposure/10)×10 + 0.2×(criticality/10)×10
complexity = 5 if qv ≥ 8 else 3
operational ×= 1 + complexity/20
operational = min(operational, 10)
```

Operational terms capture exposure, business criticality, and classical crypto weakness alongside quantum exposure.

### Final score and bands

```
final = min(10, (0.6 × hndl + 0.4 × operational) × confidence)
```

Certificates may multiply `final` by an expiry urgency factor from `cert_expiry.py`.

| Band | Threshold |
|------|-----------|
| CRITICAL | final ≥ 7.5 |
| HIGH | final ≥ 5.5 |
| MEDIUM | final ≥ 3.5 |
| LOW | otherwise |

Cutoffs are heuristic tiers for triage and dashboard grouping; they align with NTRO-style “act now / plan / monitor” workflows rather than a formal standard.

## Mosca inequality scenarios

Mosca’s inequality uses **x** (data lifetime), **y** (migration time), and **z** (years until a cryptographically relevant quantum computer). ECDAT compares `x + y` to `z` per scenario.

| Scenario | Z (years) | Role |
|----------|-----------|------|
| Optimistic | 15 | Slow quantum progress; longest planning horizon |
| Baseline | 10 | Mid-range planning default |
| Aggressive | 5 | Early CRQC assumption; stress test |
| Regulatory | 7 | Policy-driven migration window (internal planning estimate) |

**Source note:** These Z values are **internal planning estimates** for scenario comparison in demos and migration workshops. They are informed by public PQC migration guidance (e.g. NIST IR 8547 on transition planning) but are **not** copied from a single published CRQC forecast. Replace or recalibrate when the team adopts an official organizational threat model.

## Unmapped algorithms (v1.1)

When `canonicalize_algorithm()` does not match the taxonomy, findings still receive heuristic QV scores where applicable, but `raw_metadata.unmapped = true` is set at scan time so the UI can flag “needs manual review” instead of implying full taxonomy coverage.

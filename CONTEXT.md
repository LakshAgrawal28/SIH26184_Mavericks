# ECDAT — Domain Context, Cryptographic Theory & Strategic Positioning

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**Problem Statement ID:** 26164  
**Organization:** National Technical Research Organisation (NTRO)  
**Category:** Software | **Theme:** Blockchain & Cybersecurity  

---

## 🎯 1. Problem Statement ID 26164 Context

### 1.1 The Post-Quantum Cryptography (PQC) Imperative

The global cybersecurity landscape is undergoing its largest structural transition in 40 years: preparing for **Post-Quantum Cryptography (PQC)**.

Quantum computers operating at scale will render fundamental public-key cryptosystems ineffective:
- **RSA** (Rivest–Shamir–Adleman)
- **Diffie–Hellman (DH)** & **Elliptic Curve Diffie–Hellman (ECDH)**
- **ECDSA** (Elliptic Curve Digital Signature Algorithm) & **Ed25519**

These algorithms protect virtually every web connection, digital certificate, code signature, VPN tunnel, and encrypted database in enterprise and national defense systems.

### 1.2 The Core Problem Facing NTRO & Enterprise Security

Before any government agency, enterprise, or defense organization can begin migrating to quantum-safe algorithms, it must answer one fundamental question:

> **“Where is cryptography used across our source code, application dependencies, operational certificates, binaries, and container infrastructure—and how vulnerable is each instance to quantum attacks?”**

Without an automated, centralized **Cryptographic Bill of Materials (CBOM)** discovery platform, PQC migration is guesswork, leading to unmitigated risk, compliance failures, and high vulnerability to **Harvest Now, Decrypt Later (HNDL)** attacks.

### 1.3 Problem Statement 26164 Requirements Traceability

| Requirement ID | NTRO Problem Statement Requirement | ECDAT Capability |
|----------------|------------------------------------|------------------|
| **Req-1** | Identify and catalogue cryptographic artefacts across source repositories, libraries, binaries, container images, and cloud configurations. | Multi-layer discovery engine combining Semgrep static rules, Syft dependency analysis, X.509 cert parsers, and binary strings/YARA rules. |
| **Req-2** | Perform comprehensive quantum risk assessment to identify quantum-vulnerable systems. | Composite Risk Engine evaluating HNDL vulnerability, operational risk, and asset exposure to generate $0.0 - 10.0$ scores. |
| **Req-3** | Classify artefacts by type, shelf-life, and business criticality; apply Mosca’s Theorem ($X + Y > Z$). | Mosca Urgency Engine featuring user-configurable $X$ (lifetime) and $Y$ (migration) with 4 scenario models for $Z$ (CRQC timeline). |
| **Req-4** | Recommend PQC and hybrid alternatives based on risk, performance impact, and cost. | PQC Engine generating mapping to NIST August 2024 standards (FIPS 203/204/205) and RFC 10024 hybrid pairings. |
| **Deliv-1** | Standalone discovery tool scanning multiple target types. | Async Python/FastAPI scanner engine executing within isolated Docker containers. |
| **Deliv-2** | Standardized report export (CBOM format). | CycloneDX 1.6+ ECMA-424 JSON export + CISO PDF executive summaries. |
| **Deliv-3** | Interactive GUI for exploration and visualization. | Next.js 14 dashboard with inventory tables, evidence drawers, risk heatmaps, and interactive Mosca sliders. |

---

## 🔬 2. Deep Cryptographic Theory & Quantum Mechanics

To evaluate quantum risk defensibly, ECDAT implements core principles of quantum information science and cryptographic vulnerability.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         QUANTUM THREAT MAP FOR CRYPTOGRAPHY                      │
├──────────────────────────────────┬───────────────────────────────────────────────┤
│ SHOR’S ALGORITHM (1994)          │ GROVER’S ALGORITHM (1996)                     │
│ Target: Public-Key Cryptography  │ Target: Symmetric Ciphers & Hash Functions    │
│ Mechanism: Polynomial Time       │ Mechanism: Quadratic Speedup O(√N)           │
│ Impact: COMPLETE BREAK           │ Impact: HALVED EFFECTIVE KEY SIZE             │
├──────────────────────────────────┼───────────────────────────────────────────────┤
│ ❌ RSA (2048, 3072, 4096)        │ ⚠️ AES-128  ──>  64-bit effective (Weakened)  │
│ ❌ ECDH / ECDSA (P-256, P-384)   │ ✅ AES-256  ──>  128-bit effective (SAFE)     │
│ ❌ Ed25519 / X25519              │ ⚠️ SHA-256  ──>  128-bit collision (SAFE)     │
│ ❌ Finite-Field DH               │ ❌ SHA-1 / MD5 ──>  Broken (Classical + Q)    │
└──────────────────────────────────┴───────────────────────────────────────────────┘
```

### 2.1 Shor’s Algorithm (1994) — The Asymmetric Crisis
Shor's algorithm solves prime factorization and discrete logarithms in polynomial time on a quantum computer:
- Classical complexity for RSA factorization: Sub-exponential $O\left(e^{(\sqrt[3]{\ln N \ln^2 \ln N})}\right)$.
- Quantum complexity under Shor's: Polynomial $O((\log N)^3)$.

**Impact**: A Cryptographically Relevant Quantum Computer (CRQC) with ~4,096 logical qubits will factor RSA-2048 in hours, breaking all signatures, key exchanges, and public-key encryption instantly.

### 2.2 Grover’s Algorithm (1996) — Symmetric Key Degradation
Grover's algorithm provides a quadratic speedup for unstructured search from $O(N)$ to $O(\sqrt{N})$:
- **AES-128**: Effective security reduced from 128 bits to **64 bits** (vulnerable to quantum brute force).
- **AES-256**: Effective security reduced from 256 bits to **128 bits** (remains secure and acceptable for long-term protection).
- **SHA-256**: Preimage resistance reduced to 128 bits (acceptable).

---

## ⏳ 3. Threat Vectors & Mosca’s Theorem

### 3.1 Harvest Now, Decrypt Later (HNDL)
HNDL is an active threat vector where adversaries intercept and record encrypted network traffic today. Even though the traffic cannot be decrypted now, adversaries store it until a CRQC is available.

```
YEAR 2026 (TODAY)                     FUTURE (CRQC ARRIVAL)
┌────────────────────────┐            ┌────────────────────────┐
│ Intercept & Record     │            │ Quantum Computer       │
│ Encrypted TLS Session  │ ─────────> │ Runs Shor's Algorithm  │
│ (RSA-2048 / ECDH)      │            │ Decrypts Stored Data   │
└────────────────────────┘            └────────────────────────┘
```
- **High-Risk Assets**: Medical records, state secrets, financial ledgers, code-signing certificates, legal contracts, and military intelligence requiring confidentiality $>5$ years.

### 3.2 Mosca’s Theorem ($X + Y > Z$)
Formulated by Dr. Michele Mosca (Institute for Quantum Computing), this equation defines when an organization must begin migration:

$$\text{If } X + Y > Z \implies \text{DATA CONFIDENTIALITY WILL BE BROKEN BEFORE MIGRATION COMPLETES}$$

Where:
- **$X$ (Shelf Life)**: Years data must remain secret.
- **$Y$ (Migration Time)**: Years required to replace cryptographic infrastructure.
- **$Z$ (Collapse Time)**: Years until a CRQC exists.

#### Example Scenario
If an agency protects classified records ($X = 15$ years), and infrastructure migration takes $Y = 5$ years, while CRQC arrival is estimated at $Z = 10$ years:
$$X + Y = 15 + 5 = 20 \text{ years}$$
$$20 > 10 \implies \text{MARGIN} = 10 - 20 = -10 \text{ YEARS (EXPIRED / 10 YEARS LATE)}$$

---

## 📜 4. NIST Standards & Industry Framework Alignment

### 4.1 Finalized NIST PQC Standards (August 2024)
ECDAT recommendations directly integrate the official NIST standards:

1. **NIST FIPS 203 — ML-KEM** (Module-Lattice Key Encapsulation Mechanism, formerly CRYSTALS-Kyber): Primary standard for general encryption and key exchange. Replaces RSA and ECDH. Key variants: `ML-KEM-512`, `ML-KEM-768`, `ML-KEM-1024`.
2. **NIST FIPS 204 — ML-DSA** (Module-Lattice Digital Signature Algorithm, formerly CRYSTALS-Dilithium): Primary standard for general digital signatures. Replaces RSA and ECDSA. Variants: `ML-DSA-44`, `ML-DSA-65`, `ML-DSA-87`.
3. **NIST FIPS 205 — SLH-DSA** (Stateless Hash-Based Digital Signature Algorithm, formerly SPHINCS+): Conservative, hash-based digital signature standard for high-assurance, long-term archival signatures.

### 4.2 Hybrid Cryptography (RFC 10024)
During the transition phase, ECDAT recommends **hybrid key exchange** (e.g. `X25519MLKEM768`), combining classical algorithms (X25519) with PQC (ML-KEM-768). An attacker must break *both* algorithms to compromise secrecy.

### 4.3 NIST SP 1800-38B & IR 8547 Alignment
- **NIST SP 1800-38B**: ECDAT implements the recommended 4-domain discovery model (Code, Operational, Network, Embedded).
- **NIST IR 8547**: Enforces deprecation timelines mandating RSA/ECDH/ECDSA phase-out by 2030 and complete disallowance by 2035.

---

## 👥 5. Target User Personas

| Persona | Primary Goal | Key ECDAT Module Used |
|---------|--------------|───────────────────────|
| **Security Analyst** | Discover crypto inventory, view evidence snippets, audit code locations. | Inventory Table, Artefact Detail Drawer, Semgrep Evidence View. |
| **CISO / Executive** | Evaluate organizational quantum exposure, present timelines to leadership, justify budget. | Executive Dashboard, Mosca Timeline Slider, PDF Executive Reports. |
| **Lead Developer** | Refactor legacy crypto code, adopt PQC APIs, resolve specific code findings. | File:Line Evidence View, PQC Replacement Mapping, Hybrid Code Samples. |
| **Compliance Auditor** | Verify standards compliance, track asset provenance, audit CBOM structure. | CycloneDX 1.6+ CBOM Export, Schema Validator, Provenance Log. |

---

## ⚔️ 6. Competitive Landscape & Market Differentiation

```
                       ┌─────────────────────────────────────────────────────────┐
                       │                     FEATURE COMPARISON                  │
                       ├─────────────────┬──────────┬──────────┬─────────────────┤
                       │ Feature         │ IBM      │ AWS      │ ECDAT (Our Tool)│
                       │                 │ CBOMkit  │ CodeQL   │                 │
                       ├─────────────────┼──────────┼──────────┼─────────────────┤
                       │ Code Discovery  │  Partial │    Yes   │     Comprehensive│
                       │ Dependency SBOM │    Yes   │  Partial │     Full (Syft)  │
                       │ CycloneDX CBOM  │    Yes   │    No    │     Valid 1.6+  │
                       │ Quantum Risk    │    No    │    No    │     0-10 Composite│
                       │ Mosca Timelines │    No    │    No    │     4 Scenarios │
                       │ PQC Rec Engine  │    No    │    No    │     FIPS 203-205│
                       │ Interactive GUI │    No    │    No    │     Next.js 14  │
                       │ Air-Gap Ready   │  Partial │    No    │     100% Local  │
                       └─────────────────┴──────────┴──────────┴─────────────────┘
```

### Key Differentiators of ECDAT
1. **End-to-End Value Chain**: Moves beyond passive discovery ("what do we have") to active risk quantification ("how risky is it"), timeline math ("when must we act"), and actionable migration guidance ("what do we replace it with").
2. **Context-Aware Evidence**: Links discovered cryptographic primitives directly to exact source file lines, reducing false positive review times.
3. **Multi-Scenario Mosca Engine**: Avoids static arrival predictions by allowing security leaders to model optimistic, baseline, aggressive, and regulatory timelines.

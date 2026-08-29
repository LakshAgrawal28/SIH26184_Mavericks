# ECDAT — Master Team Teaching & Study Guide

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**Problem Statement ID:** 26164 (NTRO)  
**Target Audience:** Hackathon Team Members, Developers, Presenters, Security Analysts  
**Purpose:** Learn, understand, master, and teach every concept in the ECDAT project from scratch.

---

## 🧭 How to Use This Teaching Guide

This document is structured into **4 Learning Modules**. Whether you are writing backend code, building the Next.js UI, or presenting to SIH judges, read this guide to master the project.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             4-MODULE LEARNING PATHWAYS                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Module 1: The Elevator Pitch & Big Picture (Understand Why ECDAT Exists)         │
│ Module 2: Core Concepts Made Simple (CBOM, Quantum Threats, Mosca, PQC)          │
│ Module 3: How ECDAT Works Under the Hood (Scanner, Risk Engine, UI Workflow)     │
│ Module 4: Team Study Curriculum & Self-Assessment Quiz (15 Practice Q&As)        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📢 Module 1: The Elevator Pitch & Big Picture

### 1.1 What is ECDAT? (The 30-Second Explanation)
> **“ECDAT is a security X-ray for cryptography. Point it at any codebase, container, or server configuration, and it reveals every algorithm, key, certificate, and library being used—calculates how vulnerable each one is to future quantum computer attacks—and gives you an exact, step-by-step Post-Quantum Cryptography (PQC) replacement plan.”**

### 1.2 Why Does NTRO Need This Tool?
1. **The Quantum Threat**: Quantum computers are advancing rapidly. When powerful quantum computers arrive, they will instantly break algorithms like **RSA**, **ECDH**, and **ECDSA** which secure government, defense, and banking data worldwide.
2. **Harvest Now, Decrypt Later (HNDL)**: Adversaries are recording encrypted government data *today*. When a quantum computer is built years from now, they will decrypt everything retroactively.
3. **No Inventory = No Migration**: You cannot fix cryptography if you don't know where it exists. NTRO needs an automated tool to scan thousands of codebases and produce a standardized **Cryptographic Bill of Materials (CBOM)**.

---

## 🧠 Module 2: Core Concepts Made Simple

### 2.1 Cryptographic Bill of Materials (CBOM)
- **Analogy**: A food nutrition label or ingredients list. Just as a food label lists ingredients (sugar, flour, preservatives), a **CBOM** lists all cryptographic assets in a software system (RSA-2048, AES-256-GCM, TLS 1.2, OpenSSL 1.1.1).
- **International Standard**: We follow **CycloneDX 1.6+ (ECMA-424)**.

### 2.2 Shor’s Algorithm vs. Grover’s Algorithm (In Plain English)
- **Shor’s Algorithm (1994)**:
  - *Target*: Asymmetric / Public-Key Cryptography (RSA, ECDH, ECDSA).
  - *Impact*: **COMPLETE BREAK**. Factors large numbers in polynomial time. Once a quantum computer runs Shor’s algorithm, RSA and Elliptic Curves offer **ZERO** security.
- **Grover’s Algorithm (1996)**:
  - *Target*: Symmetric Cryptography & Hashing (AES, SHA-256).
  - *Impact*: **HALVES EFFECTIVE KEY SIZE**. Doesn't break encryption, but speeds up key searches quadratically ($O(\sqrt{N})$).
  - *Result*: AES-128 drops to 64-bit security (weakened), but **AES-256** drops to 128-bit security (still 100% quantum-safe!).

### 2.3 Mosca’s Theorem ($X + Y > Z$) Explained
Formulated by Dr. Michele Mosca to determine if an organization is already late for PQC migration:

$$\text{IF } (X + Y) > Z \implies \text{YOU ARE ALREADY LATE}$$

| Variable | Name | Plain English Meaning | Example |
|----------|------|───────────────────────|---------|
| **$X$** | Data Shelf Life | How long data must stay secret? | 10 years (medical/defense records) |
| **$Y$** | Migration Time | How many years to upgrade all software & PKI? | 4 years (enterprise migration) |
| **$Z$** | Collapse Time | Years until a Quantum Computer arrives? | 7 years (baseline planning estimate) |

- **Worked Example**:
  - $X = 10$ years, $Y = 4$ years $\implies X + Y = 14$ years.
  - $Z = 7$ years.
  - $14 > 7 \implies \text{Margin } = 7 - 14 = -7$ years $\rightarrow$ **EXPIRED (7 years overdue!)**.

### 2.4 NIST August 2024 PQC Standards
NIST finalized 3 new post-quantum algorithms in August 2024:

1. **ML-KEM (FIPS 203)** — Replaces RSA & ECDH for key exchange and encryption (Default: `ML-KEM-768`).
2. **ML-DSA (FIPS 204)** — Replaces RSA & ECDSA for digital signatures (Default: `ML-DSA-65`).
3. **SLH-DSA (FIPS 205)** — Hash-based signatures for long-term conservative archival data.

### 2.5 Hybrid Cryptography
During the 5-10 year migration phase, we don't switch to PQC instantly. We use **Hybrid Encryption** (RFC 10024): combining a classical algorithm (like X25519) and a PQC algorithm (like ML-KEM-768) together. An attacker must break **BOTH** algorithms to decrypt the data!

---

## ⚙️ Module 3: How ECDAT Works Under the Hood

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            ECDAT SYSTEM PIPELINE                                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. UPLOAD archive (.zip) via Next.js Dashboard                                   │
│ 2. Celery Worker unzips safely (Zip-slip security check)                         │
│ 3. Run 4 Parallel Detectors:                                                     │
│    - Semgrep: Finds crypto code calls (Java, Py, JS, Go, Rust)                   │
│    - Syft: Finds crypto packages in pom.xml / package.json / requirements.txt    │
│    - Cert Parser: Parses X.509 certificates (.pem, .crt)                         │
│    - Config Parser: Inspects TLS configs (nginx.conf, java.security)             │
│ 4. Normalizer: Merges findings, deduplicates, and assigns confidence (0-1)     │
│ 5. Quantum Risk Engine: Computes HNDL (0-10) and Operational Risk scores         │
│ 6. Mosca Engine: Computes timeline margins across 4 planning scenarios          │
│ 7. PQC Engine: Generates NIST FIPS recommendations & hybrid pairs                │
│ 8. CBOM Builder: Exports standard CycloneDX 1.6+ JSON & PDF report                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Module 4: Team Study Plan & Self-Assessment Quiz

### 📚 Recommended 3-Session Team Workshop (6 Hours Total)

- **Session 1 (2 Hours) — Domain Knowledge**: Read Modules 1 & 2. Discuss quantum threats, Shor's algorithm, HNDL, and Mosca's theorem.
- **Session 2 (2 Hours) — System Architecture**: Read [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) & [`docs/IMPLEMENTATION.md`](IMPLEMENTATION.md). Trace data flow from upload to CBOM export.
- **Session 3 (2 Hours) — Pitch & Q&A Rehearsal**: Practice presentation using [`docs/PRESENTATION_SCRIPT.md`](PRESENTATION_SCRIPT.md) and drill the 15 quiz questions below.

---

### ❓ Self-Assessment Quiz (15 Questions for Team Mastery)

#### Q1: Is AES-256 vulnerable to quantum computers?
**Answer**: No. Grover's algorithm halves symmetric key strength, reducing AES-256 to 128-bit effective quantum security, which remains 100% safe. AES-128, however, drops to 64-bit security and is weakened.

#### Q2: What is the main difference between Shor's and Grover's algorithms?
**Answer**: Shor's algorithm runs in polynomial time and completely breaks asymmetric/public-key crypto (RSA, ECDH, ECDSA). Grover's algorithm provides a quadratic speedup $O(\sqrt{N})$ and halves symmetric key strength (AES, SHA).

#### Q3: What does $X + Y > Z$ mean in Mosca's Theorem?
**Answer**: $X$ is data shelf life, $Y$ is migration time, and $Z$ is time until a quantum computer arrives. If $X + Y > Z$, the data confidentiality will be compromised before migration can finish—meaning action is required immediately.

#### Q4: What is Harvest Now, Decrypt Later (HNDL)?
**Answer**: Adversaries intercept and store encrypted traffic today, intending to decrypt it retroactively once a quantum computer is built.

#### Q5: What standard does ECDAT use for CBOM generation?
**Answer**: OWASP CycloneDX 1.6+ (ECMA-424 standard) using the `cryptographic-asset` component specification.

#### Q6: What are the 3 NIST August 2024 PQC standard algorithms?
**Answer**: ML-KEM (FIPS 203) for key exchange, ML-DSA (FIPS 204) for digital signatures, and SLH-DSA (FIPS 205) for stateless hash-based signatures.

#### Q7: Why do we recommend hybrid cryptography instead of pure PQC?
**Answer**: Hybrid cryptography pairs classical and PQC algorithms (e.g. X25519MLKEM768). It protects against potential unforeseen flaws in new PQC algorithms while immediately defending against quantum attacks.

#### Q8: How does ECDAT detect cryptography in source code?
**Answer**: By executing custom Semgrep static analysis pattern rules matching AST nodes across Java, Python, JavaScript, Go, and Rust code.

#### Q9: How does ECDAT scan package dependencies?
**Answer**: By wrapping Syft to parse package manifests (`pom.xml`, `package.json`, `requirements.txt`) and matching against a crypto library database.

#### Q10: How are risk scores calculated in ECDAT?
**Answer**: Using a composite formula ($0.0 - 10.0$) combining HNDL risk (quantum vulnerability $\times$ data lifetime $\times$ exposure) and Operational risk (classical weakness $\times$ complexity).

#### Q11: What are the 4 Mosca scenarios offered in ECDAT?
**Answer**: Optimistic ($Z=15$ yrs), Baseline ($Z=10$ yrs), Aggressive ($Z=5$ yrs), and Regulatory ($Z=7$ yrs / NIST 2030).

#### Q12: Can ECDAT run in air-gapped government environments?
**Answer**: Yes. All scanning engines, risk calculators, and report generators run 100% locally inside Docker containers with zero mandatory internet egress.

#### Q13: How does ECDAT prevent Zip-Slip attacks during file extraction?
**Answer**: By inspecting canonical target paths during unarchiving and throwing security exceptions if paths contain `../` or lead outside the temp extraction sandbox.

#### Q14: How does ECDAT differ from IBM CBOMkit?
**Answer**: IBM CBOMkit only generates raw CBOM inventory. ECDAT provides discovery + composite quantum risk scoring + Mosca timeline analysis + NIST PQC recommendations + an interactive Next.js dashboard.

#### Q15: What NIST standards align with cryptographic discovery?
**Answer**: NIST SP 1800-38B (Cryptographic Discovery) and NIST IR 8547 (PQC Transition Timeline).

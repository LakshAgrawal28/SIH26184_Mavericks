# ECDAT — Team Presentation Script, Live Demo & Judge Q&A Training

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**Problem Statement ID:** 26164  
**Organization:** National Technical Research Organisation (NTRO)  
**Event:** Smart India Hackathon 2026 (SIH 2026)  

---

## 🎤 1. Ten-Slide Presentation Pitch Script (4 Minutes Total)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PRESENTATION TIMELINE                                │
├───────┬─────────────────────────────────────────────┬─────────────┬──────────────┤
│ Slide │ Topic                                       │ Speaker     │ Duration     │
├───────┼─────────────────────────────────────────────┼─────────────┼──────────────┤
│ 01    │ Title & Introduction                        │ Speaker 1   │ 15 seconds   │
│ 02    │ Problem Understanding (The Quantum Crisis)  │ Speaker 1   │ 35 seconds   │
│ 03    │ Solution Overview & High-Level Value        │ Speaker 2   │ 30 seconds   │
│ 04    │ Technical Architecture & Multi-Layer Engine │ Speaker 2   │ 40 seconds   │
│ 05    │ Innovation & Unique Value Proposition       │ Speaker 2   │ 30 seconds   │
│ 06    │ Quantum Risk Scoring & Mosca's Theorem      │ Speaker 3   │ 35 seconds   │
│ 07    │ NIST PQC Standards & Hybrid Recommendations│ Speaker 3   │ 30 seconds   │
│ 08    │ Prototype Screenshots & Demo Overview       │ Speaker 3   │ 20 seconds   │
│ 09    │ Feasibility, Scalability & Roadmap          │ Speaker 1   │ 20 seconds   │
│ 10    │ Conclusion & Team Overview                  │ Speaker 1   │ 15 seconds   │
└───────┴─────────────────────────────────────────────┴─────────────┴──────────────┘
```

---

### 🗣️ Spoken Script Details

#### Slide 1: Title & Introduction (Speaker 1 — 15s)
> *"Respected Judges, good morning. We are Team Mavericks presenting **ECDAT**—the Enterprise Cryptographic Discovery and Analysis Tool, built for Problem Statement 26164 by the National Technical Research Organisation (NTRO)."*

#### Slide 2: Problem Understanding (Speaker 1 — 35s)
> *"Organizations worldwide face an urgent crisis: Post-Quantum Cryptography migration. Quantum computers running Shor’s algorithm will break RSA, ECDH, and ECDSA—the bedrock of modern encryption. Furthermore, under Harvest Now Decrypt Later, adversaries are capturing sensitive government data today to decrypt later. But before NTRO or any enterprise can migrate to quantum-safe algorithms, they face one roadblock: **They don't know where cryptography exists in their systems.** You cannot migrate what you cannot see."*

#### Slide 3: Solution Overview (Speaker 2 — 30s)
> *"To solve this, we built **ECDAT**—a security X-ray for enterprise cryptography. Point ECDAT at code repositories, binaries, certificates, or containers, and it automatically discovers every cryptographic asset, computes quantum risk, calculates migration timelines using Mosca’s Theorem, and outputs a standardized CycloneDX CBOM."*

#### Slide 4: Technical Architecture (Speaker 2 — 40s)
> *"Our architecture features a Next.js 14 dashboard communicating via REST and WebSockets with a FastAPI backend. Scans run asynchronously in isolated Docker Celery workers. We combine 4 discovery layers: Semgrep for static code analysis, Syft for dependency SBOMs, X.509 certificate parsers, and TLS configuration analyzers. All findings are normalized into PostgreSQL and archived in MinIO."*

#### Slide 5: Innovation & Uniqueness (Speaker 2 — 30s)
> *"Existing tools like IBM CBOMkit only output raw inventory lists. ECDAT completes the full value chain: Discovery PLUS Composite Quantum Risk Scoring PLUS Mosca Timeline Analysis PLUS NIST PQC Recommendations—with exact file-and-line evidence snippets."*

#### Slide 6: Risk Engine & Mosca’s Theorem (Speaker 3 — 35s)
> *"Our Risk Engine calculates composite 0-to-10 risk scores combining HNDL threat levels and operational weakness. We integrate Mosca’s Theorem—comparing data shelf-life $X$ plus migration time $Y$ against quantum timeline $Z$. We allow security leaders to toggle between Optimistic, Baseline, Aggressive, and Regulatory scenarios to visualize urgency."*

#### Slide 7: PQC & Hybrid Recommendations (Speaker 3 — 30s)
> *"We map legacy assets directly to finalized August 2024 NIST PQC standards: ML-KEM for key exchange, ML-DSA for digital signatures, and SLH-DSA for archival sigs. During the transition phase, we recommend hybrid dual-algorithm pairings like X25519MLKEM768."*

#### Slide 8: Live Demo Overview (Speaker 3 — 20s)
> *"Let us now show you ECDAT running live: uploading a target archive, watching real-time scanning progress, exploring discovered inventory, and exporting a valid CycloneDX 1.6 CBOM JSON file."*

#### Slide 9: Feasibility & Scalability (Speaker 1 — 20s)
> *"ECDAT is 100% air-gap ready, running on-premise with zero external cloud dependencies. It scales horizontally via Celery workers and deploys effortlessly using a single `docker compose up` command."*

#### Slide 10: Conclusion (Speaker 1 — 15s)
> *"ECDAT empowers NTRO to transition from quantum vulnerability to quantum resilience. Thank you, and we look forward to your questions."*

---

## 🎬 2. Live Demo Walkthrough Script (5 Minutes)

| Timestamp | UI Screen / Action | Presenter Spoken Words |
|-----------|--------------------|------------------------|
| **0:00 - 0:30** | **Login & Executive Dashboard** | *"We start on the ECDAT Executive Dashboard. Security leaders immediately see total scans, critical quantum risk findings, and risk distribution across the organization."* |
| **0:30 - 1:15** | **New Scan Creation** | *"Clicking 'New Scan', we upload `java-rsa-aes.zip`, set data shelf life $X=10$ years, migration time $Y=4$ years, and click Start Scan."* |
| **1:15 - 1:45** | **Real-Time Progress** | *"The scan runs asynchronously. Real-time WebSocket events update the progress bar as Semgrep, Syft, and Certificate detectors scan files."* |
| **1:45 - 2:30** | **Inventory & Evidence Drawer** | *"Scan complete! We see 38 artefacts discovered. Filtering by 'Critical', we click RSA-2048. The evidence drawer shows exact file path `CryptoService.java` at line 42 with code snippet `Cipher.getInstance("RSA/ECB")`."* |
| **2:30 - 3:30** | **Mosca Timeline & Slider** | *"Navigating to the Mosca tab, $X+Y=14$ years. Under the Baseline scenario ($Z=10$), the margin is $-4$ years—flagged as EXPIRED. Sliding $Z$ to Optimistic ($Z=15$) shifts the status badge dynamically."* |
| **3:30 - 4:15** | **PQC Recommendations** | *"The Recommendations tab provides prioritized actions: Migrate RSA-2048 to NIST FIPS 203 ML-KEM-768 with X25519MLKEM768 hybrid pairing, detailing effort and latency impact."* |
| **4:15 - 5:00** | **Report Export** | *"Finally, we click 'Export CBOM'. ECDAT generates a valid CycloneDX 1.6+ JSON file and a downloadable PDF Executive Summary for auditors."* |

---

## 🎯 3. Top 15 Judge Questions & Master Responses

#### Q1: "How does your tool differ from standard vulnerability scanners like Trivy or SonarQube?"
> **Master Answer**: *"Vulnerability scanners search for known CVE software bugs in existing packages. ECDAT searches for **cryptographic algorithms and key usage** across source code, configs, and certificates, evaluating **quantum vulnerability** and generating a standardized CycloneDX CBOM. NIST SP 1800-38B defines cryptographic discovery as a distinct discipline separate from vulnerability scanning."*

#### Q2: "How accurate is your discovery engine? What about false positives?"
> **Master Answer**: *"We combine 4 complementary detection layers: Semgrep AST rules for code, Syft manifest parsing for dependencies, PyOpenSSL for certificates, and regex config parsers. Every finding includes a confidence score (0.0 to 1.0) and exact file-and-line evidence snippets, allowing analysts to verify findings instantly."*

#### Q3: "Can ECDAT run in classified or air-gapped government environments for NTRO?"
> **Master Answer**: *"Yes, 100%. ECDAT is built on-premise first. It runs entirely inside local Docker containers with zero external API calls or cloud dependencies, making it completely air-gap ready."*

#### Q4: "Why don't you use AI/Machine Learning for discovery?"
> **Master Answer**: *"For critical security decisions in defense organizations like NTRO, analysis must be 100% deterministic, explainable, and reproducible. Rule-based static AST analysis guarantees auditable findings without non-deterministic LLM hallucinations."*

#### Q5: "How do you calculate the Quantum Risk Score?"
> **Master Answer**: *"We use a composite formula combining HNDL risk—evaluating algorithm vulnerability, data sensitivity, data shelf-life $X$, and network exposure—with operational risk derived from classical weakness and replacement complexity."*

#### Q6: "How does ECDAT implement Mosca's Theorem?"
> **Master Answer**: *"We compute the inequality $X + Y > Z$. Because the exact arrival time of a quantum computer ($Z$) is uncertain, ECDAT models 4 scenario presets—Optimistic ($Z=15$), Baseline ($Z=10$), Aggressive ($Z=5$), and Regulatory ($Z=7$)—providing dynamic urgency badges."*

#### Q7: "What PQC standards do you align with?"
> **Master Answer**: *"We directly integrate the finalized August 2024 NIST PQC standards: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA), alongside RFC 10024 hybrid transition specs."*

#### Q8: "How does ECDAT compare to IBM CBOMkit?"
> **Master Answer**: *"IBM CBOMkit is a command-line tool that generates raw CBOM inventory. ECDAT provides a complete enterprise platform: multi-layer discovery PLUS composite risk scoring PLUS Mosca timeline analysis PLUS NIST PQC recommendations PLUS an interactive web GUI."*

#### Q9: "What standard format does your CBOM output follow?"
> **Master Answer**: *"We export valid CycloneDX 1.6+ JSON compliant with the international ECMA-424 standard, using the official `cryptographic-asset` component schema."*

#### Q10: "How fast is your scanner?"
> **Master Answer**: *"A medium codebase of 1,000 files scans in under 3 minutes due to asynchronous parallel execution in Celery background workers."*

#### Q11: "How do you prevent malicious uploaded zip files from attacking your scanner?"
> **Master Answer**: *"We implement Zip-Slip defense by validating canonical extraction paths before unarchiving, and execute scanner workers in unprivileged, resource-capped Docker containers."*

#### Q12: "What is Harvest Now, Decrypt Later (HNDL) and why does it matter today?"
> **Master Answer**: *"Adversaries are capturing encrypted sensitive data today to decrypt it when quantum computers arrive. That makes long-retention data protected by RSA/ECDH vulnerable right now."*

#### Q13: "What is Hybrid Cryptography?"
> **Master Answer**: *"Combining classical (e.g. X25519) and PQC algorithms (e.g. ML-KEM-768) during the migration phase so an attacker must break both to compromise data."*

#### Q14: "Can your tool scan binaries or Docker container images?"
> **Master Answer**: *"Yes. We inspect binary import tables (via LIEF), extract strings/YARA fingerprints, and analyze container layer SBOMs using Syft."*

#### Q15: "What is your roadmap after SIH?"
> **Master Answer**: *"Expanding automated code refactoring via PQC codemods, CI/CD GitHub Actions integration, and real-time network TLS cipher suite discovery."*

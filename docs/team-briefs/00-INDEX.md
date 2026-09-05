# ECDAT — six reading briefs for the team

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**SIH 2026 · PS 26164 · NTRO · Team Mavericks**

Give **one numbered file** to each person. Each brief is self-contained (~8–12 minutes). Together they cover the whole product.

| Person | File | Topic | After reading, they can explain |
|--------|------|--------|----------------------------------|
| 1 | [01-problem-and-product.md](01-problem-and-product.md) | Why ECDAT exists | Quantum threat, HNDL, NTRO problem, what we built |
| 2 | [02-architecture-and-backend.md](02-architecture-and-backend.md) | How the system is wired | FastAPI, scans, workers, data flow |
| 3 | [03-scanner-and-discovery.md](03-scanner-and-discovery.md) | Finding crypto | Detectors, rules, corpus, why empty scans happen |
| 4 | [04-risk-mosca-pqc.md](04-risk-mosca-pqc.md) | Scoring & migration | Risk bands, Mosca \(X+Y>Z\), NIST PQC map |
| 5 | [05-dashboard-and-demo.md](05-dashboard-and-demo.md) | UI and live demo | Screens, click path, what judges should see |
| 6 | [06-cbom-accuracy-and-judges.md](06-cbom-accuracy-and-judges.md) | Proof & Q&A | CycloneDX 1.6, accuracy, security, judge answers |

**Shared one-liner for everyone:**  
ECDAT is a security X-ray for enterprise cryptography: upload a zip → discover algorithms/certs/TLS/binaries → score quantum risk → apply Mosca’s theorem → recommend NIST PQC → export a valid CycloneDX 1.6 CBOM.

**Demo zip (all six should know this path):**  
`scanner/corpus/archives/mixed-enterprise.zip`

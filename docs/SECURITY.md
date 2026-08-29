# ECDAT — Security Model & Threat Mitigation

**Document Version:** 1.0.0  

---

## 🛡️ 1. Security Philosophy

Because **ECDAT** accepts and analyzes untrusted source code archives, binary files, and container images uploaded by users, the platform itself is designed with defensive isolation controls to prevent arbitrary code execution, container breakout, path traversal, or unauthorized data leakage.

---

## 🔒 2. Threat Model & Mitigations

| Threat Vector | Attack Scenario | ECDAT Mitigation Mechanism |
|---------------|-----------------|----------------------------|
| **Zip-Slip / Path Traversal** | Malicious zip archive containing filenames with `../` attempting to overwrite system binaries. | Extraction stream validates canonical target directory paths (`os.path.commonpath`), throwing `SecurityException` and deleting temporary archives if traversal is detected. |
| **Scanner Worker Compromise** | Malicious binary or script executing malicious code during analysis inside the worker. | Celery worker processes execute inside unprivileged Docker containers (`uid=10001`, `read_only_rootfs: true`), bounded by CPU/RAM cgroups and short execution timeouts. |
| **Server-Side Request Forgery (SSRF)** | Git URL scan targets requesting internal metadata endpoints (`http://169.254.169.254`). | URL validator enforces allowlist scheme (`https://`), resolves DNS, and blocks private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`). |
| **Command Injection** | Malicious parameters passed into Semgrep or Syft CLI wrappers. | All subprocess invocations use explicit argument arrays (`execve` style without shell interpolation: `shell=False`). |
| **Secret Material Leakage** | Private keys discovered during scanning exposed in API responses. | Evidence normalizer redacts private key headers, PEM secret bodies, and tokens using regex matchers prior to writing findings to PostgreSQL. |
| **Data Exfiltration** | Scanner sending collected code metrics to external cloud endpoints. | Complete air-gap support. Docker Compose worker network has no egress route to the public internet (`internal: true`). |

---

## ☣️ 3. Vulnerability Disclosure Policy

If you discover a potential security flaw in ECDAT, please report it via encrypted email to:
- **Security Contact**: `security@ecdat.local` / `mavericks-sih@ntro.gov.in`
- Please do not disclose vulnerabilities publicly until a patch has been released.

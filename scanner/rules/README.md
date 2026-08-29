# ECDAT Semgrep Rules

These YAML files define Semgrep rules for detecting cryptographic vulnerabilities.
They are reference implementations aligned with NIST standards.

## Usage

```bash
# Run against a target directory
semgrep --config scanner/rules/ /path/to/target/

# Run a specific rule
semgrep --config scanner/rules/rsa-ecb.yaml /path/to/java/src/
```

## Rules

| File | Detects | Languages | Severity |
|------|---------|-----------|----------|
| `weak-hash.yaml` | MD5, SHA-1 usage | Python, Java | ERROR/WARNING |
| `weak-tls.yaml` | TLS 1.0/1.1, InsecureSkipVerify | Go | ERROR |
| `rsa-ecb.yaml` | RSA/ECB modes, RSA keygen | Java | ERROR/WARNING |

## Standards References
- NIST IR 8547 — Hash function deprecation timelines
- NIST SP 800-52 Rev 2 — TLS guidelines
- NIST FIPS 203/204/205 — PQC replacement standards
- CycloneDX CBOM 1.6 — ECDAT output format

# ECDAT Semgrep rule pack

These YAML files are the **source of truth** for source-code cryptographic detection.

```bash
semgrep --config scanner/rules/ /path/to/target --json
```

ECDAT runs the same pack via `scanner/detectors/semgrep_detector.py`:
it invokes the Semgrep CLI when installed, and otherwise executes the identical
rules in-process so air-gapped NTRO deployments still produce the same findings.

| File | Detects |
|------|---------|
| `rsa-ecb.yaml` | Java RSA/ECB, RSA keygen |
| `weak-hash.yaml` | MD5, SHA-1 (Python + Java) |
| `weak-tls.yaml` | Go TLS 1.0/1.1, InsecureSkipVerify |
| `java-crypto.yaml` | AES, DES/3DES, ECDSA |
| `python-crypto.yaml` | AES-CBC, RSA key load |
| `javascript-crypto.yaml` | Node createCipher, JWT HS256 |

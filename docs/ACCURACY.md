# ECDAT corpus accuracy (published)

This is the anti-LLM scoreboard. The scanner is **deterministic**: the same archive always
yields the same labelled families, and it must never invent algorithms that are not in the
fixture (GOST, Camellia, Twofish, …).

## How to run

```bash
PYTHONPATH=backend:. python -m scanner.accuracy.measure
curl -s http://localhost:8000/api/v1/accuracy
```

## What “good” means for NTRO / SIH

| Metric | Target |
|--------|--------|
| Recall of labelled families | 1.00 (every required RSA/AES/MD5/TLS/cert/binary hit) |
| Invented algorithms | 0 |
| Determinism | two consecutive runs, identical finding keys |
| Detection layers | Semgrep rules + X.509 parser + config + binary strings |

Fixtures live in `scanner/corpus/`. Expected labels are in `scanner/accuracy/expected.json`.

The mixed-enterprise archive (`scanner/corpus/archives/mixed-enterprise.zip`) is the
demo that clones fail: Java RSA/ECB + nginx TLS 1.0 + expiring RSA cert + `libcrypto_legacy.so`.

# Obfuscated Crypto Corpus

This fixture demonstrates the **false-negative boundary** of ECDAT's static scanner.

## What is detectable
- `Cipher.getInstance(MODE)` where MODE is a string literal with AES/ECB/PKCS5Padding → **DETECTED**

## What is NOT detectable (by design)
- String-split assembly: `"AE" + "S"` → scanner won't join these
- Base64-encoded key material stored as a string constant → scanner can't decode and evaluate
- Runtime class assembly via StringBuilder/reverse → not static-analysis friendly
- `Class.forName()` with dynamically assembled class names

## Implication
ECDAT's scanner provides **best-effort coverage** of plaintext crypto usage.
Obfuscated or dynamically-assembled algorithm names require:
- Dynamic instrumentation (e.g., Java agent bytecode analysis)
- Runtime profiling
- YARA binary rules targeting common library call signatures

This is documented as a known limitation in ECDAT's scope.

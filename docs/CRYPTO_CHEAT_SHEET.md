# ECDAT — Cryptography, Quantum Risk & PQC Quick Reference Cheat Sheet

**Project:** Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)  
**Problem Statement ID:** 26164 (NTRO)  

---

## 📊 1. Master Algorithm Risk & Quantum Status Lookup

| Algorithm Primitive | Family | Classical Security | Quantum Vulnerability | Effective Quantum Security | Shor's / Grover's Threat | ECDAT Action Recommendation |
|---------------------|--------|-------------------|----------------------|----------------------------|--------------------------|-----------------------------|
| **RSA-1024** | Asymmetric | 80-bit (Weak) | **10.0 (Critical)** | **0-bit** | Shor's Algorithm | `Immediate Replacement` $\rightarrow$ ML-KEM-768 |
| **RSA-2048** | Asymmetric | 112-bit | **10.0 (Critical)** | **0-bit** | Shor's Algorithm | `Hybrid Migration` $\rightarrow$ ML-KEM-768 |
| **RSA-4096** | Asymmetric | 128-bit | **10.0 (Critical)** | **0-bit** | Shor's Algorithm | `Hybrid Migration` $\rightarrow$ ML-KEM-768 / ML-DSA-65 |
| **ECDH (P-256)** | Asymmetric | 128-bit | **10.0 (Critical)** | **0-bit** | Shor's Algorithm | `Hybrid Migration` $\rightarrow$ X25519MLKEM768 |
| **ECDSA (P-256)** | Signature | 128-bit | **10.0 (Critical)** | **0-bit** | Shor's Algorithm | `Hybrid Migration` $\rightarrow$ ML-DSA-65 |
| **Ed25519** | Signature | 128-bit | **10.0 (Critical)** | **0-bit** | Shor's Algorithm | `Hybrid Migration` $\rightarrow$ ML-DSA-65 |
| **DSA** | Signature | 80-bit (Weak) | **10.0 (Critical)** | **0-bit** | Shor's Algorithm | `Immediate Replacement` $\rightarrow$ ML-DSA-65 |
| **AES-128** | Symmetric | 128-bit | **4.0 (Medium)** | **64-bit** | Grover's Algorithm | `Migrate` $\rightarrow$ AES-256-GCM |
| **AES-256-GCM** | Symmetric | 256-bit | **2.0 (Low)** | **128-bit** | Grover's Algorithm | `Keep (Quantum Safe)` |
| **SHA-1** | Hash | Broken | **8.0 (High)** | **0-bit** | Classical Flaw + Grover | `Immediate Replacement` $\rightarrow$ SHA-256 |
| **MD5** | Hash | Broken | **10.0 (Critical)**| **0-bit** | Classical Flaw + Grover | `Immediate Replacement` $\rightarrow$ SHA-256 |
| **DES / 3DES** | Symmetric | Broken | **10.0 (Critical)**| **0-bit** | Classical Flaw + Grover | `Immediate Replacement` $\rightarrow$ AES-256-GCM |
| **SHA-256** | Hash | 256-bit | **3.0 (Low)** | **128-bit** | Grover's Algorithm | `Keep (Quantum Safe)` |
| **ML-KEM-768** | PQC (FIPS 203) | 192-bit | **0.0 (Safe)** | **192-bit** | Quantum Resistant | `Deploy (NIST Standard)` |
| **ML-DSA-65** | PQC (FIPS 204) | 192-bit | **0.0 (Safe)** | **192-bit** | Quantum Resistant | `Deploy (NIST Standard)` |
| **SLH-DSA** | PQC (FIPS 205) | 128-256 bit | **0.0 (Safe)** | **128-256 bit** | Quantum Resistant | `Deploy (Archival Sigs)` |

---

## 📜 2. NIST August 2024 PQC Standards Quick Reference

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             NIST FINAL PQC STANDARDS                             │
├────────────┬───────────┬─────────────────┬──────────────────┬────────────────────┤
│ FIPS Standard│ Algorithm │ Replaces        │ Key Variant      │ Enterprise Default │
├────────────┼───────────┼─────────────────┼──────────────────┼────────────────────┤
│ FIPS 203   │ ML-KEM    │ RSA, ECDH       │ ML-KEM-512       │ ML-KEM-768         │
│            │           │ Key Exchange    │ ML-KEM-768       │ (NIST Level 3)     │
│            │           │                 │ ML-KEM-1024      │                    │
├────────────┼───────────┼─────────────────┼──────────────────┼────────────────────┤
│ FIPS 204   │ ML-DSA    │ RSA, ECDSA      │ ML-DSA-44        │ ML-DSA-65          │
│            │           │ Signatures      │ ML-DSA-65        │ (NIST Level 3)     │
│            │           │                 │ ML-DSA-87        │                    │
├────────────┼───────────┼─────────────────┼──────────────────┼────────────────────┤
│ FIPS 205   │ SLH-DSA   │ RSA, DSA        │ SLH-DSA-SHA2-128s│ SLH-DSA-SHA2-128s  │
│            │           │ Archival Sigs   │ SLH-DSA-SHAKE-128f│ (Hash-based)       │
└────────────┴───────────┴─────────────────┴──────────────────┴────────────────────┘
```

---

## ⏳ 3. Mosca’s Theorem Formula Reference

$$\text{Mosca Inequality: } (X + Y) > Z$$

- **$X$ (Shelf Life)**: Confidentiality requirement in years.
- **$Y$ (Migration Time)**: Time needed to migrate hardware, PKI, and applications.
- **$Z$ (Collapse Time)**: Years until a Cryptographically Relevant Quantum Computer (CRQC) is built.

### Scenario Presets
- **Optimistic ($Z = 15$)**: Conservative upper estimate for CRQC.
- **Baseline ($Z = 10$)**: Industry consensus & NIST planning baseline.
- **Aggressive ($Z = 5$)**: HNDL priority model for national security data.
- **Regulatory ($Z = 7$)**: Aligns with NIST 2030 deprecation milestone.

---

## 🔍 4. Semgrep Code Pattern Cheat Sheet

| Language | Insecure Pattern | Semgrep Rule ID | Target Primitive |
|----------|────────────────--|-----------------|------------------|
| **Java** | `Cipher.getInstance("RSA/ECB/PKCS1Padding")` | `java-insecure-rsa-ecb` | RSA Encryption |
| **Java** | `Cipher.getInstance("DES/CBC/PKCS5Padding")` | `java-deprecated-des` | DES Cipher |
| **Python**| `hashlib.md5()` | `python-weak-md5-hash` | MD5 Hash |
| **Python**| `Crypto.Cipher.DES.new(...)` | `python-deprecated-des` | DES Cipher |
| **JS/Node**| `crypto.createCipher("des", ...)` | `js-deprecated-des-cipher` | DES Cipher |
| **JS/Node**| `jwt.sign(payload, secret, {algorithm: 'HS256'})` | `js-weak-jwt-secret` | JWT Signing |
| **Go** | `tls.Config{CipherSuites: []uint16{...}}` | `go-insecure-cipher-suite` | TLS Ciphers |
| **C/C++** | `RSA_generate_key(...)` | `c-deprecated-rsa-gen` | RSA Keygen |

---

## 📋 5. CycloneDX 1.6+ CBOM Field Mapping

| CycloneDX Path | Data Type | Purpose & Description |
|----------------|-----------|----------------───────|
| `components[].type` | String | Must be `"cryptographic-asset"`. |
| `components[].name` | String | Name of algorithm, cert, or library (e.g. `"RSA-2048"`). |
| `cryptoProperties.assetType` | String | `"algorithm"` \| `"certificate"` \| `"protocol"` \| `"library"`. |
| `cryptoProperties.algorithmProperties.primitive` | String | `"public-key-encryption"` \| `"signature"` \| `"hash"`. |
| `cryptoProperties.algorithmProperties.nistQuantumSecurityLevel` | Integer | `0` = Quantum Vulnerable; `1-5` = Quantum Safe. |
| `evidence.occurrences[].location` | String | Source file path (e.g. `"src/CryptoService.java"`). |
| `evidence.occurrences[].line` | Integer | Source code line number (e.g. `42`). |

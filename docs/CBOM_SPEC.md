# ECDAT — CycloneDX 1.6+ CBOM Specification Mapping

**Standard Specification:** OWASP CycloneDX v1.6+ (Ratified ECMA-424)  
**Component Type:** `cryptographic-asset`  
**Document Version:** 1.0.0  

---

## 📋 1. CycloneDX CBOM Overview

A **Cryptographic Bill of Materials (CBOM)** is a structured specification for documenting all cryptographic assets, algorithms, keys, certificates, protocols, and cryptographic libraries in a software system.

ECDAT exports CBOM files strictly compliant with **CycloneDX 1.6+ (ECMA-424)** schema requirements.

---

## 🏗️ 2. JSON Root & Metadata Schema

```json
{
  "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
  "bomFormat": "CycloneDX",
  "specVersion": "1.6",
  "serialNumber": "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "version": 1,
  "metadata": {
    "timestamp": "2026-08-29T23:00:00Z",
    "tools": {
      "components": [
        {
          "type": "application",
          "name": "ECDAT Cryptographic Scanner",
          "version": "1.0.0",
          "vendor": "NTRO / Team Mavericks"
        }
      ]
    },
    "component": {
      "type": "application",
      "name": "scanned-target-system",
      "version": "1.0.0"
    }
  },
  "components": [],
  "dependencies": []
}
```

---

## 🔐 3. Component Schema (`cryptographic-asset`)

Every discovered algorithm, key, certificate, or library is represented as a component with `type: "cryptographic-asset"`:

### 3.1 Asymmetric Key Exchange (RSA / ECDH) Component Example
```json
{
  "type": "cryptographic-asset",
  "bom-ref": "crypto-asset-rsa-2048-001",
  "name": "RSA-2048",
  "publisher": "Java Cryptography Architecture (JCA)",
  "cryptoProperties": {
    "assetType": "algorithm",
    "algorithmProperties": {
      "primitive": "public-key-encryption",
      "parameterSetIdentifier": "2048",
      "executionEnvironment": "software",
      "implementationPlatform": "jvm",
      "classicalSecurityLevel": 112,
      "nistQuantumSecurityLevel": 0
    }
  },
  "evidence": {
    "occurrences": [
      {
        "location": "src/main/java/com/ntro/security/CryptoService.java",
        "line": 42,
        "additionalContext": "Cipher.getInstance(\"RSA/ECB/PKCS1Padding\")"
      }
    ]
  },
  "properties": [
    {
      "name": "ecdat:quantum_risk_score",
      "value": "10.0"
    },
    {
      "name": "ecdat:mosca_category",
      "value": "EXPIRED"
    },
    {
      "name": "ecdat:pqc_recommendation",
      "value": "ML-KEM-768 (FIPS 203)"
    }
  ]
}
```

### 3.2 X.509 Certificate Component Example
```json
{
  "type": "cryptographic-asset",
  "bom-ref": "crypto-cert-tls-002",
  "name": "TLS Server Certificate",
  "cryptoProperties": {
    "assetType": "certificate",
    "certificateProperties": {
      "subjectName": "CN=api.internal.ntro.gov.in",
      "issuerName": "CN=NTRO Internal Root CA",
      "notValidBefore": "2024-01-01T00:00:00Z",
      "notValidAfter": "2027-01-01T00:00:00Z",
      "signatureAlgorithmRef": "crypto-asset-sha256-rsa"
    }
  }
}
```

---

## 🔗 4. Dependency & Relationship Mapping

The `dependencies` array details relationships between application components, libraries, and cryptographic primitives:

```json
"dependencies": [
  {
    "ref": "scanned-target-system",
    "dependsOn": [
      "lib-bouncycastle-170"
    ]
  },
  {
    "ref": "lib-bouncycastle-170",
    "provides": [
      "crypto-asset-rsa-2048-001"
    ]
  }
]
```

---

## 🔬 5. NIST Quantum Security Level Mapping

| `nistQuantumSecurityLevel` | NIST Metric Definition | Target Algorithms |
|----------------------------|------------------------|-------------------|
| `0` | **Quantum Vulnerable** (Broken by Shor / Grover) | RSA (all key lengths), ECDH, ECDSA, SHA-1, MD5 |
| `1` | Equivalent to AES-128 key search (Level 1) | AES-128, ML-KEM-512, ML-DSA-44 |
| `2` | Equivalent to SHA-256 collision search (Level 2) | SHA-256, AES-192 |
| `3` | Equivalent to AES-192 key search (Level 3) | **ML-KEM-768**, **ML-DSA-65** (Default PQC) |
| `4` | Equivalent to SHA-384 collision search (Level 4) | SHA-384 |
| `5` | Equivalent to AES-256 key search (Level 5) | AES-256-GCM, ML-KEM-1024, ML-DSA-87 |

import json
import re
from pathlib import Path

from scanner.detectors.base import IGNORE_DIRS, CryptoFinding, iter_files, rel_path

CODE_EXTENSIONS = {".py", ".java", ".js", ".ts", ".jsx", ".tsx", ".go", ".rs", ".c", ".cpp", ".h", ".cs", ".php", ".rb"}

PATTERNS = [
    (r'Cipher\.getInstance\s*\(\s*["\']([^"\']+)["\']', "java-jce", 0.95),
    (r'KeyPairGenerator\.getInstance\s*\(\s*["\']([^"\']+)["\']', "java-keygen", 0.92),
    (r'KeyGenerator\.getInstance\s*\(\s*["\']([^"\']+)["\']', "java-keygen", 0.92),
    (r'Signature\.getInstance\s*\(\s*["\']([^"\']+)["\']', "java-signature", 0.9),
    (r'MessageDigest\.getInstance\s*\(\s*["\']([^"\']+)["\']', "java-digest", 0.9),
    (r'getInstance\s*\(\s*["\']([^"\']*(?:RSA|AES|DES|ECB|CBC|GCM)[^"\']*)["\']', "jce", 0.9),
    (r'hashlib\.(md5|sha1|sha256|sha512)\s*\(', "python-hash", 0.9),
    (r'from cryptography|import cryptography|from Crypto\.|import Crypto', "python-crypto-lib", 0.85),
    (r'AES\.new\s*\(|RSA\.generate\s*\(|rsa\.generate', "pyca", 0.9),
    (r'crypto\.create(Cipher|Cipheriv|Decipher|Hash|Sign)', "node-crypto", 0.9),
    (r'jsonwebtoken|jwt\.sign|RS256|HS256|ES256', "jwt", 0.85),
    (r'openssl|BouncyCastle|bcprov|javax\.crypto', "crypto-lib-ref", 0.8),
    (r'"crypto/tls"|crypto/tls', "go-tls", 0.9),
    (r'tls\.(Config|VersionTLS\d+|CipherSuites)', "go-tls-config", 0.88),
    (r'TLS_[A-Z0-9_]+(?:RC4|3DES|DES|EXPORT|NULL)', "go-tls-cipher", 0.9),
    (r'InsecureSkipVerify\s*:\s*true', "go-tls-insecure", 0.92),
    (r'\b(RSA-2048|RSA-4096|AES-128|AES-256|ECDSA|ECDH|Ed25519|X25519|ML-KEM|ML-DSA|SHA-1|SHA-256|SHA3-\d+|MD5|3DES|DES)\b', "algo-name", 0.75),
    (r'\b(Kyber\d+|Dilithium\d+|SPHINCS\+[^\s"\']+)\b', "pqc-legacy", 0.85),
    (r'OQS_(KEM|SIG)_alg_', "oqs-ref", 0.85),
    (r'TLSv1\.[01]|TLS 1\.0|TLS 1\.1|ssl_protocols.*TLSv1', "weak-tls", 0.9),
    (r'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY', "private-key", 0.95),
    (r'BEGIN CERTIFICATE', "certificate-marker", 0.95),
]

ALGO_FROM_MATCH = {
    "md5": ("MD5", "hash"),
    "sha1": ("SHA-1", "hash"),
    "sha256": ("SHA-256", "hash"),
    "sha512": ("SHA-512", "hash"),
}


def detect_source(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    for file_path in iter_files(root):
        if file_path.suffix.lower() not in CODE_EXTENSIONS and file_path.name not in (
            "nginx.conf", "java.security", "openssl.cnf"
        ):
            continue
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        rel = rel_path(root, file_path)
        for line_no, line in enumerate(text.splitlines(), start=1):
            for pattern, method, confidence in PATTERNS:
                for match in re.finditer(pattern, line, re.IGNORECASE):
                    groups = match.groups()
                    algo = groups[0] if groups else match.group(0)
                    if method == "python-hash" and algo:
                        name, primitive = ALGO_FROM_MATCH.get(algo.lower(), (algo.upper(), "hash"))
                    elif method == "private-key":
                        name, primitive = "Private Key Material", "related-crypto-material"
                        findings.append(
                            CryptoFinding(
                                name=name,
                                asset_type="related-crypto-material",
                                algorithm="PRIVATE-KEY",
                                primitive=primitive,
                                file_path=rel,
                                line_number=line_no,
                                detection_method=method,
                                confidence=confidence,
                                evidence_snippet=line.strip()[:200],
                            )
                        )
                        continue
                    elif method == "certificate-marker":
                        continue
                    else:
                        name = algo.upper() if isinstance(algo, str) and len(algo) < 40 else algo
                        primitive = "encryption" if any(x in str(algo).upper() for x in ("RSA", "AES", "DES")) else "unknown"

                    findings.append(
                        CryptoFinding(
                            name=str(name)[:128],
                            asset_type="algorithm",
                            algorithm=str(name)[:128],
                            primitive=primitive,
                            file_path=rel,
                            line_number=line_no,
                            detection_method=method,
                            confidence=confidence,
                            evidence_snippet=line.strip()[:200],
                        )
                    )
    return findings


def detect_manifests(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    manifest_map = {
        "package.json": "npm",
        "requirements.txt": "pypi",
        "Pipfile": "pypi",
        "go.mod": "go",
        "Cargo.toml": "rust",
        "pom.xml": "maven",
    }
    crypto_libs = [
        ("openssl", "OpenSSL"),
        ("bouncycastle", "BouncyCastle"),
        ("cryptography", "pyca/cryptography"),
        ("pycryptodome", "PyCryptodome"),
        ("node-forge", "node-forge"),
        ("jsonwebtoken", "jsonwebtoken"),
        ("bcrypt", "bcrypt"),
        ("libsodium", "libsodium"),
        ("ring", "ring"),
        ("rustls", "rustls"),
        ("golang.org/x/crypto", "golang.org/x/crypto"),
    ]

    for fname, ecosystem in manifest_map.items():
        for path in root.rglob(fname):
            if any(p in IGNORE_DIRS for p in path.parts):
                continue
            try:
                content = path.read_text(encoding="utf-8", errors="ignore").lower()
            except OSError:
                continue
            rel = rel_path(root, path)
            for needle, lib_name in crypto_libs:
                if needle in content:
                    findings.append(
                        CryptoFinding(
                            name=lib_name,
                            asset_type="library",
                            library_name=lib_name,
                            file_path=rel,
                            detection_method=f"manifest-{ecosystem}",
                            confidence=0.92,
                            evidence_snippet=f"{needle} referenced in {fname}",
                            raw_metadata={"ecosystem": ecosystem},
                        )
                    )
            if fname == "package.json":
                try:
                    data = json.loads(path.read_text(encoding="utf-8"))
                    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                    for dep, version in deps.items():
                        for needle, lib_name in crypto_libs:
                            if needle in dep.lower():
                                findings.append(
                                    CryptoFinding(
                                        name=f"{lib_name}@{version}",
                                        asset_type="library",
                                        library_name=lib_name,
                                        library_version=str(version),
                                        file_path=rel,
                                        detection_method="package-json",
                                        confidence=0.95,
                                        evidence_snippet=f"{dep}: {version}",
                                    )
                                )
                except json.JSONDecodeError:
                    pass
    return findings

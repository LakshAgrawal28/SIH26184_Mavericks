"""Deterministic cryptographic signatures used by the catalog detector.

Each API entry is (regex, algorithm, primitive, asset_type, confidence).
Algorithm may be None to take the first capture group (then normalised).
"""
from __future__ import annotations

# Language-agnostic and language-specific source APIs seen in real GitHub repos.
API_SIGNATURES: list[tuple[str, str | None, str, str, float]] = [
    # Java / Kotlin / Scala JCA-JCE / JSSE
    (r'Cipher\.getInstance\s*\(\s*["\']([^"\']+)["\']', None, "encryption", "algorithm", 0.95),
    (r'KeyPairGenerator\.getInstance\s*\(\s*["\']([^"\']+)["\']', None, "pke", "algorithm", 0.93),
    (r'KeyGenerator\.getInstance\s*\(\s*["\']([^"\']+)["\']', None, "encryption", "algorithm", 0.92),
    (r'Signature\.getInstance\s*\(\s*["\']([^"\']+)["\']', None, "signature", "algorithm", 0.92),
    (r'MessageDigest\.getInstance\s*\(\s*["\']([^"\']+)["\']', None, "hash", "algorithm", 0.92),
    (r'Mac\.getInstance\s*\(\s*["\']([^"\']+)["\']', None, "mac", "algorithm", 0.9),
    (r'SSLContext\.getInstance\s*\(\s*["\']([^"\']+)["\']', None, "protocol", "protocol", 0.93),
    (r'KeyManagerFactory\.getInstance\s*\(', "TLS", "protocol", "protocol", 0.85),
    (r'TrustManagerFactory\.getInstance\s*\(', "TLS", "protocol", "protocol", 0.85),
    (r'SecretKeySpec\s*\(', "AES", "block-cipher", "algorithm", 0.82),
    (r'X509Certificate|X509TrustManager', "X.509", "certificate", "certificate", 0.8),
    (r'javax\.crypto|java\.security\.cert|org\.bouncycastle', "JCE", "library", "library", 0.8),
    (r'BouncyCastleProvider|bcprov', "BouncyCastle", "library", "library", 0.88),
    (r'HttpsURLConnection|setHostnameVerifier', "TLS", "protocol", "protocol", 0.78),
    # Python
    (r'hashlib\.(md5|sha1|sha224|sha256|sha384|sha512|blake2b|blake2s|sha3_\d+)\s*\(', None, "hash", "algorithm", 0.93),
    (r'hmac\.new\s*\(', "HMAC", "mac", "algorithm", 0.88),
    (r'ssl\.SSLContext|ssl\.wrap_socket|PROTOCOL_TLS|PROTOCOL_SSLv', "TLS", "protocol", "protocol", 0.9),
    (r'ssl\._create_unverified_context|CERT_NONE', "TLS-InsecureSkipVerify", "protocol", "protocol", 0.94),
    (r'verify\s*=\s*False', "TLS-InsecureSkipVerify", "protocol", "protocol", 0.86),
    (r'rsa\.generate_private_key|RSA\.generate|load_pem_private_key', "RSA", "pke", "algorithm", 0.9),
    (r'algorithms\.AES|AES\.new\s*\(|modes\.(CBC|GCM|ECB)', "AES", "block-cipher", "algorithm", 0.9),
    (r'from Cryptodome|from Crypto\.|import cryptography|hazmat\.primitives', "pyca/cryptography", "library", "library", 0.86),
    (r'jwt\.(encode|decode|sign)|PyJWT', "JWT", "signature", "algorithm", 0.88),
    (r'bcrypt\.(hashpw|gensalt)|argon2', "BCRYPT", "kdf", "algorithm", 0.85),
    (r'paramiko|nacl\.|PyNaCl|cryptography\.fernet', "lib", "library", "library", 0.8),
    # Node / Web Crypto
    (r'crypto\.create(Cipher|Cipheriv|Decipher|Decipheriv|Hash|Hmac|Sign|Verify|PrivateKey|PublicKey)', "Node-crypto", "encryption", "algorithm", 0.9),
    (r'createHash\s*\(\s*["\'](md5|sha1|sha256|sha384|sha512)["\']', None, "hash", "algorithm", 0.93),
    (r'createHmac\s*\(\s*["\']([^"\']+)["\']', None, "mac", "algorithm", 0.9),
    (r'crypto\.subtle\.(encrypt|decrypt|sign|verify|digest|generateKey)', "WebCrypto", "encryption", "algorithm", 0.88),
    (r'algorithm\s*:\s*["\'](HS256|HS384|HS512|RS256|RS384|ES256|ES384|PS256)["\']', None, "signature", "algorithm", 0.92),
    (r'require\s*\(\s*["\']crypto["\']\)|from ["\']node:crypto["\']', "Node-crypto", "library", "library", 0.8),
    (r'jsonwebtoken|jose\.|jwt\.sign', "JWT", "signature", "algorithm", 0.88),
    (r'bcryptjs|bcrypt\.hash|argon2\.hash', "BCRYPT", "kdf", "algorithm", 0.85),
    (r'node-forge|forge\.(pki|md|cipher)', "node-forge", "library", "library", 0.86),
    (r'tweetnacl|libsodium|sodium\.', "libsodium", "library", "library", 0.84),
    # Go
    (r'crypto/(rsa|tls|x509|ecdsa|ed25519|md5|sha1|sha256|elliptic|hmac|aes|des)', None, "unknown", "algorithm", 0.9),
    (r'tls\.Config|tls\.VersionTLS|InsecureSkipVerify', "TLS", "protocol", "protocol", 0.9),
    (r'rsa\.GenerateKey|x509\.CreateCertificate', "RSA", "pke", "algorithm", 0.9),
    (r'golang\.org/x/crypto', "golang.org/x/crypto", "library", "library", 0.88),
    # C / OpenSSL / mbedTLS
    (r'EVP_(PKEY|Digest|Encrypt|Decrypt|aes_|sha)', "OpenSSL-EVP", "encryption", "algorithm", 0.86),
    (r'RSA_generate_key|PEM_read_.*PrivateKey', "RSA", "pke", "algorithm", 0.88),
    (r'mbedtls_(ssl|aes|rsa|md)', "mbedTLS", "library", "library", 0.86),
    (r'CCCrypt|SecKey(Create|Encrypt)', "Apple-Crypto", "encryption", "algorithm", 0.8),
    # .NET
    (r'RSA\.Create|RSACryptoServiceProvider|SHA256\.Create|Aes\.Create|HMACSHA256|X509Certificate2', "RSA", "pke", "algorithm", 0.88),
    (r'System\.Security\.Cryptography', "JCE", "library", "library", 0.8),
    # PHP / Ruby
    (r'openssl_(encrypt|decrypt|pkey_|sign|verify|random_pseudo_bytes)', "OpenSSL", "encryption", "algorithm", 0.88),
    (r'password_hash\s*\(|password_verify\s*\(', "PASSWORD-HASH", "kdf", "algorithm", 0.84),
    (r'\bmd5\s*\(|\bsha1\s*\(', "MD5", "hash", "algorithm", 0.75),
    (r'OpenSSL::(PKey|Cipher|Digest|SSL)', "OpenSSL", "library", "library", 0.86),
    (r'Digest::(MD5|SHA1|SHA256)', None, "hash", "algorithm", 0.88),
    # Rust
    (r'\b(aes_gcm|aes-gcm|ring::|rustls|sha2::|ed25519_dalek|x25519_dalek|openssl::)', "Rust-crypto", "library", "library", 0.84),
    # Generic KDF / protocol
    (r'PBKDF2|pkcs5\.pbkdf2|pbkdf2Sync', "PBKDF2", "kdf", "algorithm", 0.86),
    (r'scrypt\s*\(|scryptSync', "SCRYPT", "kdf", "algorithm", 0.84),
    (r'TLSv1\.[01]\b|TLS 1\.0|TLS 1\.1|SSLv[23]', "TLS-1.0", "protocol", "protocol", 0.9),
]

CONFIG_SIGNATURES: list[tuple[str, str, str, str, float]] = [
    (r'ssl_protocols|ssl_ciphers|ssl_certificate', "TLS", "protocol", "protocol", 0.9),
    (r'server\.ssl\.|ssl\.key-store|keystore\.jks', "TLS", "protocol", "protocol", 0.88),
    (r'min_tls_version|minProtocolVersion|tls_min_version', "TLS", "protocol", "protocol", 0.86),
    (r'NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*0', "TLS-InsecureSkipVerify", "protocol", "protocol", 0.95),
    (r'insecureSkipVerify|rejectUnauthorized\s*:\s*false', "TLS-InsecureSkipVerify", "protocol", "protocol", 0.92),
    (r'https\s*:\s*true|listen\s+443', "TLS", "protocol", "protocol", 0.7),
    (r'BEGIN (RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY', "PRIVATE-KEY", "related-crypto-material", "related-crypto-material", 0.96),
    (r'BEGIN CERTIFICATE', "X.509", "certificate", "certificate", 0.9),
]

# (suffix or exact name lower, algorithm, asset_type)
FILENAME_HINTS: list[tuple[str, str, str]] = [
    (".jks", "Java-Keystore", "related-crypto-material"),
    (".p12", "PKCS12", "related-crypto-material"),
    (".pfx", "PKCS12", "related-crypto-material"),
    (".jceks", "Java-Keystore", "related-crypto-material"),
    (".keystore", "Java-Keystore", "related-crypto-material"),
    (".truststore", "Java-Keystore", "related-crypto-material"),
    (".p8", "PRIVATE-KEY", "related-crypto-material"),
    (".p7b", "X.509", "certificate"),
]

FILENAME_EXACT = {
    "id_rsa": ("RSA", "related-crypto-material"),
    "id_ecdsa": ("ECDSA", "related-crypto-material"),
    "id_ed25519": ("Ed25519", "related-crypto-material"),
    "id_dsa": ("DSA", "related-crypto-material"),
}

# Manifest / lockfile package needles (lowercase). Keep specific — never "crypto" alone.
CRYPTO_PACKAGES: list[tuple[str, str]] = [
    ("jsonwebtoken", "jsonwebtoken"),
    ("pyjwt", "PyJWT"),
    ("djangorestframework-simplejwt", "simplejwt"),
    ("bcrypt", "bcrypt"),
    ("bcryptjs", "bcryptjs"),
    ("argon2", "argon2"),
    ("node-forge", "node-forge"),
    ("crypto-js", "crypto-js"),
    ("libsodium", "libsodium"),
    ("tweetnacl", "tweetnacl"),
    ("tweetnacl-util", "tweetnacl"),
    ("noble-ed25519", "noble-ed25519"),
    ("@peculiar/webcrypto", "WebCrypto"),
    ("webcrypto", "WebCrypto"),
    ("openssl", "OpenSSL"),
    ("pyopenssl", "pyOpenSSL"),
    ("cryptography", "pyca/cryptography"),
    ("pycryptodome", "PyCryptodome"),
    ("pycrypto", "PyCrypto"),
    ("paramiko", "Paramiko"),
    ("pynacl", "PyNaCl"),
    ("passlib", "passlib"),
    ("bcrypt", "bcrypt"),
    ("spring-security-crypto", "Spring-Security"),
    ("spring-boot-starter-security", "Spring-Security"),
    ("bouncycastle", "BouncyCastle"),
    ("bcprov", "BouncyCastle"),
    ("bcpkix", "BouncyCastle"),
    ("jasypt", "Jasypt"),
    ("google.crypto.tink", "Tink"),
    ("tink-java", "Tink"),
    ("golang.org/x/crypto", "golang.org/x/crypto"),
    ("software.amazon.awssdk.services.kms", "AWS-KMS"),
    ("aws-kms", "AWS-KMS"),
    ("@aws-crypto", "AWS-KMS"),
    ("google-cloud-kms", "GCP-KMS"),
    ("azure-security-keyvault", "Azure-KeyVault"),
    ("hvac", "HashiCorp-Vault"),
    ("hashicorp/vault", "HashiCorp-Vault"),
    ("rustls", "rustls"),
    ("aes-gcm", "AES-GCM"),
    ("ed25519-dalek", "Ed25519"),
    ("openssl-sys", "OpenSSL"),
    ("mbedtls", "mbedTLS"),
    ("wolfssl", "wolfSSL"),
    ("libsodium-sys", "libsodium"),
    ("oqs", "liboqs"),
    ("liboqs", "liboqs"),
    ("pqcrypto", "pqcrypto"),
    ("circl", "CIRCL"),
]

ALGO_NORMALIZE = {
    "md5": "MD5",
    "sha1": "SHA-1",
    "sha-1": "SHA-1",
    "sha224": "SHA-224",
    "sha256": "SHA-256",
    "sha384": "SHA-384",
    "sha512": "SHA-512",
    "sha3_256": "SHA3-256",
    "sha3-256": "SHA3-256",
    "blake2b": "BLAKE2",
    "blake2s": "BLAKE2",
    "rsa": "RSA",
    "aes": "AES",
    "des": "DES",
    "tls": "TLS",
    "ecdsa": "ECDSA",
    "x509": "X.509",
    "md5": "MD5",
    "hs256": "HS256",
    "rs256": "RS256",
    "es256": "ES256",
    "hs384": "HS384",
    "hs512": "HS512",
    "digest::md5": "MD5",
    "digest::sha1": "SHA-1",
    "digest::sha256": "SHA-256",
    "crypto/rsa": "RSA",
    "crypto/tls": "TLS",
    "crypto/md5": "MD5",
    "crypto/sha1": "SHA-1",
    "crypto/ecdsa": "ECDSA",
    "crypto/ed25519": "Ed25519",
    "crypto/x509": "X.509",
    "crypto/aes": "AES",
    "crypto/des": "DES",
}


def normalise_algorithm(raw: str | None, fallback: str) -> str:
    if not raw:
        return fallback
    key = raw.strip().lower().replace(" ", "")
    if key in ALGO_NORMALIZE:
        return ALGO_NORMALIZE[key]
    # Java transformation RSA/ECB/PKCS1Padding
    upper = raw.strip()
    if "/" in upper:
        return upper.split("/")[0].upper()[:64]
    return upper[:64]

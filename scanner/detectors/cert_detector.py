import re
from datetime import datetime, timezone
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.backends import default_backend

from scanner.detectors.base import CryptoFinding, iter_files, rel_path


def detect_certificates(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    # Real repos name certs server.cert, fullchain.pem, id_rsa — do not require an extension.
    cert_ext = {".pem", ".crt", ".cer", ".der", ".cert", ".key", ".pub", ".cacert"}

    for file_path in iter_files(root):
        suffix = file_path.suffix.lower()
        try:
            size = file_path.stat().st_size
            if size > 2_000_000:
                continue
            # Cheap sniff: only fully parse likely PEM/text.
            head = file_path.read_bytes()[:8000]
        except OSError:
            continue

        if b"BEGIN CERTIFICATE" not in head and b"BEGIN" not in head:
            continue
        if b"PRIVATE KEY" in head and b"BEGIN CERTIFICATE" not in head:
            try:
                text = file_path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            rel = rel_path(root, file_path)
            findings.append(
                CryptoFinding(
                    name="Private Key Material",
                    asset_type="related-crypto-material",
                    algorithm="PRIVATE-KEY",
                    primitive="related-crypto-material",
                    file_path=rel,
                    detection_method="pem-marker",
                    confidence=0.94,
                    evidence_snippet="PEM private key block",
                )
            )
            continue
        if b"BEGIN CERTIFICATE" not in head:
            continue

        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        rel = rel_path(root, file_path)

        for block in re.findall(
            r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----",
            text,
            re.DOTALL,
        ):
            try:
                cert = x509.load_pem_x509_certificate(block.encode(), default_backend())
                pub = cert.public_key()
                key_size = getattr(pub, "key_size", None)
                sig_algo = cert.signature_algorithm_oid._name if cert.signature_algorithm_oid else "unknown"
                subject = cert.subject.rfc4514_string()
                issuer = cert.issuer.rfc4514_string()
                not_after = cert.not_valid_after_utc.replace(tzinfo=timezone.utc)
                days_left = (not_after - datetime.now(timezone.utc)).days

                algo_name = f"X.509-{sig_algo}"
                if key_size:
                    algo_name += f"-{key_size}"

                suffix = ""
                if days_left < 0:
                    suffix = " [EXPIRED]"
                elif days_left < 30:
                    suffix = " [CRITICAL-EXPIRY]"
                elif days_left < 90:
                    suffix = " [EXPIRY-WARNING]"

                findings.append(
                    CryptoFinding(
                        name=f"Certificate: {subject[:80]}{suffix}",
                        asset_type="certificate",
                        algorithm=algo_name,
                        primitive="certificate",
                        key_size=str(key_size) if key_size else None,
                        file_path=rel,
                        detection_method="x509-parser",
                        confidence=0.98,
                        evidence_snippet=f"Subject: {subject}; Expires in {days_left} days",
                        raw_metadata={
                            "subjectName": subject,
                            "issuerName": issuer,
                            "notValidAfter": not_after.isoformat(),
                            "signatureAlgorithm": sig_algo,
                            "daysUntilExpiry": days_left,
                            "days_to_expiry": days_left,
                        },
                    )
                )
            except Exception:
                findings.append(
                    CryptoFinding(
                        name="X.509 Certificate (unparsed)",
                        asset_type="certificate",
                        algorithm="X.509",
                        file_path=rel,
                        detection_method="pem-marker",
                        confidence=0.7,
                        evidence_snippet=block[:120],
                    )
                )
    return findings


def detect_configs(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    config_names = {
        "nginx.conf", "apache2.conf", "java.security", "openssl.cnf", "httpd.conf",
        "dockerfile", "docker-compose.yml", "docker-compose.yaml", "caddyfile",
        "application.properties", "application.yml", "application.yaml",
    }
    config_ext = {".conf", ".cnf", ".yml", ".yaml", ".properties", ".env", ".ini", ".tf"}

    for file_path in iter_files(root):
        name_l = file_path.name.lower()
        if (
            name_l not in config_names
            and file_path.suffix.lower() not in config_ext
            and not name_l.startswith("docker-compose")
            and not name_l.startswith("application-")
        ):
            continue
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        rel = rel_path(root, file_path)
        for line_no, line in enumerate(text.splitlines(), start=1):
            if re.search(r"TLSv1\.[01]|TLS 1\.0|TLS 1\.1|SSLv2|SSLv3", line, re.I):
                findings.append(
                    CryptoFinding(
                        name="Weak TLS Protocol",
                        asset_type="protocol",
                        algorithm="TLS-1.0/1.1",
                        primitive="protocol",
                        file_path=rel,
                        line_number=line_no,
                        detection_method="config-scanner",
                        confidence=0.92,
                        evidence_snippet=line.strip()[:200],
                    )
                )
            if re.search(r"DES|3DES|RC4|MD5|EXPORT", line, re.I) and "cipher" in line.lower():
                findings.append(
                    CryptoFinding(
                        name="Weak Cipher Suite",
                        asset_type="protocol",
                        algorithm="WEAK-CIPHER",
                        file_path=rel,
                        line_number=line_no,
                        detection_method="config-scanner",
                        confidence=0.85,
                        evidence_snippet=line.strip()[:200],
                    )
                )
    return findings

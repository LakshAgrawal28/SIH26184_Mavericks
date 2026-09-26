"""Catalog detector: scan first-party text for known crypto APIs, config keys, and keystore names.

This is the layer that makes a random GitHub zip produce artefacts — not by guessing
algorithms, only by matching a reviewed catalog.
"""
from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from scanner.catalog.signatures import (
    API_SIGNATURES,
    CONFIG_SIGNATURES,
    FILENAME_EXACT,
    FILENAME_HINTS,
    SSL_CIPHERS_RE,
    SSL_PROTOCOLS_RE,
    normalise_algorithm,
)
from scanner.detectors.base import CryptoFinding, iter_files, rel_path

TEXT_SUFFIXES = {
    ".py", ".pyi", ".java", ".kt", ".kts", ".scala", ".groovy",
    ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx",
    ".go", ".rs", ".c", ".cc", ".cpp", ".h", ".hpp",
    ".cs", ".fs", ".php", ".rb", ".swift", ".m",
    ".conf", ".cnf", ".cfg", ".ini", ".toml", ".env",
    ".yml", ".yaml", ".xml", ".properties", ".gradle",
    ".tf", ".hcl", ".json", ".plist",
}

SKIP_SUFFIXES = {".map", ".min.js", ".min.css", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".woff", ".woff2", ".ttf"}
MAX_FILE_BYTES = 1_000_000
MAX_HITS_PER_FILE = 14
JWT_ALG_NAMES = {
    "HS256", "HS384", "HS512",
    "RS256", "RS384", "RS512",
    "ES256", "ES384", "ES512",
    "PS256", "PS384", "PS512",
}
_SSL_CIPHERS = re.compile(SSL_CIPHERS_RE, re.IGNORECASE)
_SSL_PROTOCOLS = re.compile(SSL_PROTOCOLS_RE, re.IGNORECASE)


@lru_cache(maxsize=1)
def _compiled_api():
    return [
        (re.compile(pat, re.IGNORECASE), algo, prim, atype, conf)
        for pat, algo, prim, atype, conf in API_SIGNATURES
    ]


@lru_cache(maxsize=1)
def _compiled_config():
    return [
        (re.compile(pat, re.IGNORECASE), algo, prim, atype, conf)
        for pat, algo, prim, atype, conf in CONFIG_SIGNATURES
    ]


def detect_catalog(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    findings.extend(_filename_hints(root))
    api = _compiled_api()
    cfg = _compiled_config()
    for path in iter_files(root):
        suffix = path.suffix.lower()
        if suffix in SKIP_SUFFIXES:
            continue
        name_l = path.name.lower()
        is_text = suffix in TEXT_SUFFIXES or name_l in {
            "dockerfile", "makefile", "jenkinsfile", "vagrantfile",
        } or name_l.startswith("docker-compose") or name_l.startswith(".env")
        if not is_text:
            continue
        try:
            if path.stat().st_size > MAX_FILE_BYTES:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        rel = rel_path(root, path)
        hits = 0
        seen_line_family: set[tuple] = set()
        for line_no, line in enumerate(text.splitlines(), start=1):
            if hits >= MAX_HITS_PER_FILE:
                break
            if len(line) > 4000:
                continue
            for compiled, algo, prim, atype, conf in api + cfg:
                if hits >= MAX_HITS_PER_FILE:
                    break
                match = compiled.search(line)
                if not match:
                    continue
                captured = match.group(1) if match.lastindex else None
                name = normalise_algorithm(captured, algo or match.group(0)[:64])
                extra = _tls_nginx_findings(line, line_no, rel, compiled)
                if extra is not None:
                    for finding in extra:
                        family = (finding.algorithm or finding.name or "")[:24].upper()
                        key = (line_no, family, finding.asset_type)
                        if key in seen_line_family:
                            continue
                        seen_line_family.add(key)
                        findings.append(finding)
                        hits += 1
                    continue
                family = (name or "")[:24].upper()
                key = (line_no, family, atype)
                if key in seen_line_family:
                    continue
                seen_line_family.add(key)
                meta: dict = {"engine": "ecdat-catalog", "catalog": "api-config"}
                if (name or "").upper() in JWT_ALG_NAMES:
                    meta["jwt_alg"] = str(name).upper()
                findings.append(
                    CryptoFinding(
                        name=str(name)[:128],
                        asset_type=atype,
                        algorithm=str(name)[:128],
                        primitive=prim,
                        file_path=rel,
                        line_number=line_no,
                        detection_method="catalog-api",
                        confidence=conf,
                        evidence_snippet=line.strip()[:200],
                        raw_metadata=meta,
                    )
                )
                hits += 1
    return findings


def _tls_nginx_findings(
    line: str,
    line_no: int,
    rel: str,
    compiled: re.Pattern,
) -> list[CryptoFinding] | None:
    """Expand nginx ssl_ciphers / ssl_protocols; otherwise None to use the generic emit."""
    pattern = compiled.pattern
    if "ssl_ciphers" in pattern:
        return _ssl_cipher_findings(line, line_no, rel)
    if "ssl_protocols" in pattern:
        return _ssl_protocol_findings(line, line_no, rel)
    return None


def _ssl_cipher_findings(line: str, line_no: int, rel: str) -> list[CryptoFinding]:
    match = _SSL_CIPHERS.search(line)
    if not match:
        return []
    suites = match.group(1).strip()
    upper = suites.upper()
    out: list[CryptoFinding] = [
        _tls_finding("TLS", line, line_no, rel, 0.92, {"cipher_suite": suites[:240]})
    ]
    if "RC4" in upper:
        out.append(_tls_finding("RC4", line, line_no, rel, 0.94, {"cipher_suite": "RC4"}))
    if "3DES" in upper or "DES-CBC3" in upper:
        out.append(_tls_finding("3DES", line, line_no, rel, 0.94, {"cipher_suite": "3DES"}))
    elif re.search(r"(?<![A-Z0-9])DES(?![A-Z0-9])|DES-", upper) and "3DES" not in upper:
        out.append(_tls_finding("DES", line, line_no, rel, 0.93, {"cipher_suite": "DES"}))
    if "MD5" in upper:
        out.append(_tls_finding("MD5", line, line_no, rel, 0.93, {"cipher_suite": "MD5"}))
    return out


def _ssl_protocol_findings(line: str, line_no: int, rel: str) -> list[CryptoFinding]:
    match = _SSL_PROTOCOLS.search(line)
    if not match:
        return []
    protos = match.group(1).strip()
    tokens = [t.upper() for t in re.findall(r"TLSv?1(?:\.\d)?|SSLv?\d", protos, re.I)]
    modern = {"TLSV1.2", "TLSV1.3", "TLS1.2", "TLS1.3"}
    old = {"TLSV1", "TLS1", "TLSV1.1", "TLS1.1", "SSLV2", "SSLV3", "SSL2", "SSL3"}
    has_old = any(t in old for t in tokens)
    modern_only = bool(tokens) and all(t in modern for t in tokens)
    out = [_tls_finding("TLS", line, line_no, rel, 0.92, {"cipher_suite": None})]
    if has_old and not modern_only:
        out.append(_tls_finding("TLS-1.0", line, line_no, rel, 0.94, {"cipher_suite": None}))
    return out


def _tls_finding(
    algorithm: str,
    line: str,
    line_no: int,
    rel: str,
    confidence: float,
    extra: dict,
) -> CryptoFinding:
    meta = {"engine": "ecdat-catalog", "catalog": "tls-nginx", **extra}
    return CryptoFinding(
        name=algorithm,
        asset_type="protocol",
        algorithm=algorithm,
        primitive="protocol",
        file_path=rel,
        line_number=line_no,
        detection_method="catalog-api",
        confidence=confidence,
        evidence_snippet=line.strip()[:200],
        raw_metadata=meta,
    )


def _filename_hints(root: Path) -> list[CryptoFinding]:
    out: list[CryptoFinding] = []
    for path in iter_files(root):
        rel = rel_path(root, path)
        lower = path.name.lower()
        suffix = path.suffix.lower()
        hit = FILENAME_EXACT.get(lower)
        algo = atype = None
        if hit:
            algo, atype = hit
        else:
            for ext, a, t in FILENAME_HINTS:
                if suffix == ext or lower.endswith(ext):
                    algo, atype = a, t
                    break
        if not algo:
            continue
        out.append(
            CryptoFinding(
                name=f"{algo} material ({path.name})",
                asset_type=atype,
                algorithm=algo,
                primitive=atype,
                file_path=rel,
                detection_method="filename-hint",
                confidence=0.84,
                evidence_snippet=f"Cryptographic material indicated by filename {path.name}",
                raw_metadata={"engine": "ecdat-catalog", "catalog": "filename"},
            )
        )
    return out

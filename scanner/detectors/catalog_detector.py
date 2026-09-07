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
                family = (name or "")[:24].upper()
                key = (line_no, family, atype)
                if key in seen_line_family:
                    continue
                seen_line_family.add(key)
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
                        raw_metadata={"engine": "ecdat-catalog", "catalog": "api-config"},
                    )
                )
                hits += 1
    return findings


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

"""Execute ECDAT Semgrep rule pack (CLI when present, in-process otherwise)."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

from scanner.detectors.base import CryptoFinding, IGNORE_DIRS, rel_path

RULES_DIR = Path(__file__).resolve().parents[1] / "rules"

LANG_EXTENSIONS = {
    "java": {".java"},
    "python": {".py"},
    "javascript": {".js", ".jsx", ".mjs", ".cjs"},
    "typescript": {".ts", ".tsx"},
    "go": {".go"},
}

_QUOTED = re.compile(r'"([^"]+)"')


def rules_dir() -> Path:
    return RULES_DIR


def semgrep_available() -> bool:
    return shutil.which("semgrep") is not None


def detect_semgrep(root: Path) -> list[CryptoFinding]:
    if not RULES_DIR.is_dir():
        return []
    cli_findings = _run_semgrep_cli(root)
    if cli_findings is not None:
        return cli_findings
    return _run_rules_engine(root)


def _run_semgrep_cli(root: Path) -> list[CryptoFinding] | None:
    if not semgrep_available():
        return None
    try:
        result = subprocess.run(
            [
                "semgrep",
                "--config",
                str(RULES_DIR),
                "--json",
                "--quiet",
                "--disable-version-check",
                "--metrics=off",
                str(root),
            ],
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode not in (0, 1) or not result.stdout.strip():
        return None
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        return None
    findings: list[CryptoFinding] = []
    for row in payload.get("results") or []:
        finding = _finding_from_semgrep_result(root, row)
        if finding:
            findings.append(finding)
    return findings


def _finding_from_semgrep_result(root: Path, row: dict[str, Any]) -> CryptoFinding | None:
    extra = row.get("extra") or {}
    metadata = extra.get("metadata") or {}
    path = row.get("path") or ""
    try:
        rel = rel_path(root, Path(path))
    except Exception:
        rel = path
    start = row.get("start") or {}
    line_no = int(start.get("line") or 0) or None
    evidence = (extra.get("lines") or extra.get("message") or "")[:200]
    algorithm = str(metadata.get("algorithm") or _algorithm_from_evidence(evidence) or "CRYPTO")
    primitive = str(metadata.get("primitive") or "unknown")
    asset_type = str(metadata.get("asset_type") or "algorithm")
    if asset_type not in ("algorithm", "certificate", "protocol", "related-crypto-material", "library"):
        asset_type = "algorithm"
    confidence = float(metadata.get("ecdat_confidence") or 0.95)
    mode = metadata.get("mode")
    return CryptoFinding(
        name=algorithm,
        asset_type=asset_type,
        algorithm=algorithm,
        primitive=primitive,
        mode=str(mode) if mode else None,
        file_path=rel,
        line_number=line_no,
        detection_method="semgrep",
        confidence=confidence,
        evidence_snippet=evidence.strip(),
        raw_metadata={
            "rule_id": row.get("check_id"),
            "severity": extra.get("severity"),
            "message": extra.get("message"),
            "engine": "semgrep-cli",
        },
    )


def _run_rules_engine(root: Path) -> list[CryptoFinding]:
    try:
        import yaml
    except ImportError:
        return _run_rules_engine_minimal(root)

    findings: list[CryptoFinding] = []
    for yaml_path in sorted(RULES_DIR.glob("*.yaml")):
        try:
            doc = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
        except Exception:
            continue
        for rule in doc.get("rules") or []:
            findings.extend(_apply_rule(root, rule, engine="semgrep-rules"))
    return findings


def _run_rules_engine_minimal(root: Path) -> list[CryptoFinding]:
    """YAML-free fallback so detection still works if PyYAML is missing."""
    findings: list[CryptoFinding] = []
    hardcoded = [
        ("java", ['Cipher.getInstance("RSA/ECB/PKCS1Padding")'], "RSA", "pke", "ecb", 0.97),
        ("java", ['KeyPairGenerator.getInstance("RSA")'], "RSA", "pke", None, 0.96),
        ("java", ['MessageDigest.getInstance("MD5")'], "MD5", "hash", None, 0.97),
        ("python", ["hashlib.md5("], "MD5", "hash", None, 0.97),
        ("python", ["hashlib.sha1("], "SHA-1", "hash", None, 0.97),
        ("python", ["algorithms.AES("], "AES", "block-cipher", None, 0.9),
        ("go", ["tls.VersionTLS10"], "TLS-1.0", "protocol", None, 0.95),
        ("go", ["InsecureSkipVerify: true", "InsecureSkipVerify:true"], "TLS-InsecureSkipVerify", "protocol", None, 0.96),
        ("javascript", ["crypto.createCipher("], "DES", "block-cipher", None, 0.9),
        ("javascript", ["algorithm: 'HS256'", 'algorithm: "HS256"'], "HS256", "mac", None, 0.92),
    ]
    ext_map = {
        "java": LANG_EXTENSIONS["java"],
        "python": LANG_EXTENSIONS["python"],
        "go": LANG_EXTENSIONS["go"],
        "javascript": LANG_EXTENSIONS["javascript"] | LANG_EXTENSIONS["typescript"],
    }
    for lang, needles, algo, primitive, mode, conf in hardcoded:
        exts = ext_map[lang]
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in exts:
                continue
            if set(path.parts) & IGNORE_DIRS:
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            rel = rel_path(root, path)
            for line_no, line in enumerate(text.splitlines(), start=1):
                if any(n in line for n in needles):
                    findings.append(
                        CryptoFinding(
                            name=algo,
                            asset_type="protocol" if primitive == "protocol" else "algorithm",
                            algorithm=algo,
                            primitive=primitive,
                            mode=mode,
                            file_path=rel,
                            line_number=line_no,
                            detection_method="semgrep-rules",
                            confidence=conf,
                            evidence_snippet=line.strip()[:200],
                            raw_metadata={"engine": "semgrep-rules-minimal", "needles": needles},
                        )
                    )
    return findings


def _apply_rule(root: Path, rule: dict[str, Any], engine: str) -> list[CryptoFinding]:
    languages = [str(x).lower() for x in (rule.get("languages") or [])]
    exts: set[str] = set()
    for lang in languages:
        exts |= LANG_EXTENSIONS.get(lang, set())
    if not exts:
        return []
    alternatives = _rule_alternatives(rule)
    if not alternatives:
        return []
    metadata = rule.get("metadata") or {}
    algorithm = str(metadata.get("algorithm") or "CRYPTO")
    primitive = str(metadata.get("primitive") or "unknown")
    asset_type = str(metadata.get("asset_type") or ("protocol" if primitive == "protocol" else "algorithm"))
    confidence = float(metadata.get("ecdat_confidence") or 0.93)
    mode = metadata.get("mode")
    findings: list[CryptoFinding] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in exts:
            continue
        if set(path.parts) & IGNORE_DIRS:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        rel = rel_path(root, path)
        for line_no, line in enumerate(text.splitlines(), start=1):
            if any(_line_matches(line, spec) for spec in alternatives):
                findings.append(
                    CryptoFinding(
                        name=algorithm,
                        asset_type=asset_type,
                        algorithm=algorithm,
                        primitive=primitive,
                        mode=str(mode) if mode else None,
                        file_path=rel,
                        line_number=line_no,
                        detection_method=engine,
                        confidence=confidence,
                        evidence_snippet=line.strip()[:200],
                        raw_metadata={
                            "rule_id": rule.get("id"),
                            "message": rule.get("message"),
                            "engine": engine,
                        },
                    )
                )
    return findings


def _rule_alternatives(rule: dict[str, Any]) -> list[dict[str, Any]]:
    if "pattern-either" in rule:
        return [p for p in rule["pattern-either"] if isinstance(p, dict)]
    if "pattern" in rule:
        return [{"pattern": rule["pattern"]}]
    patterns = rule.get("patterns")
    if isinstance(patterns, list) and patterns:
        # AND of all pattern entries — used rarely; treat as either of inner patterns.
        alts: list[dict[str, Any]] = []
        for item in patterns:
            if isinstance(item, dict) and "pattern-either" in item:
                alts.extend(x for x in item["pattern-either"] if isinstance(x, dict))
            elif isinstance(item, dict) and "pattern" in item:
                alts.append(item)
        return alts
    return []


def _line_matches(line: str, spec: dict[str, Any]) -> bool:
    pattern = str(spec.get("pattern") or "")
    if not pattern:
        return False
    needles = _needles_from_pattern(pattern)
    if not needles:
        return False
    return all(n in line for n in needles)


def _needles_from_pattern(pattern: str) -> list[str]:
    quoted = _QUOTED.findall(pattern)
    if quoted:
        return quoted
    tokens = re.findall(r"[A-Za-z_][\w.]*", pattern.replace("...", " "))
    skip = {"tls", "Config", "true", "false", "pattern", "java", "python"}
    ranked = [t for t in tokens if t not in skip]
    ranked.sort(key=lambda t: (("." in t) * 10) + len(t), reverse=True)
    return ranked[:2]


def _algorithm_from_evidence(evidence: str) -> str | None:
    blob = evidence.upper()
    for name in (
        "RSA", "AES", "MD5", "SHA-1", "SHA1", "ECDSA", "ECDH", "DES", "3DES",
        "HS256", "RS256", "TLS", "ML-KEM", "ML-DSA",
    ):
        if name in blob:
            return "SHA-1" if name == "SHA1" else name
    return None

"""Syft-like lockfile/manifest crypto package inventory (no Syft binary required)."""
from __future__ import annotations

import json
import re
from pathlib import Path

from scanner.catalog.signatures import CRYPTO_PACKAGES
from scanner.detectors.base import CryptoFinding, iter_files, rel_path

MAX_FILE_BYTES = 4_000_000

_LOCK_NAMES = {
    "package-lock.json",
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "poetry.lock",
    "go.mod",
    "go.sum",
    "pom.xml",
}

_NEEDLES = [(n.lower(), lib) for n, lib in CRYPTO_PACKAGES]


def detect_sbom(root: Path) -> list[CryptoFinding]:
    findings: list[CryptoFinding] = []
    for path in iter_files(root):
        name = path.name.lower()
        if name not in _LOCK_NAMES:
            continue
        try:
            if path.stat().st_size > MAX_FILE_BYTES:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        rel = rel_path(root, path)
        packages: list[tuple[str, str | None, str, str | None]] = []
        if name == "package.json":
            packages = _parse_package_json(text)
        elif name == "package-lock.json":
            packages = _parse_package_lock(text)
        elif name == "requirements.txt":
            packages = _parse_requirements(text)
        elif name == "pyproject.toml":
            packages = _parse_pyproject(text)
        elif name == "poetry.lock":
            packages = _parse_poetry_lock(text)
        elif name == "go.mod":
            packages = _parse_go_mod(text)
        elif name == "go.sum":
            packages = _parse_go_sum(text)
        elif name == "pom.xml":
            packages = _parse_pom(text)

        seen: set[tuple] = set()
        for pkg_name, version, ecosystem, extra in packages:
            matched = _match_crypto(pkg_name, extra)
            if not matched:
                continue
            lib_name, needle = matched
            key = (lib_name, version or "", pkg_name.lower())
            if key in seen:
                continue
            seen.add(key)
            line_no = _line_of(text, pkg_name) or _line_of(text, needle)
            purl = _purl(ecosystem, pkg_name, version)
            label = f"{lib_name}@{version}" if version else lib_name
            findings.append(
                CryptoFinding(
                    name=label,
                    asset_type="library",
                    algorithm=lib_name,
                    primitive="library",
                    library_name=lib_name,
                    library_version=version,
                    file_path=rel,
                    line_number=line_no,
                    detection_method="sbom-lockfile",
                    confidence=0.94 if version else 0.88,
                    evidence_snippet=f"{pkg_name}{('@' + version) if version else ''} in {path.name}",
                    raw_metadata={
                        "package_version": version,
                        "purl": purl,
                        "ecosystem": ecosystem,
                        "needle": needle,
                    },
                )
            )
    return findings


def _match_crypto(pkg_name: str, extra: str | None) -> tuple[str, str] | None:
    blob = f"{pkg_name} {extra or ''}".lower()
    for needle, lib_name in _NEEDLES:
        if needle in blob:
            return lib_name, needle
    return None


def _line_of(text: str, token: str) -> int | None:
    if not token:
        return None
    lower = token.lower()
    for i, line in enumerate(text.splitlines(), start=1):
        if lower in line.lower():
            return i
    return None


def _clean_version(raw: str | None) -> str | None:
    if not raw:
        return None
    ver = str(raw).strip().strip("\"'`")
    ver = re.sub(r"^[\^~>=<!=\s]+", "", ver)
    ver = ver.split(",")[0].strip()
    if not ver or ver.lower() in {"*", "latest", "workspace"}:
        return None
    return ver[:64]


def _purl(ecosystem: str, name: str, version: str | None) -> str | None:
    if not version:
        return None
    ver = version.lstrip("v")
    if ecosystem == "npm":
        if name.startswith("@"):
            return f"pkg:npm/{name.replace('@', '%40', 1)}@{ver}"
        return f"pkg:npm/{name}@{ver}"
    if ecosystem == "pypi":
        return f"pkg:pypi/{name.lower()}@{ver}"
    if ecosystem == "golang":
        return f"pkg:golang/{name}@{version}"
    if ecosystem == "maven" and ":" in name:
        group, artifact = name.split(":", 1)
        return f"pkg:maven/{group}/{artifact}@{ver}"
    if ecosystem == "maven":
        return f"pkg:maven/{name}@{ver}"
    return f"pkg:{ecosystem}/{name}@{ver}"


def _parse_package_json(text: str) -> list[tuple[str, str | None, str, str | None]]:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, dict):
        return []
    out: list[tuple[str, str | None, str, str | None]] = []
    for key in ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies"):
        block = data.get(key)
        if isinstance(block, dict):
            for name, ver in block.items():
                out.append((str(name), _clean_version(str(ver) if ver is not None else None), "npm", None))
    return out


def _parse_package_lock(text: str) -> list[tuple[str, str | None, str, str | None]]:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, dict):
        return []
    out: list[tuple[str, str | None, str, str | None]] = []
    packages = data.get("packages")
    if isinstance(packages, dict):
        for key, meta in packages.items():
            if not isinstance(meta, dict) or key in ("", "."):
                continue
            name = meta.get("name")
            if not name:
                name = str(key).replace("\\", "/").rsplit("node_modules/", 1)[-1]
            if not name or name in ("", "."):
                continue
            out.append((str(name), _clean_version(meta.get("version")), "npm", None))
    deps = data.get("dependencies")
    if isinstance(deps, dict):
        _walk_npm_deps(deps, out)
    return out


def _walk_npm_deps(deps: dict, out: list) -> None:
    for name, meta in deps.items():
        if isinstance(meta, dict):
            out.append((str(name), _clean_version(meta.get("version")), "npm", None))
            nested = meta.get("dependencies")
            if isinstance(nested, dict):
                _walk_npm_deps(nested, out)


def _parse_requirements(text: str) -> list[tuple[str, str | None, str, str | None]]:
    out: list[tuple[str, str | None, str, str | None]] = []
    req_re = re.compile(
        r"^\s*([A-Za-z0-9_.\-]+)\s*(?:\[[^\]]+\])?\s*(===|==|!=|>=|<=|~=|>|<|=)?\s*([^;#\s]+)?",
    )
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("-"):
            continue
        match = req_re.match(stripped)
        if not match:
            continue
        name, _op, ver = match.group(1), match.group(2), match.group(3)
        out.append((name, _clean_version(ver), "pypi", None))
    return out


def _parse_pyproject(text: str) -> list[tuple[str, str | None, str, str | None]]:
    out: list[tuple[str, str | None, str, str | None]] = []
    for match in re.finditer(
        r'["\']([A-Za-z0-9_.\-]+)(?:\[[^\]]+\])?([=<>!~][^"\']*)["\']',
        text,
    ):
        out.append((match.group(1), _clean_version(match.group(2)), "pypi", None))
    for match in re.finditer(
        r'^([A-Za-z0-9_.\-]+)\s*=\s*(?:\{[^}]*version\s*=\s*["\']([^"\']+)["\']|["\']([^"\']+)["\'])',
        text,
        re.MULTILINE,
    ):
        out.append((match.group(1), _clean_version(match.group(2) or match.group(3)), "pypi", None))
    return out


def _parse_poetry_lock(text: str) -> list[tuple[str, str | None, str, str | None]]:
    out: list[tuple[str, str | None, str, str | None]] = []
    for block in re.split(r"\[\[package\]\]", text)[1:]:
        name_m = re.search(r'^name\s*=\s*"([^"]+)"', block, re.MULTILINE)
        ver_m = re.search(r'^version\s*=\s*"([^"]+)"', block, re.MULTILINE)
        if name_m:
            out.append((name_m.group(1), _clean_version(ver_m.group(1) if ver_m else None), "pypi", None))
    return out


def _parse_go_mod(text: str) -> list[tuple[str, str | None, str, str | None]]:
    out: list[tuple[str, str | None, str, str | None]] = []
    for match in re.finditer(
        r"^\s*([A-Za-z0-9._/\-]+)(?:/v\d+)?\s+(v[0-9][^\s]+)",
        text,
        re.MULTILINE,
    ):
        out.append((match.group(1), match.group(2), "golang", None))
    return out


def _parse_go_sum(text: str) -> list[tuple[str, str | None, str, str | None]]:
    out: list[tuple[str, str | None, str, str | None]] = []
    for match in re.finditer(
        r"^([A-Za-z0-9._/\-]+)(?:/v\d+)?\s+(v[0-9][^\s]+)",
        text,
        re.MULTILINE,
    ):
        out.append((match.group(1), match.group(2), "golang", None))
    return out


def _parse_pom(text: str) -> list[tuple[str, str | None, str, str | None]]:
    out: list[tuple[str, str | None, str, str | None]] = []
    for match in re.finditer(
        r"<dependency>\s*"
        r"<groupId>\s*([^<]+?)\s*</groupId>\s*"
        r"<artifactId>\s*([^<]+?)\s*</artifactId>\s*"
        r"(?:<version>\s*([^<]+?)\s*</version>)?",
        text,
        re.IGNORECASE | re.DOTALL,
    ):
        group, artifact, version = match.group(1).strip(), match.group(2).strip(), match.group(3)
        coord = f"{group}:{artifact}"
        out.append((coord, _clean_version(version.strip() if version else None), "maven", artifact))
    return out

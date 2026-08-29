from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class CryptoFinding:
    name: str
    asset_type: str = "algorithm"
    algorithm: str | None = None
    primitive: str | None = None
    key_size: str | None = None
    mode: str | None = None
    library_name: str | None = None
    library_version: str | None = None
    file_path: str | None = None
    line_number: int | None = None
    detection_method: str = "regex"
    confidence: float = 0.8
    evidence_snippet: str | None = None
    raw_metadata: dict[str, Any] = field(default_factory=dict)

    def dedup_key(self) -> tuple:
        return (self.name, self.file_path, self.line_number, self.asset_type)


IGNORE_DIRS = {
    ".git", "node_modules", "vendor", "__pycache__", ".venv", "venv",
    "dist", "build", ".next", "target", ".idea", ".vscode",
}


def iter_files(root: Path) -> list[Path]:
    files = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        parts = set(path.parts)
        if parts & IGNORE_DIRS:
            continue
        if path.stat().st_size > 5_000_000:
            continue
        files.append(path)
    return files


def rel_path(root: Path, path: Path) -> str:
    try:
        return str(path.relative_to(root)).replace("\\", "/")
    except ValueError:
        return str(path)

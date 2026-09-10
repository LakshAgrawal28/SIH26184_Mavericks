from __future__ import annotations

import subprocess
import sys
from pathlib import Path

QUICK_START_ARCHIVES = (
    "mixed-enterprise.zip",
    "java-rsa-aes.zip",
    "python-crypto.zip",
    "weak-configs.zip",
)

REPO_ROOT = Path(__file__).resolve().parents[2]
ARCHIVE_DIR = REPO_ROOT / "scanner" / "corpus" / "archives"
BUILD_SCRIPT = REPO_ROOT / "scanner" / "scripts" / "build_corpus_zips.py"


def ensure_quick_start_archives() -> None:
    """Build bundled demo zips on first boot when archives are missing."""
    if all((ARCHIVE_DIR / name).is_file() for name in QUICK_START_ARCHIVES):
        return
    if not BUILD_SCRIPT.is_file():
        return
    subprocess.run(
        [sys.executable, str(BUILD_SCRIPT)],
        cwd=str(REPO_ROOT),
        check=False,
    )

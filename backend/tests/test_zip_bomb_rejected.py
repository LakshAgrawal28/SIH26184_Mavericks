import zipfile
from pathlib import Path

import pytest

from scanner.detectors.pipeline import DECOMPRESS_LIMIT_MESSAGE, DecompressBudget, safe_extract_zip


def _make_compressed_zip(path: Path, uncompressed_bytes: int) -> None:
    payload = b"0" * uncompressed_bytes
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("payload.bin", payload)


def test_zip_bomb_rejected_before_full_extract(tmp_path):
    bomb = tmp_path / "bomb.zip"
    _make_compressed_zip(bomb, 2_000_000)
    budget = DecompressBudget(max_bytes=50_000)
    with pytest.raises(ValueError, match=DECOMPRESS_LIMIT_MESSAGE):
        safe_extract_zip(bomb, tmp_path / "out", budget=budget)


def test_small_zip_within_budget(tmp_path):
    bomb = tmp_path / "ok.zip"
    _make_compressed_zip(bomb, 10_000)
    budget = DecompressBudget(max_bytes=50_000)
    count = safe_extract_zip(bomb, tmp_path / "out", budget=budget)
    assert count == 1
    assert budget.used == 10_000

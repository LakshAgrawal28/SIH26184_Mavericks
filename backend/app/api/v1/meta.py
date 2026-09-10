from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from scanner.accuracy.measure import measure_corpus
from scanner.detectors.semgrep_detector import rules_dir, semgrep_available

router = APIRouter(tags=["meta"])

_QUICK_START_CORPUS = frozenset(
    {
        "mixed-enterprise.zip",
        "java-rsa-aes.zip",
        "python-crypto.zip",
        "weak-configs.zip",
    }
)
_CORPUS_ARCHIVE_DIR = (
    Path(__file__).resolve().parents[4] / "scanner" / "corpus" / "archives"
)


@router.get("/accuracy")
def corpus_accuracy():
    """Published, deterministic detector accuracy against the labelled corpus."""
    return measure_corpus()


@router.get("/detectors")
def detector_status():
    return {
        "semgrep_cli": semgrep_available(),
        "semgrep_rules_dir": str(rules_dir()),
        "layers": ["semgrep", "catalog", "source", "manifest", "certificate", "config", "binary"],
        "cbom_schema": "CycloneDX 1.6 (ECMA-424)",
    }


@router.get("/corpus/{filename}")
def download_corpus_archive(filename: str):
    """Serve bundled demo archives for Quick start on the dashboard."""
    if filename not in _QUICK_START_CORPUS:
        raise HTTPException(status_code=404, detail="Unknown demo archive")
    path = _CORPUS_ARCHIVE_DIR / filename
    if not path.is_file():
        raise HTTPException(
            status_code=503,
            detail="Demo archive not built on server. Run scanner/scripts/build_corpus_zips.py",
        )
    return FileResponse(
        path,
        media_type="application/zip",
        filename=filename,
    )

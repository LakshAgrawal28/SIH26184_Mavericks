from fastapi import APIRouter

from scanner.accuracy.measure import measure_corpus
from scanner.detectors.semgrep_detector import rules_dir, semgrep_available

router = APIRouter(tags=["meta"])


@router.get("/accuracy")
def corpus_accuracy():
    """Published, deterministic detector accuracy against the labelled corpus."""
    return measure_corpus()


@router.get("/detectors")
def detector_status():
    return {
        "semgrep_cli": semgrep_available(),
        "semgrep_rules_dir": str(rules_dir()),
        "layers": ["semgrep", "source", "manifest", "certificate", "config", "binary"],
        "cbom_schema": "CycloneDX 1.6 (ECMA-424)",
    }

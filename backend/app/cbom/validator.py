"""Validate CBOM documents against the official CycloneDX 1.6 JSON Schema."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

SCHEMA_DIR = Path(__file__).resolve().parent / "schema"
SCHEMA_FILE = SCHEMA_DIR / "bom-1.6.schema.json"


@lru_cache(maxsize=1)
def _validator():
    import jsonschema
    from jsonschema import Draft7Validator
    from referencing import Registry, Resource
    from referencing.jsonschema import DRAFT7

    resources = []
    for path in SCHEMA_DIR.glob("*.json"):
        doc = json.loads(path.read_text(encoding="utf-8"))
        schema_id = doc.get("$id") or path.name
        resources.append((schema_id, Resource.from_contents(doc, default_specification=DRAFT7)))
        resources.append((path.name, Resource.from_contents(doc, default_specification=DRAFT7)))

    registry = Registry().with_resources(resources)
    schema = json.loads(SCHEMA_FILE.read_text(encoding="utf-8"))
    return Draft7Validator(schema, registry=registry, format_checker=jsonschema.Draft7Validator.FORMAT_CHECKER)


def schema_available() -> bool:
    return SCHEMA_FILE.is_file()


def validate_cbom(document: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    if document.get("bomFormat") != "CycloneDX":
        errors.append("bomFormat must be 'CycloneDX'")
    if document.get("specVersion") != "1.6":
        errors.append("specVersion must be '1.6'")

    if not SCHEMA_FILE.is_file():
        return {
            "valid": not errors,
            "schema": None,
            "error_count": len(errors),
            "errors": errors,
            "engine": "structural",
        }

    try:
        validator = _validator()
        schema_errors = sorted(validator.iter_errors(document), key=lambda e: list(e.path))
        for err in schema_errors:
            loc = "/".join(str(p) for p in err.path) or "$"
            errors.append(f"{loc}: {err.message}")
    except Exception as exc:
        errors.append(f"schema engine error: {exc}")
        return {
            "valid": False,
            "schema": "bom-1.6.schema.json",
            "error_count": len(errors),
            "errors": errors[:40],
            "engine": "cyclonedx-1.6",
        }

    return {
        "valid": len(errors) == 0,
        "schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
        "spec_version": "1.6",
        "error_count": len(errors),
        "errors": errors[:40],
        "engine": "official-json-schema",
    }

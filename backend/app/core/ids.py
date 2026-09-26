import uuid

from fastapi import HTTPException


def parse_scan_id(scan_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(scan_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid scan ID")

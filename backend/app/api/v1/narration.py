from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_scan_for_user
from app.db.session import get_db
from app.models import AIResult, User
from app.services.ai_narration import (
    ai_narration_enabled,
    ai_narration_unavailable_reason,
    chat_about_scan,
    narrate_scan,
)
from app.services.scan_diff import validate_scan_comparison

router = APIRouter(prefix="/scans", tags=["narration"])


class NarrateRequest(BaseModel):
    style: str = Field(default="executive", pattern="^(executive|technical|brief)$")


class ChatTurn(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    against_scan_id: str | None = Field(default=None, max_length=64)
    history: list[ChatTurn] | None = None


def _require_ai():
    if not ai_narration_enabled():
        reason = ai_narration_unavailable_reason() or "AI narration is disabled."
        raise HTTPException(status_code=503, detail=reason)


@router.post("/{scan_id}/narrate")
async def narrate_scan_endpoint(
    scan_id: str,
    body: NarrateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_ai()
    scan = get_scan_for_user(db, scan_id, user)
    if scan.status != "completed":
        raise HTTPException(status_code=400, detail="Scan must be completed before narration")
    try:
        return await narrate_scan(db, scan, style=body.style)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/{scan_id}/chat")
async def chat_scan_endpoint(
    scan_id: str,
    body: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_ai()
    scan = get_scan_for_user(db, scan_id, user)
    if scan.status != "completed":
        raise HTTPException(status_code=400, detail="Scan must be completed before chat")
    baseline = None
    if body.against_scan_id:
        baseline = get_scan_for_user(db, body.against_scan_id, user)
        try:
            validate_scan_comparison(scan, baseline)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        hist = [t.model_dump() for t in body.history] if body.history else None
        return await chat_about_scan(db, scan, body.message, baseline=baseline, history=hist)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{scan_id}/ai-results")
def list_ai_results(
    scan_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = get_scan_for_user(db, scan_id, user)
    rows = (
        db.query(AIResult)
        .filter(AIResult.scan_id == scan.id)
        .order_by(AIResult.created_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "results": [
            {
                "id": str(row.id),
                "kind": row.kind,
                "style": row.style,
                "content": row.content,
                "metadata": row.metadata_json or {},
                "baseline_scan_id": str(row.baseline_scan_id) if row.baseline_scan_id else None,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
    }

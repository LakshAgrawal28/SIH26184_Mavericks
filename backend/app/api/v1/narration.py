from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_scan_for_user
from app.db.session import get_db
from app.models import User
from app.services.ai_narration import ai_narration_enabled, chat_about_scan, narrate_scan

router = APIRouter(prefix="/scans", tags=["narration"])


class NarrateRequest(BaseModel):
    style: str = Field(default="executive", max_length=64)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    against_scan_id: str | None = Field(default=None, max_length=64)


def _require_ai():
    if not ai_narration_enabled():
        raise HTTPException(
            status_code=503,
            detail="AI narration is disabled. Set AI_NARRATION_ENABLED=true and GROQ_API_KEY.",
        )


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
        return await chat_about_scan(db, scan, body.message, baseline=baseline)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

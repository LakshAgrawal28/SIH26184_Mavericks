from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.core.security import authenticate_user, create_access_token
from app.db.session import get_db
from app.models import User
from app.schemas.api import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(user.email, {"role": user.role, "name": user.name})
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        user={"id": str(user.id), "name": user.name, "role": user.role, "email": user.email},
    )


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "name": user.name, "role": user.role, "email": user.email}

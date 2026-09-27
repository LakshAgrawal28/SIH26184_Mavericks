import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.core.security import authenticate_user, create_access_token, hash_password
from app.db.session import get_db
from app.models import User
from app.schemas.api import LoginRequest, SignupRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

_LOGIN_FAIL_WINDOW_SEC = 60
_LOGIN_FAIL_MAX = 5
_login_failures: dict[str, list[float]] = {}


def _prune_failures(email: str, now: float) -> list[float]:
    attempts = _login_failures.get(email, [])
    fresh = [t for t in attempts if now - t < _LOGIN_FAIL_WINDOW_SEC]
    if fresh:
        _login_failures[email] = fresh
    else:
        _login_failures.pop(email, None)
    return fresh


def _is_login_locked(email: str) -> bool:
    now = time.monotonic()
    return len(_prune_failures(email, now)) >= _LOGIN_FAIL_MAX


def _record_login_failure(email: str) -> None:
    now = time.monotonic()
    attempts = _prune_failures(email, now)
    attempts.append(now)
    _login_failures[email] = attempts


def _clear_login_failures(email: str) -> None:
    _login_failures.pop(email, None)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    if _is_login_locked(body.email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Try again later.",
        )

    user = authenticate_user(db, body.email, body.password)
    if not user:
        _record_login_failure(body.email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    _clear_login_failures(body.email)
    token = create_access_token(
        user.email,
        {"role": user.role, "name": user.name, "tv": user.token_version},
    )
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        user={"id": str(user.id), "name": user.name, "role": user.role, "email": user.email},
    )


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    email = str(body.email).strip().lower()
    name = body.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=422, detail="Name must contain at least 2 characters")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        email=email,
        name=name,
        password_hash=hash_password(body.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(
        user.email,
        {"role": user.role, "name": user.name, "tv": user.token_version},
    )
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        user={"id": str(user.id), "name": user.name, "role": user.role, "email": user.email},
    )


@router.post("/logout")
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.token_version += 1
    db.commit()
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "name": user.name, "role": user.role, "email": user.email}

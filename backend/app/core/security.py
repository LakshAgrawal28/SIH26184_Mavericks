import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.models import User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_DEFAULT_JWT_SECRET = "change-me-in-production"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def ensure_default_admin(db: Session) -> None:
    existing = db.query(User).filter(User.email == settings.default_admin_email).first()
    if existing:
        return

    password = settings.default_admin_password
    generated = password is None
    if generated:
        password = secrets.token_urlsafe(20)

    user = User(
        email=settings.default_admin_email,
        name="ECDAT Admin",
        password_hash=hash_password(password),
        role="admin",
    )
    db.add(user)
    db.commit()

    if generated:
        if settings.jwt_secret == _DEFAULT_JWT_SECRET:
            logger.warning(
                "Created default admin %s with one-time generated password: %s "
                "(set DEFAULT_ADMIN_PASSWORD=admin123 for local demo)",
                settings.default_admin_email,
                password,
            )
        else:
            logger.warning(
                "Created default admin %s with a generated password. "
                "Retrieve it from your deployment logs at first boot or set DEFAULT_ADMIN_PASSWORD before deploy.",
                settings.default_admin_email,
            )

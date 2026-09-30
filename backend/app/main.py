import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1 import auth, meta, narration, reports, scans
from app.config import settings
from app.services.ai_narration import ai_narration_enabled, ai_narration_unavailable_reason
from app.core.security import ensure_default_admin
from app.corpus_bootstrap import ensure_quick_start_archives
from app.db.migrate import ensure_schema_patches
from app.db.session import Base, SessionLocal, engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_quick_start_archives()
    Base.metadata.create_all(bind=engine)
    ensure_schema_patches(engine)
    db = SessionLocal()
    try:
        ensure_default_admin(db)
    finally:
        db.close()
    if settings.ai_narration_enabled and not ai_narration_enabled():
        logger.warning("AI narration misconfigured: %s", ai_narration_unavailable_reason())
    elif ai_narration_enabled():
        logger.info("AI narration enabled (Groq model %s)", settings.groq_model)
    yield


app = FastAPI(title="ECDAT API", version="2.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(scans.router, prefix="/api/v1")
app.include_router(narration.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(meta.router, prefix="/api/v1")


@app.get("/health")
def health():
    status = {"api": "ok", "database": "unknown", "redis": "optional"}
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        status["database"] = "ok"
    except Exception:
        logger.exception("Health check: database unavailable")
        status["database"] = "error"
    finally:
        db.close()
    try:
        import redis

        r = redis.from_url(settings.redis_url)
        r.ping()
        status["redis"] = "ok"
    except Exception:
        logger.exception("Health check: redis unavailable")
        status["redis"] = "error"
    return status

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1 import auth, meta, reports, scans
from app.config import settings
from app.core.security import ensure_default_admin
from app.db.session import Base, SessionLocal, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_default_admin(db)
    finally:
        db.close()
    yield


app = FastAPI(title="ECDAT API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(scans.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(meta.router, prefix="/api/v1")


@app.get("/health")
def health():
    status = {"api": "ok", "database": "unknown", "redis": "optional"}
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        status["database"] = "ok"
    except Exception as exc:
        status["database"] = f"error: {exc}"
    finally:
        db.close()
    try:
        import redis

        r = redis.from_url(settings.redis_url)
        r.ping()
        status["redis"] = "ok"
    except Exception as exc:
        status["redis"] = f"error: {exc}"
    return status

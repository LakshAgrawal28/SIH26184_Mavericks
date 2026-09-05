import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    work_dir = tmp_path / "scans"
    work_dir.mkdir()
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SCAN_WORK_DIR", str(work_dir))
    monkeypatch.setenv("SYNC_SCAN", "true")
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    monkeypatch.setenv("DEFAULT_ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("DEFAULT_ADMIN_PASSWORD", "admin123")

    from app.config import settings
    monkeypatch.setattr(settings, "sync_scan", True)
    monkeypatch.setattr(settings, "database_url", f"sqlite:///{db_path}")
    monkeypatch.setattr(settings, "scan_work_dir", str(work_dir))
    monkeypatch.setattr(settings, "jwt_secret", "test-secret")

    from sqlalchemy import create_engine
    from app.db import session as db_session

    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    db_session.engine = engine
    db_session.SessionLocal.configure(bind=engine)

    from app.main import app
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c

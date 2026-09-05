#!/usr/bin/env bash
# Local dev without Docker: SQLite + sync scans
set -e
cd "$(dirname "$0")/.."
export PYTHONPATH=backend:.
export DATABASE_URL=sqlite:///./ecdat_dev.db
export SYNC_SCAN=true
export REDIS_URL=redis://localhost:6379/0
export JWT_SECRET=dev-secret

cd backend
python3 -m venv .venv 2>/dev/null || true
. .venv/bin/activate
pip install -q -r requirements.txt

echo "Starting ECDAT API on http://localhost:8000"
echo "Login: admin@example.com / admin123"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

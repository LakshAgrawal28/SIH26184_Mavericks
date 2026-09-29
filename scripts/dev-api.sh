#!/usr/bin/env bash
# Local dev without Docker: SQLite + sync scans
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi
export PYTHONPATH="$ROOT/backend:$ROOT"
if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="sqlite:///$ROOT/backend/ecdat_dev.db"
fi
export SYNC_SCAN=true
export REDIS_URL=redis://localhost:6379/0
export JWT_SECRET=dev-secret
export DEFAULT_ADMIN_PASSWORD=admin123

cd backend
python3 -m venv .venv 2>/dev/null || true
. .venv/bin/activate
pip install -q -r requirements.txt

echo "Starting ECDAT API on http://localhost:8000"
echo "Login: admin@example.com / admin123"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

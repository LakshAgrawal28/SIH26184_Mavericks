import io
import zipfile

from conftest import wait_for_scan
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User


def _auth_headers(client, email: str, password: str) -> dict[str, str]:
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _minimal_zip() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("hello.txt", "no crypto here")
    return buf.getvalue()


def test_cross_user_scan_isolation(client):
    headers_a = _auth_headers(client, "admin@example.com", "admin123")
    zip_bytes = _minimal_zip()
    create = client.post(
        "/api/v1/scans",
        headers=headers_a,
        data={"name": "user-a-scan", "target_type": "zip_archive"},
        files={"file": ("tiny.zip", zip_bytes, "application/zip")},
    )
    assert create.status_code == 201, create.text
    scan_id = create.json()["scan_id"]
    wait_for_scan(client, scan_id, headers_a)

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "userb@example.com").first():
            db.add(
                User(
                    email="userb@example.com",
                    name="User B",
                    password_hash=hash_password("userb-pass"),
                    role="user",
                )
            )
            db.commit()
    finally:
        db.close()

    headers_b = _auth_headers(client, "userb@example.com", "userb-pass")

    get_resp = client.get(f"/api/v1/scans/{scan_id}", headers=headers_b)
    assert get_resp.status_code == 404

    cbom_resp = client.post(f"/api/v1/scans/{scan_id}/reports/cbom", headers=headers_b)
    assert cbom_resp.status_code == 404

    list_resp = client.get("/api/v1/scans", headers=headers_b)
    assert list_resp.status_code == 200
    ids = {s["scan_id"] for s in list_resp.json()["scans"]}
    assert scan_id not in ids


def test_signup_creates_user_and_returns_token(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={"name": "New Operator", "email": "new.operator@example.com", "password": "secure-pass-123"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == "new.operator@example.com"
    assert body["user"]["role"] == "user"
    token = body["access_token"]

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer " + token},
    )
    assert me.status_code == 200
    assert me.json()["name"] == "New Operator"


def test_signup_rejects_duplicate_email_and_weak_password(client):
    payload = {"name": "New Operator", "email": "duplicate@example.com", "password": "secure-pass-123"}
    assert client.post("/api/v1/auth/signup", json=payload).status_code == 201
    duplicate = client.post("/api/v1/auth/signup", json=payload)
    assert duplicate.status_code == 409

    weak = client.post(
        "/api/v1/auth/signup",
        json={"name": "Weak User", "email": "weak@example.com", "password": "short"},
    )
    assert weak.status_code == 422

import io
import zipfile

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

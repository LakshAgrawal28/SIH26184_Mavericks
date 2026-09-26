import pytest

from app.api.v1 import auth as auth_module


@pytest.fixture(autouse=True)
def _reset_login_rate_limit():
    auth_module._login_failures.clear()
    yield
    auth_module._login_failures.clear()


def _login(client, email: str, password: str):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_login_lockout_after_five_failures(client):
    email = "admin@example.com"
    for _ in range(5):
        resp = _login(client, email, "wrong-password")
        assert resp.status_code == 401

    sixth = _login(client, email, "wrong-password")
    assert sixth.status_code == 429
    assert "Too many failed login attempts" in sixth.json()["detail"]


def test_successful_login_clears_failure_counter(client):
    email = "admin@example.com"
    for _ in range(4):
        resp = _login(client, email, "wrong-password")
        assert resp.status_code == 401

    ok = _login(client, email, "admin123")
    assert ok.status_code == 200

    fail_again = _login(client, email, "wrong-password")
    assert fail_again.status_code == 401


def test_logout_revokes_token(client):
    login = _login(client, "admin@example.com", "admin123")
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200

    logout = client.post("/api/v1/auth/logout", headers=headers)
    assert logout.status_code == 200

    me_after = client.get("/api/v1/auth/me", headers=headers)
    assert me_after.status_code == 401

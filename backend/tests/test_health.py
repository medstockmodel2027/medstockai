import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.database import sanitize_error


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    """Test that the root endpoint returns API metadata and valid documentation links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == settings.PROJECT_NAME
    assert data["database_dialect"] == "mysql"
    assert data["driver"] == "pymysql"
    assert data["documentation"] == "/docs"
    assert data["api_health"] == "/api/health"
    assert data["db_health"] == "/api/health/db"


def test_api_health_endpoint(client):
    """Test GET /api/health endpoint confirms the FastAPI application is running."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ok"
    assert data["project"] == settings.PROJECT_NAME
    assert "version" in data
    assert "timestamp" in data
    assert data["db_check_url"] == "/api/health/db"


def test_database_health_endpoint(client):
    """Test GET /api/health/db verifies MySQL database probe and status reporting."""
    response = client.get("/api/health/db")
    assert response.status_code == 200
    data = response.json()

    # Validate database health response schema
    assert "status" in data
    assert data["status"] in ("ok", "degraded")
    assert "connected" in data
    assert isinstance(data["connected"], bool)
    assert data["dialect"] == "mysql"
    assert data["driver"] == "pymysql"
    assert data["host"] == settings.effective_host
    assert data["port"] == settings.MYSQL_PORT
    assert data["database"] == settings.effective_database
    assert "message" in data

    # Verify sensitive credentials are never leaked in the error or message
    if settings.MYSQL_PASSWORD:
        assert settings.MYSQL_PASSWORD not in str(data)


def test_root_health_aliases(client):
    """Test that /health and /health/db aliases match under root."""
    res_api = client.get("/health")
    assert res_api.status_code == 200
    assert res_api.json()["status"] == "ok"

    res_db = client.get("/health/db")
    assert res_db.status_code == 200
    assert "dialect" in res_db.json()
    assert res_db.json()["dialect"] == "mysql"


def test_cors_preflight_and_headers(client):
    """Test CORS headers for permitted Vite frontend origin."""
    test_origin = "http://localhost:5173"
    response = client.get(
        "/api/health",
        headers={"Origin": test_origin},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == test_origin
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_rejected_for_disallowed_origin(client):
    """Test that unauthorized origins do not receive allow-origin header."""
    unauthorized_origin = "http://malicious-site.example.com"
    response = client.get(
        "/api/health",
        headers={"Origin": unauthorized_origin},
    )
    assert response.headers.get("access-control-allow-origin") is None


def test_database_error_sanitization():
    """Verify that sanitize_error masks MySQL passwords in error strings."""
    secret_pass = "super_secret_mysql_pass_123"
    raw_error = (
        f"OperationalError: (pymysql.err.OperationalError) (1045, \"Access denied for user 'root'@'127.0.0.1' "
        f"with URI mysql+pymysql://root:{secret_pass}@127.0.0.1:3306/medstock_ai\")"
    )
    sanitized = sanitize_error(raw_error)

    assert secret_pass not in sanitized
    assert "root:***@127.0.0.1" in sanitized


def test_masked_database_uri():
    """Verify that settings.masked_database_uri never contains cleartext password."""
    masked = settings.masked_database_uri
    assert "mysql+pymysql://" in masked
    if settings.MYSQL_PASSWORD:
        assert f":{settings.MYSQL_PASSWORD}@" not in masked

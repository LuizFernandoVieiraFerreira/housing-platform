from fastapi.testclient import TestClient

from housing_platform.main import create_app


def test_health_endpoint() -> None:
    client = TestClient(create_app())
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert isinstance(body["database"], bool)

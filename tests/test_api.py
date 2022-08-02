from fastapi.testclient import TestClient
from speedcloud import app
client = TestClient(app)

def test_api_root():
    response = client.get("/api")
    assert response.status_code == 200

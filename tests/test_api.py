from unittest.mock import Mock
from speedcloud import app
import speedcloud.config
from fastapi import FastAPI
from fastapi.testclient import TestClient




def test_api_root():
    client = TestClient(app)
    response = client.get("/api")
    assert response.status_code == 200


def test_get_empty(monkeypatch):
    settings = Mock(spec=speedcloud.config.Settings, storage="dummy")
    monkeypatch.setattr(speedcloud.config, 'find_config_file', lambda *args, **kwargs: "file.toml")
    monkeypatch.setattr(speedcloud.config, 'read_settings', lambda *args: settings)
    client = TestClient(app)
    response = client.get("/api/files?path=%2F")
    assert response.json() == {
        "path": '/',
        "files": []
    }


def test_get_error_missing_path(monkeypatch):
    settings = Mock(spec=speedcloud.config.Settings, storage="dummy")
    monkeypatch.setattr(speedcloud.config, 'find_config_file', lambda *args, **kwargs: "file.toml")
    monkeypatch.setattr(speedcloud.config, 'read_settings', lambda *args: settings)
    client = TestClient(app)
    response = client.get("/api/files")
    assert response.status_code == 400

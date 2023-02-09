import os.path
from unittest.mock import Mock

import pytest

from speedcloud import app
import speedcloud.config
import speedcloud.api.storage
import speedcloud.api.routes
from fastapi import FastAPI
from fastapi.testclient import TestClient




def test_api_root():
    client = TestClient(app)
    response = client.get("/api")
    assert response.status_code == 200


class TestFilesRoute:
    @pytest.fixture
    def client(self, monkeypatch):
        settings = Mock(spec=speedcloud.config.Settings, storage="/dummy")
        monkeypatch.setattr(speedcloud.config, 'find_config_file',
                            lambda *args, **kwargs: "file.toml")
        monkeypatch.setattr(speedcloud.config, 'read_settings',
                            lambda *args: settings)
        monkeypatch.setattr(
            speedcloud.api.storage,
            "get_path_contents",
            lambda *args, **kwargs: [])
        return TestClient(app)

    def test_get_empty(self, client):
        response = client.get("/api/files?path=%2F")
        assert response.json() == {
            "path": '/',
            "contents": []
        }

    def test_get_defaults_to_root(self, client):
        response = client.get("/api/files")
        assert response.json()["path"] == '/'


def test_is_within_valid_directory():
    root = os.path.join("/", "tmp")
    valid = os.path.join("/", "tmp", 'dummy')
    assert speedcloud.api.storage.is_within_valid_directory(root, valid) is True


def test_is_within_valid_directory_invalid():
    root= os.path.join("/", "tmp", 'dummy')
    invalid = os.path.join("/", "tmp")
    assert speedcloud.api.storage.is_within_valid_directory(root, invalid) is False
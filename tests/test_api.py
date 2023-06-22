import os.path
from unittest.mock import Mock

import pytest

from speedcloud import app
import speedcloud.config
import speedcloud.api.storage
import speedcloud.api.routes
from fastapi.testclient import TestClient



@pytest.fixture
def storage_path():
    return '/dummy/'

@pytest.fixture
def client(monkeypatch, storage_path):
    settings = Mock(spec=speedcloud.config.Settings, storage=storage_path)
    monkeypatch.setattr(speedcloud.config, 'find_config_file',
                        lambda *args, **kwargs: "file.toml")
    monkeypatch.setattr(speedcloud.config, 'read_settings',
                        lambda *args: settings)
    return TestClient(app)

def test_api_root():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200


class TestFilesRoute:
    def test_get_empty(self, client, monkeypatch):
        monkeypatch.setattr(
            speedcloud.api.storage,
            "get_path_contents",
            lambda *args, **kwargs: [])
        response = client.get("/files/contents?path=%2F")
        assert response.json() == {
            "path": '/',
            "contents": []
        }

    def test_get_defaults_to_root(self, client, monkeypatch):
        monkeypatch.setattr(
            speedcloud.api.storage,
            "get_path_contents",
            lambda *args, **kwargs: [])
        response = client.get("/files/contents")
        assert response.json()["path"] == '/'


def test_is_within_valid_directory():
    root = os.path.join("/", "tmp")
    valid = os.path.join("/", "tmp", 'dummy')
    assert speedcloud.api.storage.is_within_valid_directory(root, valid) is True


def test_is_within_valid_directory_invalid():
    root= os.path.join("/", "tmp", 'dummy')
    invalid = os.path.join("/", "tmp")
    assert speedcloud.api.storage.is_within_valid_directory(root, invalid) is False


class TestNewDirectoryRoute:
    @pytest.fixture()
    def create_directory(self, client, monkeypatch):
        return Mock()

    @pytest.fixture()
    def post_args(self):
        return {"path": '/', "name": 'newPath'}

    @pytest.fixture()
    def successful_server_response(
            self,
            client,
            post_args,
            create_directory,
            monkeypatch
    ):
        monkeypatch.setattr(
            speedcloud.api.storage,
            'create_directory',
            create_directory
        )
        return client.post(
            "/files/directory",
            json=post_args
        )

    def test_create_new_directory_gets_json(
            self,
            successful_server_response,
            post_args
    ):
        assert successful_server_response.json() == {
            'location': post_args['path'],
            'name': post_args['name'],
            'path': os.path.join(post_args['path'], post_args['name'])
        }

    def test_create_new_directory_calls_storage_function(
            self,
            storage_path,
            successful_server_response,
            create_directory
    ):
        create_directory.assert_called_with(storage_path, 'newPath')

    @pytest.mark.parametrize(
        "json, valid",
        [
            ({"path": '/', "name": 'newPath'}, True),
            ({"path": '/', "name": '..'}, False),
            ({"path": '/', "name": '.'}, False),
        ]
    )
    def test_responses(self, client, create_directory, monkeypatch, json, valid):
        monkeypatch.setattr(
            speedcloud.api.storage,
            'create_directory',
            create_directory
        )
        response = client.post("/files/directory", json=json)
        assert (response.status_code == 200) == valid, f"got {response.status_code}"


class TestDeleteDirectoryRoute:
    def test_success_gets_ok(self, client, monkeypatch):
        remove_path_from_storage = Mock()
        monkeypatch.setattr(
            speedcloud.api.storage,
            "remove_path_from_storage",
            remove_path_from_storage
        )
        response = client.request("delete",
            "/files/directory",
            json={"path": "/dummy"}
        )
        assert response.json()['response'] == 'success'


    def test_calls_delete_from_storage(self, client, monkeypatch):
        remove_path_from_storage = Mock()
        monkeypatch.setattr(
            speedcloud.api.storage,
            "remove_path_from_storage",
            remove_path_from_storage
        )
        client.request("delete",
            "/files/directory", json={"path": "/myPath"}
        )
        remove_path_from_storage.assert_called_with('/dummy/myPath')

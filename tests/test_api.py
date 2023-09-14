import os.path
from unittest.mock import Mock
import json

import pytest
import speedwagon

from speedcloud.app import app
import speedcloud.config
import speedcloud.api.storage
import speedcloud.api.routes
import speedcloud.api.schema
from fastapi.testclient import TestClient

from typing import List, Any, Dict
@pytest.fixture
def storage_path():
    return '/dummy/'

class DummyWorkflow(speedwagon.Workflow):
    name = "dummy"
    description = "Just a dummy"

    def discover_task_metadata(self, initial_results: List[Any], additional_data: Dict[str, Any], **user_args) -> List[
        dict]:
        pass


@pytest.fixture()
def fake_workflows():
    return {'dummy': DummyWorkflow}

@pytest.fixture
def client(monkeypatch, storage_path, fake_workflows):
    settings = speedcloud.config.Settings

    settings.whitelisted_workflows = fake_workflows.keys()

    monkeypatch.setattr(speedcloud.config.os, "makedirs", Mock())
    settings.storage = storage_path
    monkeypatch.setattr(speedcloud.config, 'find_config_file',
                        lambda *args, **kwargs: "file.toml")
    monkeypatch.setattr(speedcloud.config, 'read_settings_file',
                        lambda *args: settings)
    monkeypatch.setattr(speedwagon, 'available_workflows', lambda : {'dummy': DummyWorkflow})
    def execute_job(*args, **kwargs):
        pass
    monkeypatch.setattr(speedcloud.job_manager.AsyncJobExecutor, 'execute_job', execute_job)
    with TestClient(app) as test_client:
        yield test_client

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

class TestJobRoutes:

    def test_empty_jobs_route(self, client):
        response = client.request('get', '/jobs')
        assert response.status_code == 200
        assert response.json() == []


    def test_jobs_added(self, client):
        client.request(
            'post',
            '/submitJob',
            json={"details": {}, "workflow_id": 0}
        )
        get_response = client.get('/jobs')
        data = get_response.json()
        assert len(data) == 1
        assert data[0]['order'] == 0


    def test_job_info_returns_correct_job(self, client):
        client.request(
            'post',
            '/submitJob',
            json={"details": {}, "workflow_id": 0}
        )
        new_job_data = client.get('/jobs').json()
        job_id = new_job_data[0]['job_id']
        job_info = client.request('get', f"/jobInfo?job_id={job_id}").json()
        assert job_info['job_id'] == job_id

    @pytest.mark.skip(reason="Skip test_jobs_sse for now. Some resource is not getting properly cleaned up here.")
    def test_jobs_sse(self, client, monkeypatch):
        async def stream_jobs(*args):
            yield "sample data"
        monkeypatch.setattr(speedcloud.api.stream, "stream_jobs", stream_jobs)
        status_stream = client.get('/jobsSSE')
        assert next(status_stream.iter_text()).strip() == 'data: "sample data"'

    @pytest.mark.skip(
        reason="Skip test_follow_job_sse for now. Some resource is not getting properly cleaned up here."
    )
    def test_follow_job_sse(self, client, monkeypatch):
        new_job_data = client.request(
            'post',
            '/submitJob',
            json={"details": {}, "workflow_id": 0}
        ).json()

        job_id = new_job_data['metadata']['id']

        async def job_progress_packet_generator(job_queue_item, job_runner):
            yield "sample data"

        monkeypatch.setattr(speedcloud.api.stream, "job_progress_packet_generator", job_progress_packet_generator)
        status_stream = client.get(f"/followJobStatus?job_id={job_id}")
        assert next(status_stream.iter_text()).strip() == "data: sample data"


class TestWorkflowRoutes:
    def test_list_workflows(self, client):
        res = client.get('/list_workflows').json()
        assert 'workflows' in res

    def test_get_workflow(self, client, fake_workflows):
        data = client.get('/workflow?name=dummy').json()
        assert data['workflow']['description'] == fake_workflows['dummy'].description


def test_info(client):
    assert 'workflows' in client.get('/info').json()

def test_log(client):
    new_job_data = client.request(
        'post',
        '/submitJob',
        json={"details": {}, "workflow_id": 0}
    ).json()
    job_id = new_job_data['metadata']['id']
    result = client.get(f'/jobLogs?job_id={job_id}').json()
    print(result)

class TestAPIJobQueueItem:
    def test_serialize(self):

        q_item = speedcloud.api.schema.APIJobQueueItem(
            job=speedcloud.api.schema.JobQueueJobDetails(
                details={},
                workflow=speedcloud.api.schema.JobWorkflow(id=1, name= "adsads")
            ),
            progress=10.0,
            time_submitted="12345.123",
            state=speedcloud.api.schema.JobState.SUCCESS,
            order=1,
            job_id="1767b939-f464-4b69-929d-ebdf108510a3"
        )
        assert json.loads(q_item.serialize())['order'] == 1

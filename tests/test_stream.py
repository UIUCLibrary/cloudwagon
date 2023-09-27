import asyncio
import datetime
import json
from unittest.mock import Mock
import dataclasses
from speedcloud.api import stream, schema
from speedcloud.job_manager import (
    JobQueueItem,
    JobRunner,
    JobStatus,
    JobLog,
    JobManager
)
from speedcloud.workflow_manager import WorkflowData
import pytest

import builtins
if not hasattr(builtins, "anext"):
    async def anext(ait):
        return await ait.__anext__()

@pytest.fixture()
def fake_job_id():
    return '833f97a3-b18a-47db-aee5-f41f28d5f650'

@pytest.fixture()
def queued_item(fake_job_id):
    return JobQueueItem(
        job={
            "details": {},
            "workflow": {'id': 1, "name": "spam"}
        },
        order=1,
        time_submitted=datetime.datetime.now(),
        job_id=fake_job_id,
        state=schema.JobState.RUNNING,
    )


@pytest.mark.asyncio
async def test_job_progress_packet_generator_first_packet(queued_item, fake_job_id):
    runner = Mock(JobRunner)
    gen = stream.job_progress_packet_generator(queued_item, runner)
    res = json.loads(await anext(gen))
    assert res['job_id'] == fake_job_id


@pytest.mark.asyncio
@pytest.mark.timeout(5)
@pytest.mark.parametrize(
    "param_name, packet_key, input_value, packet_value",
    [
        ('progress', 'progress', 10.2, 10.2),
        ('current_task', "currentTask", "spam", "spam"),
        (
                'logs',
                'logs',
                [JobLog(msg="spam", time=10.01)],
                [{'msg': 'spam', 'time': 10.01}]
        ),

    ]
)
async def test_job_progress_packet_generator_packet(queued_item, param_name: JobStatus, packet_key, input_value, packet_value):
    runner = Mock(spec=JobRunner)
    gen = stream.job_progress_packet_generator(queued_item, runner)
    await anext(gen)
    next_packet = anext(gen)
    queued_item.status[param_name] = input_value
    res = json.loads(await next_packet)
    assert res[packet_key] == packet_value


@pytest.mark.asyncio
@pytest.mark.timeout(5)
async def test_job_progress_packet_generator_final_packet(queued_item):
    runner = Mock(spec=JobRunner)
    gen = stream.job_progress_packet_generator(queued_item, runner)
    await anext(gen)

    next_packet = anext(gen)
    queued_item.status['progress'] = 1.0
    # queued_item.status.progress = 1.0
    await next_packet

    final_packet = anext(gen)
    queued_item.state = schema.JobState.SUCCESS
    queued_item.status['progress'] = 100
    res = json.loads(await final_packet)
    assert res['progress'] == 100


@pytest.mark.asyncio
async def test_only_new_data():
    @stream.only_new_data
    async def data():
        yield 5
        yield 6
        yield 5
    gen = data()

    assert await anext(gen) == 5
    assert await anext(gen) == 6

@pytest.fixture()
def workflow_data():
    return WorkflowData(id=0, name="spam")


@pytest.fixture()
def job_manager_shared_queue():
    return asyncio.Queue()

@pytest.fixture()
async def job_manager_with_job(workflow_data, job_manager_shared_queue):
    job_manager = JobManager(job_manager_shared_queue)
    await job_manager.add_job(workflow_data, details={})
    return job_manager


@pytest.mark.asyncio
async def test_get_job_queue_data(job_manager_with_job, workflow_data):
    job_manager_with_job = await job_manager_with_job
    results = stream.get_job_queue_data(job_manager_with_job)
    assert len(results) == 1
    assert results[0]["job"]['workflow']['id'] == workflow_data.id


@pytest.mark.asyncio
async def test_stream_jobs_starts_with_job_info(job_manager_with_job, job_manager_shared_queue, workflow_data):
    job_runner = JobRunner(job_manager_shared_queue, storage_root='.')
    streamer = stream.stream_jobs(await job_manager_with_job, job_runner)
    initial_packets = await anext(streamer)
    assert len(initial_packets) == 1
    assert initial_packets[0]['job']['workflow'] == dataclasses.asdict(workflow_data)


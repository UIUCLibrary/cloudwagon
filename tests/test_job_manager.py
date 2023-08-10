import asyncio

import speedcloud.job_manager
from speedcloud.api import schema
import pytest


class TestJobManager:


    @pytest.fixture
    def queue(self):
        return asyncio.Queue()
    @pytest.fixture
    def job_manager(self, queue):
        return speedcloud.job_manager.JobManager(queue)

    def test_empty_by_default(self, job_manager):
        assert len(job_manager.job_queue()) == 0

    @pytest.mark.asyncio
    async def test_add(self, job_manager):
        new_job = schema.Job(
            details={},
            workflow_id=1
        )
        await job_manager.add_job(new_job)
        assert len(job_manager.job_queue()) == 1

    @pytest.mark.asyncio
    async def test_add_returns_job_queue_item(self, job_manager):
        new_job = schema.Job(
            details={},
            workflow_id=1
        )
        item = await job_manager.add_job(new_job)
        assert item.job == new_job


    @pytest.mark.asyncio
    async def test_get_job(self, job_manager):
        new_job = schema.Job(
            details={},
            workflow_id=1
        )
        created_job_item = await job_manager.add_job(new_job)
        job_item = await job_manager.get_job_queue_item(job_id=created_job_item.job_id)
        assert created_job_item == job_item


    @pytest.mark.asyncio
    async def test_get_job_with_invalid_throws_exception(self, job_manager):
        with pytest.raises(ValueError):
            await job_manager.get_job_queue_item(job_id="invalid job id")

    @pytest.mark.asyncio
    async def test_set_status(self, job_manager):
        new_job = schema.Job(
            details={},
            workflow_id=1
        )
        created_job_item = await job_manager.add_job(new_job)
        await job_manager.set_job_state(job_id=created_job_item.job_id, state=schema.JobState.RUNNING)
        assert  (await job_manager.get_job_queue_item(job_id=created_job_item.job_id)).state == schema.JobState.RUNNING

    @pytest.mark.parametrize(
        "status, expected",
        [
            (schema.JobState.QUEUED, True),
            (schema.JobState.RUNNING, True),
            (schema.JobState.SUCCESS, False),
            (schema.JobState.FAILED, False),
        ]
    )
    @pytest.mark.asyncio
    async def test_has_unfinished_tasks(self, job_manager, status, expected):
        created_job_item = await job_manager.add_job(schema.Job(
            details={},
            workflow_id=1
        ))
        await job_manager.set_job_state(job_id=created_job_item.job_id, state=status)
        assert await job_manager.has_unfinished_tasks() is expected

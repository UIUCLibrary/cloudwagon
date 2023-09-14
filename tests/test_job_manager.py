import asyncio
import logging
from typing import List, Any, Dict
from unittest.mock import Mock, AsyncMock, MagicMock

import speedwagon
from speedwagon.tasks import TaskBuilder

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
    async def test_notify_when_adding(self, job_manager):
        dummy_watcher = AsyncMock()
        job_manager.add_async_watcher(dummy_watcher)
        await job_manager.add_job(Mock(id=1, name="dummy"), details={})
        dummy_watcher.notify.assert_called_once()

    @pytest.mark.asyncio
    async def test_add(self, job_manager):
        new_job = Mock(id=1, name="dummy")
        await job_manager.add_job(new_job, details={})
        assert len(job_manager.job_queue()) == 1

    @pytest.mark.asyncio
    async def test_add_returns_job_queue_item(self, job_manager):
        new_job = Mock(id=1, name="dummy")
        item = await job_manager.add_job(new_job, details={})
        assert item.job['workflow']['id'] == new_job.id

    @pytest.mark.asyncio
    async def test_get_job(self, job_manager):
        new_job = Mock(id=1, name="dummy")
        created_job_item = await job_manager.add_job(new_job, details={})
        job_item = job_manager.get_job_queue_item(job_id=created_job_item.job_id)
        assert created_job_item == job_item

    @pytest.mark.asyncio
    async def test_get_job_with_invalid_throws_exception(self, job_manager):
        with pytest.raises(ValueError):
            job_manager.get_job_queue_item(job_id="invalid job id")

    @pytest.mark.asyncio
    async def test_set_status(self, job_manager):
        new_job = Mock(id=1, name="dummy")
        created_job_item = await job_manager.add_job(new_job, details={})
        job_manager.set_job_state(job_id=created_job_item.job_id, state=schema.JobState.RUNNING)
        assert (job_manager.get_job_queue_item(job_id=created_job_item.job_id)).state == schema.JobState.RUNNING

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
        new_job = Mock(id=1, name="dummy")
        created_job_item = await job_manager.add_job(new_job, details={})
        job_manager.set_job_state(job_id=created_job_item.job_id, state=status)
        assert await job_manager.has_unfinished_tasks() is expected

class TestJobRunner:

    @pytest.fixture()
    def queue(self):
        return asyncio.Queue()

    @pytest.fixture()
    def job_runner(self, queue):
        runner = speedcloud.job_manager.JobRunner(queue, storage_root='.')
        async def execute_job(workflow_klass, workflow_options, job):
            job.state = schema.JobState.SUCCESS
        runner.executor.execute_job = execute_job
        return runner

    @pytest.mark.asyncio
    async def test_consume(self, job_runner, queue):

        dummy = Mock(
            spec=speedcloud.job_manager.JobQueueItem,
            job_id="1",
            status=speedcloud.job_manager.JobStatus(),
            job=schema.JobQueueJobDetails(
                details=MagicMock(),
                workflow=schema.JobWorkflow(id=1, name='foo')
            )
        )
        await queue.put(dummy)
        await queue.put(None)
        await job_runner.consume()
        assert dummy.state == schema.JobState.SUCCESS

    @pytest.mark.asyncio
    async def test_notify(self, job_runner, queue):
        dummy = Mock(
            spec=speedcloud.job_manager.JobQueueItem,
            job_id="1",
            status=speedcloud.job_manager.JobStatus(),
            job=schema.JobQueueJobDetails(
                details=MagicMock(),
                workflow=schema.JobWorkflow(id=1, name='foo')
            )
        )
        await queue.put(dummy)
        await queue.put(None)
        watcher = AsyncMock()
        job_runner.add_async_watcher(watcher)
        await job_runner.consume()
        watcher.notify.assert_called()


@pytest.mark.asyncio
@pytest.mark.timeout(5)
async def test_notify_lifts_the_lock_wait_for_update():
    notifier = speedcloud.job_manager.AsyncEventNotifier()
    waiter = notifier.wait_for_update()
    await notifier.notify()
    await waiter


class TestEmitToAsyncQueuedHandler:
    def test_logging_adds_to_queue(self):
        q = asyncio.Queue()
        handler = speedcloud.job_manager.EmitToAsyncQueuedHandler(q)
        my_logger = logging.Logger("tester")
        my_logger.addHandler(handler)
        assert q.qsize() == 0
        my_logger.info('spam')
        assert q.qsize() == 1


    @pytest.mark.asyncio
    async def test_notifies_watcher(self):
        watcher = AsyncMock()
        handler = speedcloud.job_manager.EmitToAsyncQueuedHandler(asyncio.Queue())
        handler.add_async_watcher(watcher)
        my_logger = logging.Logger("tester")
        my_logger.addHandler(handler)
        my_logger.info('spam')
        await handler.notify_async_watchers()
        watcher.assert_called()

    def test_remove_watcher(self):
        watcher = AsyncMock()
        handler = speedcloud.job_manager.EmitToAsyncQueuedHandler(asyncio.Queue())
        handler.add_async_watcher(watcher)
        handler.remove_async_watcher(watcher)
        my_logger = logging.Logger("tester")
        my_logger.addHandler(handler)
        my_logger.info('spam')
        assert watcher.called is False


class TestAsyncJobExecutor:

    class SampleTask(speedwagon.tasks.Subtask):
        name = "my subtask"
        def work(self) -> bool:
            self.log("I'm working")
            return True

    class MyWorkflow(speedwagon.Workflow):

        def create_new_task(self, task_builder: TaskBuilder, **job_args) -> None:
            task_builder.add_subtask(TestAsyncJobExecutor.SampleTask())
            super().create_new_task(task_builder, **job_args)

        def discover_task_metadata(self, initial_results: List[Any], additional_data: Dict[str, Any],
                                   **user_args) -> List[dict]:
            return [
                {"dummy": True},
                {"dummy2": True},
            ]
    class MyWorkflowThatFails(speedwagon.Workflow):

        def create_new_task(self, task_builder: TaskBuilder, **job_args) -> None:
            subtask = Mock(spec=speedwagon.tasks.Subtask, name='subtask', exec=Mock(side_effect=Exception("boom")))
            subtask.name = "my subtask"
            task_builder.add_subtask(subtask)
            super().create_new_task(task_builder, **job_args)

        def discover_task_metadata(self, initial_results: List[Any], additional_data: Dict[str, Any],
                                   **user_args) -> List[dict]:
            return [
                {"dummy": True}
            ]

    @pytest.fixture()
    def job_executor(self):
        return speedcloud.job_manager.AsyncJobExecutor('.')

    @pytest.mark.asyncio
    async def test_notify_of_update(self, job_executor):
        watcher = AsyncMock()
        job_executor.add_watcher(watcher)
        await job_executor.notify_of_update()
        assert watcher.called is True

    @pytest.mark.asyncio
    async def test_execute_job_success(self, job_executor):
        job_params = {
            "Source": "something"
        }
        job_items = Mock(
            spec=speedcloud.job_manager.JobQueueItem,
            status=speedcloud.job_manager.JobStatus(),
            state=schema.JobState.QUEUED,
        )
        await job_executor.execute_job(self.MyWorkflow, job_params, job_items)
        assert job_items.state == schema.JobState.SUCCESS

    @pytest.mark.asyncio
    async def test_execute_job_fails_on_exception(self, job_executor):
        job_params = {
            "Source": "something"
        }
        job_items = Mock(
            spec=speedcloud.job_manager.JobQueueItem,
            status=speedcloud.job_manager.JobStatus(),
            state=schema.JobState.QUEUED,
        )
        with pytest.raises(Exception) as exc:
            await job_executor.execute_job(self.MyWorkflowThatFails, job_params, job_items)
            assert str(exc.value) == "boom"

        assert job_items.state == schema.JobState.FAILED


class TestJobContainer:

    @pytest.fixture()
    def job_container(self):
        return speedcloud.job_manager.JobContainer()

    def test_empty_by_default(self, job_container):
        assert len(job_container) == 0

    def test_len_increase_when_adding(self, job_container):
        job_container.add(Mock(spec=speedcloud.job_manager.JobQueueItem))
        assert len(job_container) == 1


def test_manager_job_log_handler():
    l = logging.Logger("spam")
    h = logging.Handler()
    with speedcloud.job_manager.manager_job_log_handler(l, h):
        assert len(l.handlers) == 1
    assert len(l.handlers) == 0


def test_inject_storage_root():
    root = "/src"
    path = "/myfiles"
    assert speedcloud.job_manager.inject_storage_root(root, value=path) == '/src/myfiles'


@pytest.mark.parametrize(
    'in_value, expected_result',
    [
        (True, True),
        (False, False),
        ("true", True),
        ("False", False),
    ]
)
@pytest.mark.filterwarnings('ignore:"dummy"')
def test_ensure_boolean(in_value, expected_result):
    assert speedcloud.job_manager.ensure_boolean("dummy", in_value) is expected_result


@pytest.mark.parametrize(
    'in_value, expected_result',
    [
        ("true", True),
        ("False", False),
    ]
)
def test_ensure_boolean_strings_have_warnings(in_value, expected_result):
    with pytest.warns(UserWarning):
        assert speedcloud.job_manager.ensure_boolean("dummy", in_value) is expected_result


def test_invalid_ensure_boolean():
    with pytest.raises(ValueError):
        speedcloud.job_manager.ensure_boolean("dummy", None)
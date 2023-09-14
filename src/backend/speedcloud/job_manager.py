"""job manager."""

from __future__ import annotations

import asyncio
import dataclasses
import datetime
import logging
import traceback
import typing
import warnings
from logging import LogRecord
from contextlib import contextmanager
from typing import (
    List,
    Optional,
    Callable,
    Iterable,
    Awaitable,
    Type,
    TYPE_CHECKING,
    TypedDict,
)
import uuid
import speedwagon
from speedcloud.workflow_manager import WorkflowManagerAllWorkflows
from .api import schema
if TYPE_CHECKING:
    from speedcloud.workflow_manager import (
        WorkflowData,
        AbsWorkflowManager,
        WorkflowParam,
    )
    from speedwagon.workflow import UserDataType

__all__ = ["JobManager", "JobRunner", "JobQueueItem", "AsyncEventNotifier"]

module_logger = logging.getLogger(__name__)
module_logger.setLevel(logging.INFO)


class AsyncEventNotifier:
    def __init__(self) -> None:
        self._condition = asyncio.Event()

    async def notify(self) -> None:
        self._condition.set()

    async def wait_for_update(self) -> None:
        await self._condition.wait()
        self._condition.clear()


@dataclasses.dataclass
class JobLog:
    msg: str
    time: float

    class JobLogDict(TypedDict):
        msg: str
        time: float

    def as_dict(self) -> JobLogDict:
        return {"msg": self.msg, "time": self.time}


@dataclasses.dataclass
class JobStatus:
    progress: Optional[float] = None
    start_time: Optional[datetime.datetime] = None
    logs: List[JobLog] = dataclasses.field(default_factory=list)
    current_task: Optional[str] = None
    report: Optional[str] = None


@dataclasses.dataclass
class JobQueueItem:
    job: schema.JobQueueJobDetails
    state: schema.JobState
    order: int
    job_id: str
    time_submitted: datetime.datetime
    status: JobStatus = dataclasses.field(default_factory=JobStatus)


@dataclasses.dataclass
class JobContainerMetadata:
    data: JobQueueItem
    accessed: bool = False


class JobContainer:
    def __init__(self) -> None:
        self._job_queue: List[JobContainerMetadata] = []

    def __len__(self) -> int:
        return len(self._job_queue)

    def job_queue(self) -> List[JobQueueItem]:
        return [item.data for item in self._job_queue]

    def add(self, item: JobQueueItem) -> None:
        self._job_queue.append(JobContainerMetadata(data=item))

    def iter(self) -> Iterable[JobContainerMetadata]:
        for job in self._job_queue:
            if job.accessed:
                continue
            yield job

    def pop_next(self) -> typing.Iterator[JobQueueItem]:
        for job in self.iter():
            job.accessed = True
            yield job.data


class JobManager:
    """JobManager.

    Manages the jobs given.
    """

    def __init__(
            self,
            queue: asyncio.Queue[JobQueueItem] = asyncio.Queue()
    ) -> None:
        """Create a job manager.

        Args:
            queue: job queue be used to send to a worker.
        """
        self.stop = asyncio.Event()
        self._new_item_added = asyncio.Event()
        self._container = JobContainer()
        self._job_queue = queue
        self._notification_manager = NotificationManager()

    async def _wait_for_next_event(self) -> None:
        tasks = [
            asyncio.create_task(
                self._new_item_added.wait(),
                name="wait_for_new_item"
            ),
            asyncio.create_task(asyncio.sleep(10), name="timeout"),
            asyncio.create_task(self.stop.wait(), name="stop_called"),
        ]
        await asyncio.gather(
            asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED),
            self._notification_manager.notify_async()
        )
        for task in tasks:
            if not task.done():
                task.cancel()

        self._new_item_added.clear()

    async def produce(self) -> None:
        """Add jobs into a queue to be picked up by the workers."""
        while True:
            module_logger.info("Checking job queue")
            try:
                await self._job_queue.put(next(self._container.pop_next()))
            except StopIteration:
                if not self.stop.is_set():
                    try:
                        await self._wait_for_next_event()
                    except TimeoutError:
                        continue
                    continue
                break

    def generate_job_id(self) -> str:
        """Generate a unique id for a job."""
        return str(uuid.uuid4())

    def get_job_queue_item(self, job_id: str) -> JobQueueItem:
        """Get item in the queue based on the job id."""
        for job_queue_item in self._container.job_queue():
            if job_queue_item.job_id == job_id:
                return job_queue_item
        raise ValueError(f"No job found with id {job_id}")

    def job_queue(self) -> List[JobQueueItem]:
        """Get the current job queue."""
        return self._container.job_queue()

    async def has_unfinished_tasks(self) -> bool:
        """Check on unfinished tasks."""
        all_tasks_running = [
            job.state in (schema.JobState.QUEUED, schema.JobState.RUNNING)
            for job in self.job_queue()
        ]
        return any(all_tasks_running)

    def _has_queued(self) -> bool:
        return any(i.state == schema.JobState.QUEUED for i in self.job_queue())

    async def add_job(
            self,
            workflow_data: WorkflowData,
            details: typing.Dict[str, UserDataType]
    ) -> JobQueueItem:
        new_queued_item = JobQueueItem(
            job={
                "details": details,
                "workflow": {
                    "id": workflow_data.id,
                    "name": workflow_data.name,
                },
            },
            state=schema.JobState.QUEUED,
            order=len(self._container),
            job_id=self.generate_job_id(),
            time_submitted=datetime.datetime.now(),
        )
        self._container.add(new_queued_item)

        self._new_item_added.set()
        await self._notification_manager.notify_async()
        return new_queued_item

    def set_job_state(self, job_id: str, state: schema.JobState) -> None:
        """Set the state of a job."""
        item = self.get_job_queue_item(job_id)
        item.state = state

    def add_async_watcher(self, watcher: AsyncEventNotifier) -> None:
        self._notification_manager.add_async_watcher(watcher)


class NotificationManager:
    def __init__(self) -> None:
        self._async_watchers: List[AsyncEventNotifier] = []

    async def notify_async(self) -> None:
        await asyncio.gather(
            *[watcher.notify() for watcher in self._async_watchers]
        )

    def add_async_watcher(self, watcher: AsyncEventNotifier) -> None:
        self._async_watchers.append(watcher)


class EmitToAsyncQueuedHandler(logging.Handler):
    def __init__(
            self,
            queue: asyncio.Queue[JobLog],
            level: int = logging.NOTSET
    ) -> None:
        super().__init__(level)
        self._queue = queue
        self._async_watchers: List[Callable[[], Awaitable[None]]] = []

    def add_async_watcher(
            self,
            watcher: Callable[[], Awaitable[None]]
    ) -> None:
        self._async_watchers.append(watcher)

    def remove_async_watcher(
            self,
            watcher: Callable[[], Awaitable[None]]
    ) -> None:
        self._async_watchers.remove(watcher)

    async def notify_async_watchers(self) -> None:
        await asyncio.gather(
            *[watcher() for watcher in self._async_watchers]
        )

    def _notify(self) -> None:
        try:
            event_loop = asyncio.get_running_loop()
            asyncio.ensure_future(
                self.notify_async_watchers(), loop=event_loop
            )
        except RuntimeError:
            asyncio.run(self.notify_async_watchers())

    def emit(self, record: LogRecord) -> None:
        self._queue.put_nowait(
            JobLog(msg=self.format(record), time=round(record.created, 3))
        )
        self._notify()


@contextmanager
def manager_job_log_handler(
        logger: logging.Logger,
        handler: logging.Handler
) -> typing.Generator[None, None, None]:
    logger.addHandler(handler)
    yield
    logger.removeHandler(handler)


class AsyncJobExecutor:
    def __init__(self, working_path: str) -> None:
        self._watchers: List[Callable[[], Awaitable[None]]] = []
        self.working_path = working_path

    def add_watcher(self, func: Callable[[], Awaitable[None]]) -> None:
        self._watchers.append(func)

    async def notify_of_update(self) -> None:
        await asyncio.gather(
            *[watcher() for watcher in self._watchers]
        )

    async def execute_job(
            self,
            workflow_klass: typing.Type[speedwagon.Workflow],
            workflow_options: typing.Dict[str, typing.Any],
            job: JobQueueItem,

    ) -> None:
        """Execute job."""
        job.state = schema.JobState.RUNNING
        job.status.start_time = datetime.datetime.now()

        try:
            await self._run(
                workflow_klass,
                workflow_options,
                job.status,
                self.notify_of_update
            )

            job.state = schema.JobState.SUCCESS
        except Exception as exc:
            job.state = schema.JobState.FAILED
            traceback.print_exception(exc)
            raise exc
        await self.notify_of_update()

    @staticmethod
    def _update_progress(task_scheduler, status) -> None:
        if task_scheduler.current_task_progress:
            current = task_scheduler.current_task_progress
            total = task_scheduler.total_tasks
            if current is not None and total is not None:
                status.progress = round((current / total) * 100, 2)

    @staticmethod
    async def _flush_log_queue(log_q, job_status: JobStatus) -> None:
        while not log_q.empty():
            message = await log_q.get()
            job_status.logs.append(message)
            log_q.task_done()

    async def _run(
        self,
        workflow_klass: Type[speedwagon.Workflow],
        options: typing.Dict[str, UserDataType],
        status: JobStatus,
        notify: Callable[[], Awaitable[None]],
    ) -> None:
        async def update_log_messages() -> None:
            await asyncio.gather(
                self._flush_log_queue(log_q, status),
                notify()
            )

        job_logger = logging.getLogger(__name__)
        job_logger.setLevel(logging.INFO)

        task_scheduler = speedwagon.runner_strategies.TaskScheduler(".")
        task_scheduler.logger = job_logger
        log_q: asyncio.Queue[JobLog] = asyncio.Queue()
        log_message_queue_handler = EmitToAsyncQueuedHandler(log_q)

        log_message_queue_handler.add_async_watcher(update_log_messages)

        await notify()
        workflow = workflow_klass()
        with manager_job_log_handler(
                task_scheduler.logger,
                log_message_queue_handler
        ):

            def monkeypatch_log(message: str):
                job_logger.info(message)

            for task in task_scheduler.iter_tasks(
                workflow=workflow, options=options
            ):
                status.current_task = task.task_description()
                setattr(task, 'log', monkeypatch_log)
                await asyncio.to_thread(task.exec)
                self._update_progress(task_scheduler, status)
        status.progress = 100.0
        await self.notify_of_update()
        status.report = task_scheduler.task_generator_strategy.generate_report(
            workflow, options, task_scheduler.task_generator_strategy.results()
        )
        status.current_task = ""
        await self.notify_of_update()


def inject_storage_root(storage_root: str, value: str) -> str:
    return f"{storage_root}{value}"


def ensure_boolean(name: str, value) -> bool:
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        warnings.warn(
            f'"{name}" has widget_type "BooleanSelect" but value is type '
            f'string. Converting to a boolean up for now.'
        )
        converted_value = {
            "true": True,
            "True": True,
            "false": False,
            "False": False,
        }.get(value)
        if converted_value is not None:
            return converted_value

    raise ValueError(f'Don\'t know how to fix up "{value}"')


class FixUpProtocol(typing.Protocol):
    def __call__(
            self,
            name: str,
            value: typing.Any,
            param_metadata: WorkflowParam
    ) -> typing.Any: ...


class JobRunner:
    """JobRunner.

    Designed to consume any jobs in a queue.
    """

    def __init__(
            self,
            job_queue: asyncio.Queue[JobQueueItem],
            storage_root: str,
            workflow_manager: Optional[AbsWorkflowManager] = None
    ) -> None:
        """Create a job runner.

        Args:
            job_queue: job queue for pull jobs off to run.
        """
        self._job_queue = job_queue
        self._notification_manager = NotificationManager()
        self.working_path = storage_root
        self.executor = AsyncJobExecutor(storage_root)
        self.executor.add_watcher(self._notification_manager.notify_async)
        self.workflow_manager = (
                workflow_manager or WorkflowManagerAllWorkflows()
        )

    def prep_job(
            self,
            queue_item: JobQueueItem
    ) -> typing.Tuple[
        Type[speedwagon.Workflow], typing.Dict[str, typing.Any]
    ]:

        workflow = self.workflow_manager.get_workflow_type_by_id(
            queue_item.job['workflow']['id']
        )

        user_params = queue_item.job['details'].copy()

        info = self.workflow_manager.get_workflow_info_by_id(
            queue_item.job['workflow']['id']
        )

        workflow_params: typing.Dict[
            str,
            WorkflowParam
        ] = {param['label']: param for param in info['parameters']}

        fixup_funcs: typing.Dict[str, FixUpProtocol] = {
            'BooleanSelect':
                lambda name, value, param_metadata: ensure_boolean(
                    name=name,
                    value=value
                ),
            'DirectorySelect':
                lambda name, value, param_metadata: inject_storage_root(
                    storage_root=self.working_path,
                    value=value
                )
        }

        for name_ in user_params.keys():
            assert name_ in workflow_params
            fix_up_func =\
                fixup_funcs.get(workflow_params[name_]['widget_type'])

            if fix_up_func is None:
                continue
            new_result = fix_up_func(
                name=name_,
                value=user_params[name_],
                param_metadata=workflow_params[name_]
            )
            user_params[name_] = new_result
        return workflow, user_params

    async def consume(self) -> None:
        """Consume jobs in the job queue.

        This should be run as a task and canceled when done otherwise it will
         run forever.
        """
        while True:
            job_params: Optional[JobQueueItem] = await self._job_queue.get()
            if job_params is None:
                module_logger.debug(
                    "JobRunner received a None value from queue. "
                    "Stopping consume loop"
                )
                break
            workflow_klass, options = self.prep_job(job_params)
            try:
                await self.executor.execute_job(
                    workflow_klass,
                    options,
                    job_params
                )
                module_logger.info("Job %s done", job_params.job_id)
            finally:
                self._job_queue.task_done()
            await self._notification_manager.notify_async()

    def add_async_watcher(self, watcher: AsyncEventNotifier) -> None:
        self._notification_manager.add_async_watcher(watcher)

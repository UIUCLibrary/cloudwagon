"""job manager."""

from __future__ import annotations

import abc
import time
import asyncio
import collections.abc
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
try:
    from typing import Unpack
except ImportError:  # pragma: no cover
    from typing_extensions import Unpack


import uuid
import speedwagon
from speedcloud.workflow_manager import WorkflowManagerAllWorkflows
from speedcloud.exceptions import JobAlreadyAborted
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
    """Notify of event."""

    def __init__(self) -> None:
        """Create a new AsyncEventNotifier object."""
        self._condition = asyncio.Event()

    async def notify(self) -> None:
        """Notify of an event."""
        self._condition.set()

    async def wait_for_update(self) -> None:
        """Wait for a notification."""
        await self._condition.wait()
        self._condition.clear()


class JobLog(TypedDict):
    msg: str
    time: float


class JobStatus(typing.TypedDict, total=False):
    progress: Optional[float]
    start_time: Optional[datetime.datetime]
    logs: List[JobLog]
    current_task: Optional[str]
    report: Optional[str]


@dataclasses.dataclass
class JobQueueItem:
    """Job queue item."""

    job: schema.JobQueueJobDetails
    state: schema.JobState
    order: int
    job_id: str
    time_submitted: datetime.datetime
    status: JobStatus = dataclasses.field(
        default_factory=lambda: JobStatus(
            progress=None,
            start_time=None,
            logs=[],
            report=None,
            current_task=None,
        )
    )


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
        self, queue: Optional[asyncio.Queue[JobQueueItem]] = None
    ) -> None:
        """Create a job manager.

        Args:
            queue: job queue be used to send to a worker.
        """
        self.stop = asyncio.Event()
        self._new_item_added = asyncio.Event()
        self._container = JobContainer()
        self._job_queue = queue or asyncio.Queue()
        self._notification_manager = NotificationManager()

    async def _wait_for_next_event(self) -> None:
        tasks = [
            asyncio.create_task(
                self._new_item_added.wait(), name="wait_for_new_item"
            ),
            asyncio.create_task(asyncio.sleep(10), name="timeout"),
            asyncio.create_task(self.stop.wait(), name="stop_called"),
        ]
        await asyncio.gather(
            asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED),
            self._notification_manager.notify_async(),
        )
        for task in tasks:
            if not task.done():
                task.cancel()
        tasks.clear()
        self._new_item_added.clear()

    async def produce(self) -> None:
        """Add jobs into a queue to be picked up by the workers."""
        while True:
            module_logger.debug("Checking job queue")
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
        details: typing.Dict[str, UserDataType],
    ) -> JobQueueItem:
        """Add job to manager."""
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
        """Add a watcher to be notified."""
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


class EmitToAsyncCallback(logging.Handler):
    def __init__(
        self,
        level: int = logging.NOTSET,
        queue: Optional[asyncio.Queue[JobLog]] = None,
    ) -> None:
        super().__init__(level)
        self._queue: asyncio.Queue[JobLog] = queue or asyncio.Queue()
        self._async_watchers: List[
            Callable[[List[JobLog]], Awaitable[None]]
        ] = []

    def add_async_watcher(
        self, watcher: Callable[[List[JobLog]], Awaitable[None]]
    ) -> None:
        self._async_watchers.append(watcher)

    def remove_async_watcher(
        self, watcher: Callable[[List[JobLog]], Awaitable[None]]
    ) -> None:
        self._async_watchers.remove(watcher)

    async def notify_async_watchers(self) -> None:
        messages = []
        while not self._queue.empty():
            message = await self._queue.get()
            messages.append(message)
            self._queue.task_done()
        if messages:
            await asyncio.gather(
                *[watcher(messages) for watcher in self._async_watchers]
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
    logger: logging.Logger, handler: logging.Handler
) -> typing.Generator[None, None, None]:
    logger.addHandler(handler)
    yield
    logger.removeHandler(handler)


class TaskExecutor:
    def __init__(
        self,
        task: speedwagon.tasks.Subtask,
        task_running_strategy: Optional[
            Callable[[speedwagon.tasks.Subtask], None]
        ] = None,
    ):
        def default_running_strategy(_task: speedwagon.tasks.Subtask) -> None:
            _task.exec()

        self.task_running_strategy: Callable[
            [speedwagon.tasks.Subtask], None
        ] = (task_running_strategy or default_running_strategy)

        self._task = task

    def exec(self) -> None:
        self.task_running_strategy(self._task)

    def task_description(self) -> Optional[str]:
        return self._task.task_description()

    def task_results(self) -> List[speedwagon.tasks.Result]:
        return self._task.results


class TaskGenerator(collections.abc.Iterator):
    def __init__(
        self,
        workflow: speedwagon.Workflow,
        workflow_options,
        log_level=logging.INFO,
    ):
        self._task_scheduler = speedwagon.runner_strategies.TaskScheduler(".")
        self.workflow = workflow
        self.workflow_options = workflow_options
        self._job_logger = logging.getLogger(__name__)
        self._job_logger.setLevel(log_level)
        self._task_scheduler.logger = self._job_logger
        self._generator: collections.abc.Generator[
            speedwagon.tasks.Subtask, None, None
        ] = self._task_scheduler.iter_tasks(
            self.workflow, self.workflow_options
        )

        self.log_message_queue_handler = EmitToAsyncCallback()
        self._async_log_handlers: List[
            Callable[[List[JobLog]], Awaitable[None]]
        ] = []
        self.log_message_queue_handler.add_async_watcher(self.logs_updated)

    def results(self) -> List[speedwagon.tasks.Result]:
        return self._task_scheduler.task_generator_strategy.results()

    async def logs_updated(self, logs: List[JobLog]) -> None:
        await asyncio.gather(
            *[watcher(logs) for watcher in self._async_log_handlers]
        )

    def remove_async_log_handler(
        self, callback: Callable[[List[JobLog]], Awaitable[None]]
    ) -> None:
        self._async_log_handlers.remove(callback)

    def add_async_log_handler(
        self, callback: Callable[[List[JobLog]], Awaitable[None]]
    ) -> None:
        self._async_log_handlers.append(callback)

    def __next__(self) -> TaskExecutor:
        def monkeypatch_log(message: str) -> None:
            self._job_logger.info(message)

        def call_with_log_handler(task: speedwagon.tasks.Subtask) -> None:
            with manager_job_log_handler(
                self._task_scheduler.logger, self.log_message_queue_handler
            ):
                setattr(task, "log", monkeypatch_log)
                task.exec()

        return TaskExecutor(
            next(self._generator), task_running_strategy=call_with_log_handler
        )

    def generate_report(self) -> Optional[str]:
        return self._task_scheduler.task_generator_strategy.generate_report(
            self.workflow,
            self.workflow_options,
            self._task_scheduler.task_generator_strategy.results(),
        )

    def percent_completed(self) -> Optional[float]:
        completed = self._task_scheduler.current_task_progress
        total = self._task_scheduler.total_tasks
        return (
            None
            if completed is None or total is None
            else (completed / total) * 100
        )


T = typing.TypeVar("T")
CallbackType = typing.TypeVar(  # pylint: disable=invalid-name
    "CallbackType",
    bound=Callable
)


class AbsCallbackManager(abc.ABC, typing.Generic[CallbackType]):
    def __init__(self) -> None:
        self.callbacks: typing.DefaultDict[
            str,
            List[CallbackType]
        ] = collections.defaultdict(list)

    def add_callback(
            self,
            event_name: str,
            callback: CallbackType
    ) -> None:
        self.callbacks[event_name].append(callback)

    def remove_callback(
            self,
            event_name: str,
            callback: CallbackType
    ) -> None:
        self.callbacks[event_name].remove(callback)


class UpdateCallbackManager(AbsCallbackManager[Callable[[typing.Any], None]]):
    def notify(self, event_name: str, item: T) -> None:
        for callback in self.callbacks[event_name]:
            callback(item)


class AsyncUpdateNotifyManager(
    AbsCallbackManager[Callable[[], Awaitable[None]]]
):
    async def notify(self, event_name: str) -> None:
        await asyncio.gather(*[
            watcher() for watcher in self.callbacks[event_name]
        ])


class AsyncJobExecutor:
    def __init__(self, working_path: str) -> None:
        self.working_path = working_path
        self._abort = asyncio.Event()
        self._workflow_klass: Optional[Type[speedwagon.Workflow]] = None
        self._workflow_options: Optional[typing.Dict[str, typing.Any]] = None
        self._task_generator: Optional[TaskGenerator] = None
        self._notification_manager = UpdateCallbackManager()
        self._async_notification_manager = AsyncUpdateNotifyManager()

    def add_on_job_status_change_callback(
        self,
        callback: Callable[[JobStatus], None]
    ) -> None:
        self._notification_manager.add_callback("on_status_changed", callback)

    def remove_on_job_status_change_callback(
        self,
        callback: Callable[[JobStatus], None]
    ) -> None:
        self._notification_manager.remove_callback(
            "on_status_changed",
            callback
        )

    def add_on_state_change_callback(
        self,
        callback: Callable[[schema.JobState], None]
    ) -> None:
        self._notification_manager.add_callback("on_state", callback)

    def remove_on_state_change_callback(
        self,
        callback: Callable[[schema.JobState], None]
    ) -> None:
        self._notification_manager.remove_callback("on_state", callback)

    def abort_current_job(self) -> None:
        self._abort.set()
        if self._task_generator is not None:
            self._task_generator.remove_async_log_handler(
                self._update_log_messages
            )
            self._task_generator = None
        self.update_job_state(schema.JobState.ABORTED)

    def add_watcher(self, func: Callable[[], Awaitable[None]]) -> None:
        self._async_notification_manager.add_callback("watcher", func)

    async def notify_of_update(self) -> None:
        await self._async_notification_manager.notify('watcher')

    def load_job(
        self,
        workflow_klass: typing.Type[speedwagon.Workflow],
        workflow_options: typing.Dict[str, typing.Any],
    ) -> None:
        self._workflow_klass = workflow_klass
        self._workflow_options = workflow_options

    async def execute_job(self) -> schema.JobState:
        """Execute job."""
        if self._workflow_klass is None or self._workflow_options is None:
            raise ValueError("workflow and options need to be set first.")

        self.update_job_state(schema.JobState.RUNNING)
        try:
            result = await self._run(
                self._workflow_klass,
                self._workflow_options
            )
            self.update_job_state(result)
            return result
        except Exception as exc:
            self.update_job_state(schema.JobState.FAILED)
            traceback.print_exception(exc)
            raise exc
        finally:
            self._workflow_klass = None
            self._workflow_options = None
            await self.notify_of_update()

    async def _update_log_messages(self, logs: List[JobLog]) -> None:
        self.update_status(logs=logs)
        await self.notify_of_update()

    def _execute_task(
            self,
            task: TaskExecutor,
            task_generator: TaskGenerator
    ) -> None:
        if progress := task_generator.percent_completed():
            progress = round(progress, 2)

        status: JobStatus = {"progress": progress}
        if current_task := task.task_description():
            status["current_task"] = current_task

        self.update_status(**status)
        task.exec()

    async def _run(
        self,
        workflow_klass: Type[speedwagon.Workflow],
        workflow_options: typing.Dict[str, typing.Any],
    ) -> schema.JobState:

        notify_future = self.notify_of_update()

        self._task_generator = TaskGenerator(
            workflow_klass(), workflow_options
        )
        self._task_generator.add_async_log_handler(self._update_log_messages)
        await notify_future
        self.update_status(start_time=datetime.datetime.now())
        while True:
            if self._abort.is_set():
                self.update_status(progress=None)
                self._abort.clear()
                self.update_job_state(schema.JobState.ABORTED)
                await self.notify_of_update()
                return schema.JobState.ABORTED

            try:
                await asyncio.to_thread(
                    lambda task_=self._next_task(), gen=self._task_generator:
                    self._execute_task(task_, gen)
                )
            except StopIteration:
                break
            await self.notify_of_update()

        last_status_update: typing.Dict[str, typing.Any] = {
            "current_task": "",
            "progress": self._task_generator.percent_completed(),
        }
        if report := self._task_generator.generate_report():
            last_status_update["report"] = report
            last_status_update["logs"] = [JobLog(msg=report, time=time.time())]

        self.update_status(**last_status_update)

        await self.notify_of_update()
        return schema.JobState.SUCCESS

    def _next_task(self) -> TaskExecutor:
        if self._abort.is_set():
            raise StopIteration
        if self._task_generator is None:
            if self._workflow_klass is None:
                raise ValueError("Workflow not selected")
            self._task_generator = TaskGenerator(
                self._workflow_klass(), self._workflow_options
            )
            self._task_generator.add_async_log_handler(
                self._update_log_messages
            )
        return next(self._task_generator)

    def execute_next_task(self) -> None:
        task = self._next_task()
        if self._task_generator is None:
            raise ValueError(
                "task generator not loaded, Did you call load_job first?"
            )
        self._execute_task(task, self._task_generator)

    def update_status(self, **status: Unpack[JobStatus]) -> None:
        new_status = typing.cast(JobStatus, {**status})
        self._notification_manager.notify("on_status_changed", new_status)

    def update_job_state(self, job_state: schema.JobState) -> None:
        self._notification_manager.notify("on_state", job_state)


def inject_storage_root(storage_root: str, value: str) -> str:
    return f"{storage_root}{value}"


def ensure_boolean(name: str, value: typing.Any) -> bool:
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        warnings.warn(
            f'"{name}" has widget_type "BooleanSelect" but value is type '
            f"string. Converting to a boolean up for now."
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
        self, name: str, value: typing.Any, param_metadata: WorkflowParam
    ) -> typing.Any:
        ...


class JobRunner:
    """JobRunner.

    Designed to consume any jobs in a queue.
    """

    def __init__(
        self,
        job_queue: asyncio.Queue[JobQueueItem],
        storage_root: str,
        workflow_manager: Optional[AbsWorkflowManager] = None,
    ) -> None:
        """Create a job runner.

        Args:
            job_queue: job queue for pull jobs off to run.
            storage_root: path that runner storage starts from.
            workflow_manager: workflow manager
        """
        self._job_queue = job_queue
        self._notification_manager = NotificationManager()
        self.working_path = storage_root
        self.executor = AsyncJobExecutor(storage_root)
        self.executor.add_watcher(self._notification_manager.notify_async)
        self.workflow_manager = (
            workflow_manager or WorkflowManagerAllWorkflows()
        )
        self._current_job: Optional[JobQueueItem] = None

    def abort(self, job_id: str) -> None:
        """Abort running job."""
        if (
            self._current_job is not None
            and self._current_job.job_id == job_id
        ):
            self.executor.abort_current_job()
        else:
            raise JobAlreadyAborted(job_id)

    def prep_job(
        self, queue_item: JobQueueItem
    ) -> typing.Tuple[Type[speedwagon.Workflow], typing.Dict[str, typing.Any]]:
        """Prepare job for running."""
        workflow = self.workflow_manager.get_workflow_type_by_id(
            queue_item.job["workflow"]["id"]
        )

        user_params = queue_item.job["details"].copy()

        info = self.workflow_manager.get_workflow_info_by_id(
            queue_item.job["workflow"]["id"]
        )

        workflow_params: typing.Dict[str, WorkflowParam] = {
            param["label"]: param for param in info["parameters"]
        }

        fixup_funcs: typing.Dict[str, FixUpProtocol] = {
            "BooleanSelect":
                lambda name, value, param_metadata: ensure_boolean(
                    name=name, value=value
                ),
            "DirectorySelect":
                lambda name, value, param_metadata: inject_storage_root(
                    storage_root=self.working_path, value=value
                ),
            "FileSelect":
                lambda name, value, param_metadata: inject_storage_root(
                    storage_root=self.working_path, value=value
                ),
        }

        for name_ in user_params.keys():
            assert name_ in workflow_params
            fix_up_func = fixup_funcs.get(
                workflow_params[name_]["widget_type"]
            )

            if fix_up_func is None:
                continue
            new_result = fix_up_func(
                name=name_,
                value=user_params[name_],
                param_metadata=workflow_params[name_],
            )
            user_params[name_] = new_result
        return workflow, user_params

    @staticmethod
    def _update_job_status(
            status: JobStatus,
            job_queue_item: JobQueueItem
    ) -> None:
        # This should have JobStatus values but not requiring them
        if "progress" in status:
            job_queue_item.status["progress"] = status["progress"]

        if "current_task" in status:
            job_queue_item.status["current_task"] = status["current_task"]

        if "start_time" in status and status['start_time'] is not None:
            job_queue_item.status["start_time"] = status["start_time"]

        if "logs" in status:
            job_queue_item.status["logs"] += status["logs"]

        if "report" in status and status['report'] is not None:
            job_queue_item.status["report"] = status["report"]

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
            job_params = typing.cast(JobQueueItem, job_params)
            workflow_klass, options = self.prep_job(job_params)

            # Note: without the casting in the functions below, MyPy thinks
            #   that job_params could be None regardless of the check above
            def update_job_status(
                    status: JobStatus,
                    params: JobQueueItem = typing.cast(
                        JobQueueItem,
                        job_params
                    )
            ) -> None:
                self._update_job_status(status, params)

            def update_state(
                    state: schema.JobState,
                    params: JobQueueItem = typing.cast(
                        JobQueueItem,
                        job_params
                    )
            ) -> None:
                params.state = state

            try:
                self._current_job = job_params
                self.executor.load_job(workflow_klass, options)
                self.executor.add_on_job_status_change_callback(
                    update_job_status
                )

                self.executor.add_on_state_change_callback(update_state)
                job_params.state = await self.executor.execute_job()
                module_logger.info("Job %s done", job_params.job_id)

            finally:
                self.executor.remove_on_state_change_callback(update_state)
                self.executor.remove_on_job_status_change_callback(
                    update_job_status
                )
                self._job_queue.task_done()
                self._current_job = None
            await self._notification_manager.notify_async()

    def add_async_watcher(self, watcher: AsyncEventNotifier) -> None:
        """Add a watcher to be notified."""
        self._notification_manager.add_async_watcher(watcher)

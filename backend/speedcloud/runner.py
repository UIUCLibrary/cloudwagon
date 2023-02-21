import collections.abc
import logging
import typing
from dataclasses import dataclass
from logging import LogRecord
import speedwagon
from collections import deque
from typing import Optional, Callable, Iterator, Dict, Any
import threading
from concurrent.futures import ThreadPoolExecutor
from collections.abc import AsyncIterable


@dataclass
class StatusUpdate:
    log: Optional[str] = None
    progress: Optional[float] = None
    task: Optional[str] = None


class NotifyingDeque(deque):
    def __init__(self, *args, logger, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.callback: Optional[Callable[[], None]] = None
        self.logger = logger

    def append(self, item) -> None:
        # self.logger.info(item)
        super().append(item)
        if self.callback:
            self.callback()


class TaskRunner:
    def __init__(
            self,
            task: speedwagon.tasks.Subtask,
            logger: logging.Logger
    ):
        self._task = task
        self.logger = logger

    def task_done(self) -> bool:
        return self._task.status not in [
            speedwagon.tasks.tasks.TaskStatus.WORKING
        ]

    def needs_updating(self) -> bool:
        if self.task_done():
            return True
        if len(self._task.parent_task_log_q) > 0:
            return True
        return False

    async def run(
            self,
    ) -> typing.AsyncIterator[StatusUpdate]:

        # if self.logger:
        #     self._task.parent_task_log_q = type('reporter', (object,), {
        #         "append": self.logger.info
        #     })
        #     self.logger.info(f'here with {self._task.task_description()}')
        # yield {"task": self._task.task_description()}

        # self._task.parent_task_log_q = self.logger.info
        self._task.parent_task_log_q = NotifyingDeque(logger=self.logger)
        cv = threading.Condition()

        def work() -> None:
            with cv:
                # self._task.parent_task_log_q.notify_callback = cv.notify
                self._task.exec()
        with ThreadPoolExecutor(max_workers=1) as pool:
            pool.submit(work)
            yield StatusUpdate()
            while not self.task_done():
                with cv:
                    cv.wait_for(self.needs_updating)
                    while len(self._task.parent_task_log_q) > 0:
                        yield StatusUpdate(
                            log=self._task.parent_task_log_q.pop()
                        )
        while len(self._task.parent_task_log_q) > 0:
            yield StatusUpdate(log=self._task.parent_task_log_q.pop())


class LogGen(collections.abc.Iterable):
    def __init__(self) -> None:
        self._count = 0
        super().__init__()
        self.values: typing.List[str] = []

    def __iter__(self) -> Iterator[str]:
        return self

    def __next__(self):
        if len(self.values) == 0:
            raise StopIteration
        return self.values.pop(0)

    def __aiter__(self) -> "LogGen":
        return self


class BufferedHandler(logging.Handler):

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.values: typing.Deque[str] = deque()

    def emit(self, record: LogRecord) -> None:
        self.values.append(self.format(record))

    async def iter_messages(self) -> typing.AsyncIterator[StatusUpdate]:
        self.flush()
        for log_message in self.values:
            yield StatusUpdate(
                log=log_message
            )

    def clear(self) -> None:
        self.values.clear()


class JobFinished(Exception):
    pass


async def flush_messages(
        output_handler: BufferedHandler
) -> AsyncIterable[Dict[str, str]]:
    output_handler.flush()
    for log_message in output_handler.values:
        yield {"log": log_message}
    output_handler.values.clear()


class JobRunner:
    def __init__(self) -> None:
        self.abort = None

    async def iter_job(
            self,
            workflow: speedwagon.Workflow,
            workflow_options: Dict[str, Any]
    ) -> typing.AsyncIterator[StatusUpdate]:
        job_logger = logging.getLogger(__name__)
        job_logger.setLevel(logging.INFO)

        task_scheduler = speedwagon.runner_strategies.TaskScheduler(".")
        task_scheduler.logger = job_logger

        output_handler = BufferedHandler()
        task_scheduler.logger.addHandler(output_handler)

        try:
            for task in task_scheduler.iter_tasks(
                    workflow=workflow,
                    options=workflow_options):
                if self.abort:
                    yield StatusUpdate(
                        log="Aborted",
                        task="Aborted",
                        progress=0.0
                    )
                    break
                task_runner = TaskRunner(task, logger=job_logger)
                yield StatusUpdate(task=task.task_description())
                yield StatusUpdate(
                    progress=await calc_progress(task_scheduler)
                )
                async for packet in task_runner.run():
                    async for message in output_handler.iter_messages():
                        yield message
                    output_handler.clear()
                    yield packet
                yield StatusUpdate(
                    progress=await calc_progress(task_scheduler)
                )
            async for message in output_handler.iter_messages():
                yield message
            output_handler.clear()
            yield StatusUpdate(
                progress=1.0,
                task="Done"
            )
            # yield {
            #     "progress": 1,
            #     "task": "Done",
            # }
        finally:
            job_logger.removeHandler(output_handler)


async def calc_progress(
        task_scheduler: speedwagon.runner_strategies.TaskScheduler
):
    if task_scheduler.total_tasks is not None and \
            task_scheduler.current_task_progress is not None:
        current = task_scheduler.current_task_progress
        total = task_scheduler.total_tasks
        progress = current / total
    else:
        progress = 0
    return progress

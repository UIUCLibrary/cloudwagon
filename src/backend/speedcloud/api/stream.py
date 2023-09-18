"""Stream generation."""

import abc
import typing
from functools import wraps
from typing import AsyncGenerator, List, Optional
import contextlib
import asyncio
from speedcloud.job_manager import (
    AsyncEventNotifier,
    JobQueueItem,
    JobRunner,
    JobManager
)

from . import packets
from . import schema

__all__ = [
    "job_progress_packet_generator",
    "only_new_data",
    "wait_for_first_prereq",
]
MESSAGE_STREAM_DELAY = 30


class AbsWaitEvent(abc.ABC):

    def __init__(self, name: Optional[str]) -> None:
        super().__init__()
        self.name = name

    @abc.abstractmethod
    async def wait_for_update(self) -> None:
        pass

    def reset(self) -> None:
        """Reset any state set during wait_for_update."""


class SleepEvent(AbsWaitEvent):

    def __init__(self, time: float, name: Optional[str]) -> None:
        super().__init__(name)
        self.time = time

    async def wait_for_update(self) -> None:
        await asyncio.sleep(self.time)


class WaitForAsyncEvent(AbsWaitEvent):

    def __init__(
            self,
            event_notifier: AsyncEventNotifier,
            name: Optional[str]
    ) -> None:
        super().__init__(name)
        self.waiter = event_notifier

    async def wait_for_update(self) -> None:
        await self.waiter.wait_for_update()


class TaskWaiter:

    def __init__(self, prerequisites: List[AbsWaitEvent]) -> None:
        self.prereqs = prerequisites

        self._tasks: List[asyncio.Task] = []
        self._add_prerequisites()

    def _add_prerequisites(self) -> None:
        self._tasks = [
            asyncio.create_task(
                task.wait_for_update(),
                name=task.name if task.name is not None else str(task)
            ) for task in self.prereqs
        ]

    async def wait_for_first(self) -> None:
        await asyncio.wait(self._tasks, return_when=asyncio.FIRST_COMPLETED)
        self.reset()

    def cancel_waiting(self) -> None:
        for task in self._tasks:
            if not task.done():
                task.cancel()

    def reset(self) -> None:
        self.cancel_waiting()
        for pre_req in self.prereqs:
            pre_req.reset()
        self._add_prerequisites()


@contextlib.asynccontextmanager
async def wait_for_first_prereq(
    prerequisites: List[AbsWaitEvent]
) -> typing.AsyncIterator[TaskWaiter]:
    """Context manager to help with waiting for a prereq to be finished."""
    waiter = TaskWaiter(prerequisites)
    yield waiter
    await waiter.wait_for_first()
    waiter.reset()
    waiter.cancel_waiting()


async def _generate_live_packets(
        job_queue_item: JobQueueItem,
        update_prerequisites: List[AbsWaitEvent],
        logs_tracker: packets.LogMemorizer,
        packet_generator: packets.PacketBuilder
) -> typing.AsyncIterator[str]:
    while job_queue_item.state == schema.JobState.RUNNING:
        async with wait_for_first_prereq(update_prerequisites) as waiter:
            packet_values: packets.PacketDataStructure = {
                "currentTask": job_queue_item.status['current_task'],
                "progress": job_queue_item.status['progress'],
            }
            if logs := list(logs_tracker.pass_through(
                    job_queue_item.status.get('logs', []))
            ):
                packet_values["logs"] = logs
            packet_generator.add_items(**packet_values)

            packet = packet_generator.flush()
            if packet is not None:
                waiter.reset()
                yield packet


async def job_progress_packet_generator(
    job_queue_item: JobQueueItem, job_runner: JobRunner
) -> AsyncGenerator[str, str]:
    """Generate data packets about the progress of a job."""
    job_runner_waiter = AsyncEventNotifier()
    job_finished = AsyncEventNotifier()

    job_runner.add_async_watcher(job_runner_waiter)

    _packet_generator = packets.MemorizedPacketBuilder()
    with packets.log_de_dup() as logs_tracker:
        packet_values: packets.PacketDataStructure = {
            "job_id": job_queue_item.job_id,
            "job_parameters": job_queue_item.job["details"],
            "workflow": job_queue_item.job["workflow"],
            "job_status": job_queue_item.state,
            "currentTask": job_queue_item.status['current_task'],
            "progress": job_queue_item.status['progress'],
        }

        if job_queue_item.status['start_time']:
            packet_values['start_time'] = str(
                job_queue_item.status['start_time']
            )

        if logs := list(logs_tracker.pass_through(
                job_queue_item.status['logs'])
        ):
            packet_values["logs"] = logs

        _packet_generator.add_items(**packet_values)

        initial_packet = _packet_generator.flush()
        if initial_packet is not None:
            yield initial_packet

        while job_queue_item.state == schema.JobState.RUNNING:
            async for packet in _generate_live_packets(
                    job_queue_item,
                    update_prerequisites=[
                        WaitForAsyncEvent(
                            event_notifier=job_runner_waiter,
                            name="job_runner"
                        ),
                        WaitForAsyncEvent(
                            job_finished,
                            name="job_finished"
                        ),
                    ],
                    logs_tracker=logs_tracker,
                    packet_generator=_packet_generator
            ):
                yield packet

                if job_queue_item.state != schema.JobState.RUNNING:
                    await job_finished.notify()

        packet_values = {
            "currentTask": job_queue_item.status['current_task'],
            "progress": job_queue_item.status['progress'],
        }
        if logs := list(logs_tracker.pass_through(
                job_queue_item.status.get('logs', []))
        ):
            packet_values["logs"] = logs
        _packet_generator.add_items(**packet_values)
        if last_packet := _packet_generator.flush():
            yield last_packet

RetType = typing.TypeVar('RetType')  # pylint: disable=invalid-name


def only_new_data(
        func: typing.Callable[[], typing.AsyncIterator[RetType]]
) -> typing.Callable[[], typing.AsyncIterator[RetType]]:
    """Suppress data that tries to be sent twice."""
    @wraps(func)
    async def inner() -> typing.AsyncIterator[RetType]:
        last_value = None
        async for res in func():
            if last_value != res:
                yield res
                last_value = res

    return inner


def get_job_queue_data(
        job_manager: JobManager
) -> List[schema.APIJobQueueItem]:
    return [
        schema.APIJobQueueItem(
            job=item.job,
            state=item.state,
            order=item.order,
            job_id=item.job_id,
            progress=item.status['progress'],
            time_submitted=str(item.time_submitted),
        ).as_dict()
        for item in job_manager.job_queue()
    ]


async def stream_jobs(
        job_manager: JobManager,
        job_runner: JobRunner
) -> typing.AsyncIterator[List[schema.APIJobQueueItem]]:
    manager_waiter = AsyncEventNotifier()
    job_manager.add_async_watcher(manager_waiter)

    job_runner_waiter = AsyncEventNotifier()
    job_runner.add_async_watcher(job_runner_waiter)
    while True:
        async with wait_for_first_prereq(
            prerequisites=[
                SleepEvent(
                    time=MESSAGE_STREAM_DELAY, name="Timeout at 30 second"),
                WaitForAsyncEvent(
                    name="job_runner",
                    event_notifier=job_runner_waiter
                ),
                WaitForAsyncEvent(
                    name="manager_waiter",
                    event_notifier=manager_waiter
                )
            ]
        ) as waiter:
            packet = get_job_queue_data(job_manager)
            waiter.cancel_waiting()
            yield packet
            waiter.reset()

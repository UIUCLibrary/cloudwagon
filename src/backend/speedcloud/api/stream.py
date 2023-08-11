from functools import wraps
from typing import AsyncGenerator, List, Any, Coroutine
import contextlib
import asyncio

from speedcloud.job_manager import (
    AsyncEventNotifier,
    JobQueueItem,
    JobRunner,
    JobManager,
)

from . import packets
from . import schema

__all__ = [
    "job_progress_packet_generator",
    "only_new_data",
    "wait_for_first_prereq",
]
MESSAGE_STREAM_DELAY = 30


class TaskWaiter:

    def __init__(self, prerequisites: List[Coroutine[Any, Any, None]]) -> None:

        self.tasks: List[asyncio.Task] = [
            asyncio.create_task(task, name=str(task)) for task in prerequisites
        ]

    async def wait_for_first(self):
        await asyncio.wait(self.tasks, return_when=asyncio.FIRST_COMPLETED)
        self.reset()

    def reset(self):
        for task in self.tasks:
            if not task.done():
                task.cancel()


@contextlib.asynccontextmanager
async def wait_for_first_prereq(
    prerequisites: List[Coroutine[Any, Any, None]]
):
    waiter = TaskWaiter(prerequisites)
    yield waiter
    await waiter.wait_for_first()
    waiter.reset()


def consolidate_logs(logs, tracker):
    return [
        log.as_dict()
        for log in tracker.pass_through(logs)
    ]


async def _generate_live_packets(
        job_queue_item,
        update_prerequisites,
        logs_tracker,
        packet_generator
):
    while job_queue_item.state == schema.JobState.RUNNING:
        async with wait_for_first_prereq(
                [waiter.wait_for_update() for waiter in update_prerequisites]
        ) as waiter:
            packet_values = {
                "currentTask": job_queue_item.status.current_task,
                "progress": job_queue_item.status.progress,
            }
            if logs := consolidate_logs(
                    job_queue_item.status.logs,
                    logs_tracker
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
    job_runner_waiter = AsyncEventNotifier()
    job_finished = AsyncEventNotifier()

    job_runner.add_async_watcher(job_runner_waiter)

    _packet_generator = packets.MemorizedPacketBuilder()
    with packets.log_de_dup() as logs_tracker:
        packet_values: packets.PacketDataType = {
            "job_id": job_queue_item.job_id,
            "job_parameters": job_queue_item.job["details"],
            "workflow": job_queue_item.job["workflow"],
            "start_time": str(job_queue_item.status.start_time),
            "job_status": job_queue_item.state,
            "currentTask": job_queue_item.status.current_task,
            "progress": job_queue_item.status.progress,
        }
        if logs := consolidate_logs(job_queue_item.status.logs, logs_tracker):
            packet_values["logs"] = logs

        _packet_generator.add_items(**packet_values)

        initial_packet = _packet_generator.flush()
        if initial_packet is not None:
            yield initial_packet
        while job_queue_item.state == schema.JobState.RUNNING:
            async for packet in _generate_live_packets(
                    job_queue_item,
                    update_prerequisites=[
                        job_runner_waiter,
                        job_finished,
                    ],
                    logs_tracker=logs_tracker,
                    packet_generator=_packet_generator
            ):
                yield packet
                if job_queue_item.state != schema.JobState.RUNNING:
                    await job_finished.notify()

        packet_values = {
            "currentTask": job_queue_item.status.current_task,
            "progress": job_queue_item.status.progress,
        }
        if logs := consolidate_logs(job_queue_item.status.logs, logs_tracker):
            packet_values["logs"] = logs
        _packet_generator.add_items(**packet_values)
        if last_packet := _packet_generator.flush():
            yield last_packet


def only_new_data(func):
    @wraps(func)
    async def inner():
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
            job=dict(item.job),
            state=item.state,
            order=item.order,
            job_id=item.job_id,
            progress=item.status.progress,
            time_submitted=str(item.time_submitted),
        ).as_dict()
        for item in job_manager.job_queue()
    ]


async def stream_jobs(job_manager: JobManager, job_runner: JobRunner):
    manager_waiter = AsyncEventNotifier()
    job_manager.add_async_watcher(manager_waiter)

    job_runner_waiter = AsyncEventNotifier()
    job_runner.add_async_watcher(job_runner_waiter)
    while True:
        async with wait_for_first_prereq(
            prerequisites=[
                job_runner_waiter.wait_for_update(),
                manager_waiter.wait_for_update(),
                asyncio.sleep(MESSAGE_STREAM_DELAY),
            ]
        ) as waiter:
            packet = get_job_queue_data(job_manager)
            waiter.reset()
            yield packet

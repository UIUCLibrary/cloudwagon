"""job manager."""

from __future__ import annotations

import abc
import asyncio
import logging
import time
from typing import Dict, Any, List
from collections.abc import AsyncIterable
import uuid
import speedwagon
from . import runner
from .api import actions, schema

__all__ = ['JobManager', 'JobRunner']

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


jobs: Dict[int, Any] = {}


async def fake_data_streamer() -> AsyncIterable[
    Dict[str, Any]
]:  # pragma: no cover

    workflows = speedwagon.available_workflows()
    workflow = workflows['Verify HathiTrust Package Completeness']
    options = {
                "Source": "/Users/hborcher/sample data/Brittle Books - Good/",
                "Check for page_data in meta.yml": True,
                "Check ALTO OCR xml files": True,
                "Check OCR xml files are utf-8": True
            }
    total_packets = 0
    yield {
        "order": total_packets,
        'log': 'starting',
        'progress': 0,
    }
    total_packets += 1
    job_runner = runner.JobRunner()
    async for packet in job_runner.iter_job(workflow(), options):
        data = {}
        print(packet)
        if packet.task:
            data['packet'] = packet.task
        if packet.progress:
            data['progress'] = str(packet.progress)
        if packet.log:
            data['log'] = packet.log
        yield {
            **data,
            # **packet,
            **{
                "order": total_packets
            }
        }
        total_packets += 1


def _fixup_props(props, workflow: actions.WorkflowValues):
    parameters = workflow['parameters']
    new_props = props.copy()
    for param in parameters:
        if param['widget_type'] == 'BooleanSelect':
            property_key = param['label']
            og_value = props[property_key]

            new_value = \
                {
                    'true': True,
                    'True': True,
                    'false': False,
                    'False': False,
                }.get(og_value)
            if new_value is None:
                new_value = og_value
            new_props[property_key] = new_value
    return new_props


def create_job(workflow_id: int, props, netloc: str):
    job_id = len(jobs)
    # This is a dummy data and will be removed.
    job = {
        "status": fake_data_streamer,
        "metadata": {
            "id": job_id,
            "workflow_id": workflow_id,
            "properties": _fixup_props(
                props,
                actions.get_workflow_by_id(workflow_id)
            ),
            'consoleStreamWS':
                f"ws://{netloc}/stream?job_id={job_id}",
            'consoleStreamSSE':
                f"http://{netloc}/stream?job_id={job_id}",  # NOSONAR
        }
    }
    jobs[job_id] = job
    return job['metadata']


class AbsJobContainer(abc.ABC):
    @abc.abstractmethod
    def job_queue(self) -> List[schema.JobQueueItem]:
        pass

    @abc.abstractmethod
    def add(self, item: schema.JobQueueItem) -> None:
        pass

    @abc.abstractmethod
    def __len__(self) -> int:
        pass


class JobContainer(AbsJobContainer):

    def __init__(self) -> None:
        self._job_queue: List[schema.JobQueueItem] = []

    def __len__(self) -> int:
        return len(self._job_queue)

    def job_queue(self) -> List[schema.JobQueueItem]:
        return self._job_queue

    def add(self, item: schema.JobQueueItem) -> None:
        self._job_queue.append(item)

    def __iter__(self):
        return self

    def __next__(self) -> schema.JobQueueItem:
        for job in self._job_queue:
            if job.state == schema.JobState.QUEUED:
                return job
        raise StopIteration


class JobManager:
    """JobManager.

    Manages the jobs given.
    """

    def __init__(self, queue: asyncio.Queue) -> None:
        """Create a job manager.

        Args:
            queue: job queue be used to send to a worker.
        """
        self.stop = asyncio.Event()
        self._new_item_added = asyncio.Event()
        self._container = JobContainer()
        self._job_queue = queue

    async def produce(self):
        """Add jobs into a queue to be picked up by the workers."""
        while True:
            logger.info("Checking job queue")
            try:
                value = next(self._container)
                await self._job_queue.put(value)
            except StopIteration:

                if not self.stop.is_set():
                    try:
                        tasks = [
                            asyncio.create_task(self._new_item_added.wait()),
                            asyncio.create_task(asyncio.sleep(10)),
                            asyncio.create_task(self.stop.wait()),

                        ]
                        await asyncio.wait(
                            tasks,
                            return_when=asyncio.FIRST_COMPLETED
                        )
                        for task in tasks:
                            if not task.done():
                                task.cancel()

                        self._new_item_added.clear()
                    except TimeoutError:
                        continue
                    continue
                break

    def generate_job_id(self) -> str:
        """Generate a unique id for a job."""
        return str(uuid.uuid4())

    async def get_job_queue_item(self, job_id: str) -> schema.JobQueueItem:
        """Get item in the queue based on the job id."""
        for job_queue_item in self._container.job_queue():
            if job_queue_item.job_id == job_id:
                return job_queue_item
        raise ValueError(f"No job found with id {job_id}")

    def job_queue(self):
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

    async def add_job(self, job: schema.Job):
        """Add job to queue."""
        new_queued_item = schema.JobQueueItem(
            job=job,
            state=schema.JobState.QUEUED,
            order=len(self._container),
            job_id=self.generate_job_id()
        )
        self._container.add(new_queued_item)
        self._new_item_added.set()
        return new_queued_item

    async def set_job_state(self, job_id, state: schema.JobState):
        """Set the state of a job."""
        item = await self.get_job_queue_item(job_id)
        item.state = state


class JobRunner:
    """JobRunner.

    Designed to consume any jobs in a queue.
    """
    def __init__(self, queue: asyncio.Queue):
        """Create a job runner.

        Args:
            queue: job queue for pull jobs off to run.
        """
        self._queue = queue

    async def consume(self):
        """Consume jobs in the job queue.

        This should be run as a task and canceled when done otherwise it will
         run forever.
        """
        while True:
            job: schema.JobQueueItem = await self._queue.get()
            job.state = schema.JobState.RUNNING
            await asyncio.to_thread(self.run_job)
            job.state = schema.JobState.SUCCESS
            self._queue.task_done()
            logger.info("Job %s done", job.job_id)

    def run_job(self):
        """Execute job."""
        time.sleep(3)

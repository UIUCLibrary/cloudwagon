"""App."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from speedcloud.config import get_settings, initialize_app_from_settings
from speedcloud.api import api
from speedcloud.exceptions import SpeedCloudException, JobAlreadyAborted
from speedcloud.job_manager import JobRunner, JobManager, JobQueueItem
from speedcloud.workflow_manager import (
    WorkflowManagerIdBaseOnSize,
    AbsWorkflowManager
)
import speedwagon
origins = [
    "*"
    # "http://localhost:3000",
    # "localhost:3000"
]

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def start_workflow_manager(settings) -> AbsWorkflowManager:
    """Start workflow manager."""
    manager = WorkflowManagerIdBaseOnSize()
    white_listed_workflows = settings.whitelisted_workflows
    for workflow in speedwagon.available_workflows().values():
        if white_listed_workflows is not None:
            if workflow.name not in white_listed_workflows:
                continue
        logging.info("loading %s", workflow.name)
        manager.add_workflow(workflow)
    logging.info("Workflow Manager started")
    return manager


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Set up background managers."""
    settings = get_settings()
    initialize_app_from_settings(settings)

    workflow_manager = start_workflow_manager(settings)

    job_queue: asyncio.Queue[JobQueueItem] = asyncio.Queue(maxsize=1)
    job_manager = JobManager(job_queue)
    job_manager_task =\
        asyncio.create_task(job_manager.produce(), name="producer")

    logging.info("job manager started")

    job_runner = JobRunner(job_queue, settings.storage, workflow_manager)
    job_runner_task =\
        asyncio.create_task(job_runner.consume(), name="consumer")

    job_manager_task_future = asyncio.gather(job_manager_task)
    logger.info("job runner started")

    yield {
        "job_manager": job_manager,
        "job_runner": job_runner,
        "workflow_manager": workflow_manager
    }
    logger.info("shutting down")
    job_manager.stop.set()
    job_runner_task.done()
    job_manager_task.done()
    await job_manager_task_future
    logger.debug("All job tasks have stopped")

    await job_queue.join()
    if await job_manager.has_unfinished_tasks():
        logging.warning("Job manager closed with unfinished tasks")

app = FastAPI(docs_url="/", lifespan=lifespan)


def handle_already_aborted_exception(
        _: Request,
        ext: JobAlreadyAborted
) -> Response:
    """Handle for JobAlreadyAborted exceptions."""
    return JSONResponse(
        status_code=400,
        content={
            "message":
                f"Job already aborted: {ext.job_id}"
        }
    )


def handle_cloudwagon_exceptions(
        _: Request,
        ext: SpeedCloudException
) -> Response:
    """Handle cloudwagon exceptions with a 400 error."""
    return JSONResponse(
        status_code=400,
        content={
            "message":
                f"Hit an exception: {str(ext.__class__.__name__)}: {str(ext)}"
        }
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api)


app.add_exception_handler(
    SpeedCloudException, handler=handle_cloudwagon_exceptions,
)

app.add_exception_handler(
    JobAlreadyAborted, handler=handle_already_aborted_exception
)

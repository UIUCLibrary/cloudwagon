"""App."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from speedcloud.api import api, schema
from speedcloud.exceptions import CloudWagonException
from speedcloud.job_manager import JobRunner, JobManager

origins = [
    "*"
    # "http://localhost:3000",
    # "localhost:3000"
]

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Set up background managers."""
    logging.info("Starting job manager")
    queue: asyncio.Queue[schema.JobQueueItem] = asyncio.Queue(maxsize=1)
    job_manager = JobManager(queue)
    job_manager_task = asyncio.create_task(job_manager.produce())
    job_runner = JobRunner(queue)
    job_runner_task = asyncio.create_task(job_runner.consume())
    logger.info("job runner started")
    job_manager_task_future = asyncio.gather(job_manager_task)

    yield {
        "job_manager": job_manager,
        "job_runner": job_runner
    }
    logger.info("shutting down")
    job_manager.stop.set()
    job_runner_task.done()
    job_manager_task.done()
    await job_manager_task_future
    logger.debug("All job tasks have stopped")

    await queue.join()
    if await job_manager.has_unfinished_tasks():
        logging.warning("Job manager closed with unfinished tasks")

app = FastAPI(docs_url="/", lifespan=lifespan)


def handle_cloudwagon_exceptions(_: Request, ext: CloudWagonException):
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
    CloudWagonException, handler=handle_cloudwagon_exceptions
)

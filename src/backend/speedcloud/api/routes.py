"""Api routes."""

from __future__ import annotations

from typing import List, Optional, Dict, Any, TYPE_CHECKING
import json
import os
from importlib.metadata import version
from fastapi import APIRouter, UploadFile, Depends, Request
from fastapi.encoders import jsonable_encoder
from fastapi import HTTPException
from sse_starlette.sse import EventSourceResponse
import aiofiles

import speedcloud.job_manager
from speedcloud.workflow_manager import WorkflowData
from speedcloud.exceptions import SpeedCloudException
from speedcloud.config import Settings, get_settings
from speedcloud.info import get_version

from . import schema
from . import storage
from . import stream

if TYPE_CHECKING:
    from speedcloud.job_manager import JobManager, JobRunner
    from speedcloud.workflow_manager import AbsWorkflowManager

__all__ = ['api']

api = APIRouter(
    responses={404: {"description": "Not found"}},
)


class InvalidNamingException(SpeedCloudException):
    pass


@api.get("/files/exists")
async def filesystem_entry_exists(
        request: Request,
        settings: Settings = Depends(get_settings)
):
    params = request.query_params
    path = os.path.normpath(params['path'])
    if not path:
        return {
            "path": path,
            "exists": False
        }

    storage_path = os.path.normpath(f'{settings.storage}{path}')
    value = {
        "path": path,
        "exists": os.path.exists(storage_path)
    }
    return value


@api.get("/files/contents")
async def list_data(
        request: Request,
        settings: Settings = Depends(get_settings)
):
    params = request.query_params
    path = os.path.normpath(params.get('path', default='/'))
    # This fixes if the first item is a slash
    if path.startswith(os.sep):
        search_path = path[1:]
    else:
        search_path = path
    if not storage.is_within_valid_directory(
            settings.storage,
            os.path.join(settings.storage, search_path)
    ):
        raise HTTPException(404)
    storage_path = os.path.join(settings.storage, search_path)
    try:
        contents = \
            storage.get_path_contents(
                storage_path,
                starting=settings.storage
            )
    except FileNotFoundError as missing_path_error:
        raise HTTPException(400) from missing_path_error

    return {
        "path": path,
        "contents": contents
    }


@api.post("/files")
async def upload_file(
        request: Request, files: List[UploadFile],
        settings: Settings = Depends(get_settings)
):
    params = request.query_params
    path = params.get('path', default='/')
    if path is None:
        raise HTTPException(
            status_code=400,
            detail="Missing required path query"
        )
    # This fixes if the first item is a slash
    search_path: str
    if path.startswith(os.sep):
        search_path = path[1:]
    else:
        search_path = path
    if not storage.is_within_valid_directory(
            settings.storage,
            os.path.join(settings.storage, search_path)
    ):
        raise HTTPException(404)
    files_uploaded = []
    # TODO: upload to the directory specified in path query params
    for file in files:
        if file.filename == '':
            continue
        if path.startswith(os.sep):
            subdir = path[1:]
        else:
            subdir = path
        if not file.filename:
            raise ValueError("required field missing: filename")
        out_path = os.path.join(settings.storage, subdir, file.filename)
        async with aiofiles.open(out_path, 'wb') as out_file:
            content = await file.read()  # async read
            await out_file.write(content)  # async write
            files_uploaded.append(file.filename)

    return {
        "response": "ok",
        "filename": files_uploaded
    }


@api.post("/files/directory")
async def new_directory(
        item: schema.NewDirectory,
        settings: Settings = Depends(get_settings)
):
    if item.path.startswith(os.sep):
        backend_path = item.path[1:]
    else:
        backend_path = item.path
    if "." in item.name:
        raise InvalidNamingException('invalid file name')
    storage.create_directory(
        os.path.join(settings.storage, backend_path),
        item.name
    )
    return {
        "name": item.name,
        "location": item.path,
        "path": os.path.join(item.path, item.name)
    }


@api.delete("/files/directory")
async def remove_directory(
        item: schema.RemoveDirectory,
        settings: Settings = Depends(get_settings)
):
    if item.path.startswith(os.sep):
        backend_path = item.path[1:]
    else:
        backend_path = item.path
    try:
        storage.remove_path_from_storage(
            os.path.join(settings.storage, backend_path)
        )
    except FileNotFoundError as error:
        raise SpeedCloudException from error
    return {
        "path": item.path,
        "response": "success"
    }


@api.delete("/files")
async def clear_files(settings: Settings = Depends(get_settings)):
    """Clear files."""
    files_removed = storage.clear_files(settings.storage)
    return {
        "files_removed": files_removed,
        "response": "ok"
    }


@api.get("/list_workflows")
async def speedwagon_workflows(
        request: Request
) -> Dict[str, List[speedcloud.workflow_manager.WorkflowData]]:
    workflow_manager: AbsWorkflowManager = request.state.workflow_manager
    return {
        "workflows": [
            WorkflowData(
                id=key,
                name=value.name if value.name is not None else value.__name__
            )
            for key, value in workflow_manager.get_workflows().items()
        ]
    }


@api.get("/workflow")
async def get_workflow(
        request: Request,
        name: Optional[str] = None
) -> Dict[str, Any]:
    workflow_manager: AbsWorkflowManager = request.state.workflow_manager
    if name:
        return {
            "workflow": workflow_manager.get_workflow_info_by_name(name)
        }
    return {}


@api.post('/submitJob')
async def submit_job(job: schema.Job, request: Request):
    job_manager: JobManager = request.state.job_manager
    workflow_manager: AbsWorkflowManager = request.state.workflow_manager
    workflow_values = workflow_manager.get_workflow_info_by_id(job.workflow_id)
    new_job_item = await job_manager.add_job(
        WorkflowData(job.workflow_id, workflow_values['name']),
        job.details
    )
    job_id = new_job_item.job_id
    return {
        "status": new_job_item.state,
        "metadata": {
            "id": job_id,
            "workflow_id": job.workflow_id,
            "properties": job.details,
        }
    }


@api.get('/info')
async def info(request: Request) -> Dict[str, Any]:
    """Get info."""
    speedwagon_version = version('speedwagon')
    workflow_manager: AbsWorkflowManager = request.state.workflow_manager
    return {
        "web_version": get_version(),
        "speedwagon_version": speedwagon_version,
        "workflows": [
            {'name': workflow.name, "id": workflow_id}
            for workflow_id, workflow in
            workflow_manager.get_workflows().items()
        ]
    }


@api.get('/jobInfo', description="Get the status of a single job")
def get_job_status(request: Request, job_id: str) -> schema.JobInfo:
    job_manager: JobManager = request.state.job_manager
    job = job_manager.get_job_queue_item(job_id)

    return schema.JobInfo(
        job_id=job.job_id,
        job_parameters=job.job['details'],
        workflow=job.job['workflow'],
        start_time=str(job.status['start_time']),
        job_status=job.state.value,
    )


@api.get('/jobLogs', description="Get the logs of a single job")
def get_job_logs(request: Request, job_id: str) -> List[schema.LogData]:
    job_manager: JobManager = request.state.job_manager
    job = job_manager.get_job_queue_item(job_id)

    return [
        schema.LogData(**log_entry)
        for log_entry in job.status.get('logs', [])
    ]


@api.get('/jobAbort', description="Abort running job")
async def abort_job(request: Request, job_id: str):
    job_manager: JobManager = request.state.job_manager
    job_runner: JobRunner = request.state.job_runner
    job_manager.set_job_state(job_id, schema.JobState.STOPPING)
    job_runner.abort(job_id)
    return jsonable_encoder({
        "job_id": job_id,
        "status": job_manager.get_job_queue_item(job_id).state.value
    })


@api.get('/followJobStatus')
async def follow_job_sse(request: Request, job_id: str) -> EventSourceResponse:

    @stream.only_new_data
    async def generator_event():
        job_manager: JobManager = request.state.job_manager
        job_queue_item = job_manager.get_job_queue_item(job_id)
        job_runner: JobRunner = request.state.job_runner
        async for packet in stream.job_progress_packet_generator(
                job_queue_item,
                job_runner
        ):
            yield packet
    return EventSourceResponse(generator_event())


@api.get('/jobsSSE')
async def jobs_sse(request: Request) -> EventSourceResponse:

    @stream.only_new_data
    async def generator_event():

        job_runner: JobRunner = request.state.job_runner
        job_manager: JobManager = request.state.job_manager

        async for packet in stream.stream_jobs(job_manager, job_runner):
            yield json.dumps(packet)

    return EventSourceResponse(generator_event())


@api.get('/jobs')
async def jobs(request: Request) -> List[schema.APIJobQueueItem]:
    job_manager: JobManager = request.state.job_manager
    res = []
    for item in job_manager.job_queue():
        res.append(
            schema.APIJobQueueItem(
                job=item.job,
                state=item.state,
                order=item.order,
                job_id=item.job_id,
                progress=item.status['progress'],
                time_submitted=str(item.time_submitted),



            )
        )
    return res

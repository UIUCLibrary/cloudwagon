import asyncio
import typing
from typing import List, Optional
import json
import os
import pkg_resources
from fastapi import APIRouter, UploadFile, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi import WebSocket, HTTPException
from sse_starlette.sse import EventSourceResponse

from pydantic import BaseModel

import aiofiles

from ..config import Settings, get_settings
from ..info import get_version
from ..exceptions import CloudWagonException
from . import actions
from . import storage
from . import job_manager
api = APIRouter(
    # prefix="/api",
    responses={404: {"description": "Not found"}},
)


class InvalidNamingException(CloudWagonException):
    pass


@api.get("/files/exists")
async def filesystem_entry_exists(
        request: Request,
        settings: Settings = Depends(get_settings)
):
    params = request.query_params
    path = os.path.normpath(params.get('path'))
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
    contents = \
        storage.get_path_contents(
            storage_path,
            starting=settings.storage
        )

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
        out_path = os.path.join(settings.storage, subdir, file.filename)
        async with aiofiles.open(out_path, 'wb') as out_file:
            content = await file.read()  # async read
            await out_file.write(content)  # async write
            files_uploaded.append(file.filename)

    return {
        "response": "ok",
        "filename": files_uploaded
    }


class NewDirectory(BaseModel):
    path: str
    name: str


@api.post("/files/directory")
async def new_directory(
        item: NewDirectory,
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


class RemoveDirectory(BaseModel):
    path: str


@api.delete("/files/directory")
async def remove_directory(
        item: RemoveDirectory,
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
    except FileNotFoundError as e:
        raise CloudWagonException from e
    return {
        "path": item.path,
        "response": "success"
    }


@api.delete("/files")
async def clear_files(settings: Settings = Depends(get_settings)):
    files_removed = storage.clear_files(settings.storage)
    return {
        "files_removed": files_removed,
        "response": "ok"
    }


@api.get("/list_workflows")
async def speedwagon_workflows():
    return {
        "workflows": actions.get_workflows()
    }


@api.get("/workflow")
async def get_workflow(name: Optional[str] = None):
    print(name)
    if name:
        return {
            "workflow": actions.get_workflow_by_name(name)
        }
    return {}


class Job(BaseModel):
    details: typing.Dict[str, typing.Any]
    workflow_id: int


@api.post('/submitJob')
async def submit_job(job: Job, request: Request):
    return job_manager.create_job(
        job.workflow_id,
        job.details,
        netloc=request.url.netloc
    )


class StreamBuilder:
    def __init__(self):
        self.job_id: Optional[int] = None
        self._job = None

    def set_job_id(self, job_id):
        self.job_id = job_id

    def build(self):
        job = job_manager.jobs.get(self.job_id)
        return StreamingResponse(job['status']())


async def get_console_stream(job_id: int):
    builder = StreamBuilder()
    builder.set_job_id(job_id)
    return builder.build()


@api.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket, job_id: int):
    print(job_id)
    await websocket.accept()
    async for payload in job_manager.fake_data_streamer():
        print(payload)

        response, task = await asyncio.gather(
            asyncio.create_task(websocket.receive()),
            asyncio.create_task(websocket.send_json(json.dumps(payload)))
        )
        if task_name := payload.get('task'):
            if task_name == "Aborted":
                await websocket.close()
                print("ABORTED")
                break
        if x := response.get('text'):
            if x == "abort":
                await websocket.send_json(
                    json.dumps({
                        "log": "aborted",
                        "progress": 0.0,
                    })
                )
                await websocket.close()
                break

    print("all done")
    # await websocket.close()
    # print("Closed")
    # await websocket.send_text('done')


async def stream_job(request):
    async for payload in job_manager.fake_data_streamer():
        if await request.is_disconnected():
            print("client disconnected!!!")
        yield json.dumps(payload)
    yield "done"
    await request.close()


@api.get("/stream")
async def system_event_endpoint(request: Request, job_id: int):
    return EventSourceResponse(stream_job(request))


@api.get('/info')
async def info():
    """Get info."""
    speedwagon_version = pkg_resources.get_distribution('speedwagon').version
    return {
        "web_version": get_version(),
        "speedwagon_version": speedwagon_version,
        "workflows": actions.get_workflows()
    }

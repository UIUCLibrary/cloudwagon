import asyncio
import random
import time
import typing
from typing import List, Optional, Union
import json
from fastapi import APIRouter, UploadFile, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse
from fastapi import WebSocket, HTTPException
from sse_starlette.sse import EventSourceResponse

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

import os
import aiofiles
from starlette.middleware.cors import CORSMiddleware

from ..config import Settings, get_settings
from . import actions
from . import storage
from . import job_manager
api = APIRouter(
    prefix="/api",
    responses={404: {"description": "Not found"}},
)


@api.get("/files")
async def list_data(request: Request, settings: Settings = Depends(get_settings)):
    params = request.query_params
    path = params.get('path')
    if path is None:
        raise HTTPException(
            status_code=400,
            detail="Missing required path query"
        )
    return {
        "path": path,
        "files": storage.list_files(settings.storage)
    }


@api.post("/files")
async def upload_file(files: List[UploadFile], settings: Settings = Depends(get_settings)):
    files_uploaded = []
    for file in files:
        if file.filename == '':
            continue

        out_path = os.path.join(settings.storage, file.filename)
        async with aiofiles.open(out_path, 'wb') as out_file:
            content = await file.read()  # async read
            await out_file.write(content)  # async write
            files_uploaded.append(file.filename)

    return {
        "response": "ok",
        "filename": files_uploaded
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
async def submit_job(job: Job):
    return job_manager.create_job(job.workflow_id, job.details)


class StreamBuilder:
    def __init__(self):
        self.job_id: Optional[int] = None
        self._job = None

    def set_job_id(self, job_id):
        self.job_id = job_id

    def build(self):
        job = job_manager.jobs.get(self.job_id)
        return StreamingResponse(job['status']())

#
# @api.get('/stream')
async def get_console_stream(job_id: int):
    builder = StreamBuilder()
    builder.set_job_id(job_id)
    return builder.build()

# @api.get("/stream")
# async def websocket_endpoint(request: Request, job_id: int):
#     print(job_id)
#     return EventSourceResponse(job_manager.fake_data_streamer())
#

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


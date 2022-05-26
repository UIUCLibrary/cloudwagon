
from typing import List, Optional

from fastapi import APIRouter, UploadFile, Depends
import os
import aiofiles
from ..config import Settings, get_settings
from . import actions
from . import storage

api = APIRouter(
    prefix="/api",
    responses={404: {"description": "Not found"}},
)


@api.get("/files")
async def list_data(settings: Settings = Depends(get_settings)):
    return {
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
async def get_workflow(name: Optional[str] =None):
    print(name)
    if name:
        return {
            "workflow": actions.get_workflow_by_name(name)
        }
    return {}
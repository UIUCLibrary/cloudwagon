"""schema.

Contains common data structures used throughout the application.
"""
import typing
import enum

from pydantic import BaseModel

__all__ = [
    "JobQueueItem",
    "JobState",
    "RemoveDirectory",
    "Job",
    "NewDirectory",
]


# pylint: disable=R0903

class NewDirectory(BaseModel):
    """NewDirectory request."""
    path: str
    name: str


class Job(BaseModel):
    """Job."""
    details: typing.Dict[str, typing.Any]
    workflow_id: int


class RemoveDirectory(BaseModel):
    """Remove directory request."""
    path: str


class JobState(str, enum.Enum):
    """State of a job."""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class JobQueueItem(BaseModel):
    """Job queue item."""
    job: Job
    state: JobState
    order: int
    job_id: str

"""schema.

Contains common data structures used throughout the application.
"""
import json
import typing
import enum
from pydantic import BaseModel

try:
    from typing_extensions import TypedDict
except ImportError:  # pragma: no cover
    from typing import TypedDict

from speedwagon.workflow import UserDataType

__all__ = [
    "APIJobQueueItem",
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

    details: typing.Dict[str, UserDataType]
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
    ABORTED = "aborted"
    STOPPING = "stopping"


class JobWorkflow(TypedDict):
    id: int
    name: str


class JobQueueJobDetails(TypedDict):
    details: typing.Dict[str, typing.Any]
    workflow: JobWorkflow


class APIJobQueueItem(BaseModel):
    """Job queue item."""

    job: JobQueueJobDetails
    state: JobState
    order: int
    job_id: str
    progress: typing.Optional[float]
    time_submitted: str

    def as_dict(self):
        """Generate data as a dict."""
        return {
            "job": dict(self.job),
            "state": self.state,
            "order": self.order,
            "job_id": self.job_id,
            "progress": self.progress,
            "time_submitted": str(self.time_submitted)
        }

    def serialize(self) -> str:
        """Serialize data as a string."""
        return json.dumps(self.as_dict())


class LogData(BaseModel):
    msg: str
    time: float


class JobInfo(BaseModel):
    job_id: str
    job_parameters: typing.Dict[str, typing.Any]
    workflow: JobWorkflow
    start_time: str
    job_status: str

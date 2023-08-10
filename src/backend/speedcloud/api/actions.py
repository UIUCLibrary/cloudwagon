"""Actions."""

from typing import List, TypedDict
from dataclasses import dataclass

import speedwagon

__all__ = [
    "WorkflowData",
    "get_workflows",
    "WorkflowValues",
    "get_workflow_by_id",
    "get_workflow_by_name",
]


@dataclass
class WorkflowData:
    """Workflow Data."""
    id: int  # pylint: disable=C0103
    name: str


_workflows: List[WorkflowData] = []


def get_workflows() -> List[WorkflowData]:
    """Get all workflows.

    Pending removal.
    """
    global _workflows
    if len(_workflows) == 0:
        for i, k in enumerate(speedwagon.available_workflows().keys()):
            _workflows.append(WorkflowData(id=i, name=k))
    return _workflows


class WorkflowParam(TypedDict):
    """Workflow setting parameters."""
    widget_type: str
    label: str
    required: bool


class WorkflowValues(TypedDict):
    """Workflow values."""
    name: str
    description: str
    parameters: List[WorkflowParam]


def get_workflow_by_id(workflow_id: int) -> WorkflowValues:
    """Locate workflow by workflow id."""
    for workflow in get_workflows():
        if workflow.id == workflow_id:
            return get_workflow_by_name(workflow.name)
    raise ValueError(f"Unknown workflow id {workflow_id}")


def get_workflow_by_name(name: str) -> WorkflowValues:
    """Locate workflow by workflow name."""
    workflows = speedwagon.available_workflows()
    if result := workflows.get(name):
        workflow = result()
        user_options = workflow.job_options()
        parameters = [o.serialize() for o in user_options]
        for parameter in parameters:
            if "required" not in parameter:
                parameter["required"] = True
        return {
            "name": workflow.name,
            "description": workflow.description,
            "parameters": parameters,
        }

    raise ValueError(f"Unknown workflow {name}")

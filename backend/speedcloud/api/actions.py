from typing import List, Optional, Type
from dataclasses import dataclass

import speedwagon


@dataclass
class WorkflowData:
    id: int
    name: str


_workflows: List[WorkflowData] = []


def get_workflows() -> List[WorkflowData]:
    global _workflows
    if len(_workflows) == 0:
        for i, k in enumerate(speedwagon.available_workflows().keys()):
            _workflows.append(WorkflowData(id=i, name=k))
    return _workflows


def get_workflow_by_id(workflow_id: int):
    for workflow in get_workflows():
        if workflow.id == workflow_id:
            return get_workflow_by_name(workflow.name)
    raise ValueError(f"Unknown workflow id {workflow_id}")


def get_workflow_by_name(name):
    workflows = speedwagon.available_workflows()
    result: Optional[Type[speedwagon.Workflow]] = workflows.get(name)
    print(result)
    if result:
        workflow = result()
        user_options = workflow.get_user_options()
        return {
            "name": workflow.name,
            "description": workflow.description,
            "parameters": [o.serialize() for o in user_options]
        }
    raise ValueError(f"Unknown workflow {name}")

from typing import List
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
    if result := workflows.get(name):
        workflow = result()
        user_options = workflow.get_user_options()
        parameters = [o.serialize() for o in user_options]
        # TODO: remove this when get_user_options actually supposed required
        for parameter in parameters:
            if 'required' not in parameter:
                parameter['required'] = True
        return {
            "name": workflow.name,
            "description": workflow.description,
            "parameters": parameters,

        }
    raise ValueError(f"Unknown workflow {name}")

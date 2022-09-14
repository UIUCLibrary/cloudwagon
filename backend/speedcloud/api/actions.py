from typing import List, Optional, Type
import speedwagon


def get_workflows() -> List[str]:
    return list(speedwagon.available_workflows().keys())


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

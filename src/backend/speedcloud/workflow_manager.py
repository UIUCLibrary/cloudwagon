import abc
from abc import ABC
from typing import (
    List,
    TypedDict,
    Type,
    Dict,
    TypeVar,
    Generic,
    Hashable,
)
try:
    from typing import NotRequired
except ImportError:
    from typing_extensions import NotRequired

from dataclasses import dataclass
import speedwagon

WorkflowIdType = TypeVar("WorkflowIdType", bound=Hashable)


@dataclass
class WorkflowData:
    """Workflow Data."""

    id: int  # pylint: disable=C0103
    name: str

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }


class WorkflowParam(TypedDict):
    """Workflow setting parameters."""

    widget_type: str
    label: str
    required: bool
    selections: NotRequired[List[str]]


class WorkflowValues(TypedDict):
    """Workflow values."""

    name: str
    description: str
    parameters: List[WorkflowParam]


class AbsWorkflowIdGenerator(abc.ABC, Generic[WorkflowIdType]):
    @abc.abstractmethod
    def generate_new_workflow_id(
        self, workflow: Type[speedwagon.Workflow]
    ) -> WorkflowIdType:
        """Generate new id to use for workflow"""


class AbsGenericWorkflowManager(abc.ABC, Generic[WorkflowIdType]):
    @abc.abstractmethod
    def generate_new_workflow_id(
        self, workflow: Type[speedwagon.Workflow]
    ) -> WorkflowIdType:
        """Generate new id to use for workflow"""

    @abc.abstractmethod
    def get_workflow_type_by_id(
        self, workflow_id: WorkflowIdType
    ) -> Type[speedwagon.Workflow]:
        """Get workflow using id type"""


class AbsWorkflowManager(AbsGenericWorkflowManager[WorkflowIdType], ABC):
    def __init__(self) -> None:
        self.workflows: Dict[WorkflowIdType, Type[speedwagon.Workflow]] = {}

    def add_workflow(
        self, workflow: Type[speedwagon.Workflow]
    ) -> WorkflowIdType:
        workflow_id = self.generate_new_workflow_id(workflow)
        self.workflows[workflow_id] = workflow
        return workflow_id

    def get_workflows(self) -> Dict[WorkflowIdType, Type[speedwagon.Workflow]]:
        """Get all workflows loaded."""
        return self.workflows

    def get_workflow_info_by_id(
        self, workflow_id: WorkflowIdType
    ) -> WorkflowValues:
        """Locate workflow by workflow id."""
        workflow = self.workflows[workflow_id]
        if workflow is not None:
            return self._get_workflow_details(workflow)
        raise ValueError(f"Unknown workflow id {workflow_id}")

    def get_workflow_type_by_id(
        self, workflow_id: WorkflowIdType
    ) -> Type[speedwagon.Workflow]:
        return self.workflows[workflow_id]

    def _get_workflow_details(
        self, workflow_klass: Type[speedwagon.Workflow]
    ) -> WorkflowValues:
        workflow = workflow_klass()
        user_options = workflow.job_options()
        parameters: List[WorkflowParam] = []
        for unserialized_option in user_options:
            option = unserialized_option.serialize()
            new_param = WorkflowParam(
                widget_type=option["widget_type"],
                label=option["label"],
                required=option["required"],
            )
            if "selections" in option:
                new_param['selections'] = option['selections']
            parameters.append(new_param)
        for parameter in parameters:
            if "required" not in parameter:
                parameter["required"] = True
        return {
            "name": workflow.name
            if workflow.name is not None
            else workflow_klass.__name__,
            "description": workflow.description
            if workflow.description is not None
            else "",
            "parameters": parameters,
        }

    def get_workflow_info_by_name(self, name: str) -> WorkflowValues:
        """Locate workflow by workflow name."""
        for workflow_ in self.workflows.values():
            if workflow_.name != name:
                continue
            return self._get_workflow_details(workflow_)

        raise ValueError(f"Unknown workflow {name}")


class WorkflowManagerIdBaseOnSize(AbsWorkflowManager[int]):
    def generate_new_workflow_id(
        self, workflow: Type[speedwagon.Workflow]
    ) -> int:
        return len(self.workflows)


class WorkflowManagerAllWorkflows(WorkflowManagerIdBaseOnSize):
    def __init__(self) -> None:
        super().__init__()
        for workflow in speedwagon.available_workflows().values():
            self.workflows[self.generate_new_workflow_id(workflow)] = workflow

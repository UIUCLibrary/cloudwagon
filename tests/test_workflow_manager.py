from typing import List, Any, Dict

from speedwagon.workflow import AbsOutputOptionDataType, ChoiceSelection, DirectorySelect

import speedcloud.workflow_manager
from speedwagon import Workflow


def test_choice_selections():
    class SpamWorkflow(Workflow):
        name = "spam"

        def discover_task_metadata(self, initial_results: List[Any], additional_data: Dict[str, Any], **user_args) -> \
        List[dict]:
            return []

        def job_options(self) -> List[AbsOutputOptionDataType]:
            selected = ChoiceSelection(label="select me", required=True)
            selected.add_selection("one")
            selected.add_selection("two")

            return [
                selected]

    workflow_manager = speedcloud.workflow_manager.WorkflowManagerIdBaseOnSize()
    workflow_manager.add_workflow(SpamWorkflow)
    workflow_info = workflow_manager.get_workflow_info_by_name("spam")
    assert workflow_info['parameters'][0]['selections'] == ["one", "two"]

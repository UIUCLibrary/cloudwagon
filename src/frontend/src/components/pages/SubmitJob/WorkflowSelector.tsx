import {FC, useState} from 'react';
import {IWorkflowSelector, Workflow} from './SubmitJob.types.tsx';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';

export const WorkflowSelector: FC<IWorkflowSelector> = ({workflows, defaultValue, onSelectChange}) =>{

  const [selected, setSelected] = useState<number| null>(defaultValue ? defaultValue.id : null)

  const handleChange = (event: SelectChangeEvent) => {
    const selection = parseInt(event.target.value)
    setSelected(selection);
    if (onSelectChange) {
      const allWorkflows: {[key: number]: Workflow} = {};

      workflows.forEach(workflow =>{
        allWorkflows[workflow.id] = workflow})
      onSelectChange(allWorkflows[selection])
    }
  };
  workflows.sort((a: Workflow, b: Workflow) =>a.name.localeCompare(b.name))
  const workflowMenuItems = workflows.map((workflow) => {
    return <MenuItem key={workflow.id} value={workflow.id}>
      {workflow.name}
    </MenuItem>;
  });
  const value = (!selected && selected !== 0) ? '': selected.toString();
  return (
      <>
        <InputLabel id='workflow-select'>Workflow</InputLabel>
        <Select
            labelId='workflow-select'
            label="Workflow"
            name="workflow"
            value={value}
            // sx={{minWidth: 'max'}}
            onChange={handleChange}>
          {workflowMenuItems}
        </Select>
      </>
  );
}

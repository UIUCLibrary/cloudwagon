export interface IData {
  consoleStreamSSE: string,
  consoleStreamWS: string
}

export interface ISubmitJob{
  workflowName? : string | null
  onWorkflowChanged?: (workflowName: string)=>void
}

export interface WidgetApi{
  widget_type: string
  label: string
  required?: boolean
  selections?: string[]
}
export interface WorkflowDetails {
  description:string
  name: string
  parameters: WidgetApi[]

}

export interface Workflow {
  id: number,
  name: string
}
export interface IWorkflowSelector{
  workflows: Workflow[],
  defaultValue?: Workflow | null,
  onSelectChange?: (selected: Workflow) =>void;
}

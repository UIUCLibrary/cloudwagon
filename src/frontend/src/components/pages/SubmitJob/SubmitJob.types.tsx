export interface IData {
  consoleStreamSSE: string,
  consoleStreamWS: string
}

export interface IUseWorkflowMetadataHookData {
  loading: boolean
  data: WorkflowDetails | null
  errors: unknown
}
interface IUseWorkflowListHookData {
  loading: boolean
  data: Workflow[] | null
  error: unknown
}

export interface SubmitJobProps {
  workflowName? : string | null
  onWorkflowChanged?: (workflowName: string)=>void
  onJobSubmitted?: (IData)=>void
  useWorkflowMetadataHook: (Workflow)=>IUseWorkflowMetadataHookData
  useWorkflowsListHook: ()=>IUseWorkflowListHookData
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

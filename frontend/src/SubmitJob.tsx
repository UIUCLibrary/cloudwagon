import {Button, Box} from "@mui/material";
import FormLabel from "@mui/material/FormLabel"
import FormControl from "@mui/material/FormControl";
import Select, {SelectChangeEvent} from  "@mui/material/Select"
import FormGroup from "@mui/material/FormGroup"
import MenuItem from "@mui/material/MenuItem"
import React, {
  FC,
  SyntheticEvent,
  useEffect,
  useState
} from "react";
import axios from 'axios';
import JobProgressDialog from './JobProgressDialog';
import {
  CheckBoxOption,
  DirectorySelect,
  FileSelect,
  IAPIDirectoryContents,
  SelectOption
} from "./Widgets";
import InputLabel from '@mui/material/InputLabel';
export interface WidgetApi{
    widget_type: string
    label: string
    required?: boolean
    selections?: string[]
}
interface WorkflowDetails {
  description:string
  name: string
  parameters: WidgetApi[]

}

const APISelectDir = ({widgetParameter}: { widgetParameter: WidgetApi})=>{
    const useAPI = (path: string | null) =>{
      const [data, setData]= useState<IAPIDirectoryContents | null>(null)
      const [error, setError]= useState('')
      const [loaded, setLoaded] = useState(false)
      const [outOfDate, setOutOfDate] = useState(true)

      const update = ()=>{
        setOutOfDate(true)
        setLoaded(false)
      }
      useEffect(()=>{
        if (path && !loaded) {
          setLoaded(false)
          axios.get(`/api/files/contents?path=${path}`)
              .then(response => {
                setData(response.data)
              })
              .catch(setError)
              .finally(()=>{
                setLoaded(true)
                setOutOfDate(false)
              })
        }
      }, [path, outOfDate])
      return {data: data, error: error, loaded: loaded, update: update}
    }
    return (
        <DirectorySelect
            required={widgetParameter.required}
            getDataHook={useAPI}
            label={widgetParameter.label}
            parameters={widgetParameter}/>
    )
}
export const GetWidget: FC<WidgetApi> = (parameter)=>{
    if(parameter.widget_type === 'DirectorySelect'){
      return <APISelectDir widgetParameter={parameter}/>
    }
    if(parameter.widget_type === 'FileSelect'){
        return (
            <FileSelect required={parameter.required} label={parameter.label} parameters={parameter}/>
        )
    }
    if(parameter.widget_type === 'BooleanSelect'){
        return (
            <CheckBoxOption required={parameter.required} label={parameter.label} parameters={parameter}/>
        )
    }
    if(parameter.widget_type === 'ChoiceSelection'){
        return (
            <SelectOption required={parameter.required} label={parameter.label} parameters={parameter}/>
        )
    }
    return <></>
}
export interface Workflow {
    id: number,
    name: string
}
interface IWorkflowSelector{
  workflows: Workflow[],
  defaultValue?: Workflow | null,
  onSelectChange?: (selected: Workflow) =>void;
}



const WorkflowSelector: FC<IWorkflowSelector> = ({workflows, defaultValue, onSelectChange}) =>{

  const [selected, setSelected] = useState<number| null>(defaultValue ? defaultValue.id : null)

  const handleChange = (event: SelectChangeEvent) => {
    const selection = parseInt(event.target.value as string)
    setSelected(selection);
    if (onSelectChange) {
      const allWorkflows: {[key: number]: Workflow} = {};

      workflows.forEach(workflow =>{
        allWorkflows[workflow.id] = workflow})
      onSelectChange(allWorkflows[selection])
    }
  };
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

const useWorkflowList = ()=>{
  const [workflowList, setWorkflowList] = useState<Workflow[] | null>(null)
  useEffect(()=>{
    let ignore = false
    const fetchData = async (url: string) =>{
      const results = await axios.get(url)
          .then((res) => res.data.workflows);
      if (!ignore) {
        setWorkflowList(
            results.sort().map(
                (workflow: { id: number, name: string }) => (
                    {id: workflow.id, name: workflow.name}
                )
            ))
      }
    }
    if(workflowList === null) {
      fetchData("/api/list_workflows")
          .catch(console.error)
    }
    return ()=>{
      ignore = true
    }
  }, [workflowList])
  return workflowList
}

interface IData {
  consoleStreamSSE: string,
  consoleStreamWS: string
}

interface ISubmitJob{
  workflowName? : string | null
  onWorkflowChanged?: (workflowName: string)=>void
}
export default function SubmitJob({workflowName, onWorkflowChanged}: ISubmitJob){
    const workflowList = useWorkflowList()  // this causes reloading
    const [currentWorkflow, setCurrentWorkflow] = React.useState<Workflow | null>(null);
    const [workflowData, setWorkflowData] = React.useState<WorkflowDetails | null>(null);
    // const [streamUrlSSE, setStreamUrlSSE] = useState<string|null>(null)
    const [streamUrlWS, setStreamUrlWS] = useState<string|null>(null)
    const [showDialog, setShowDialog] = useState(false)

    const handleChangedWorkflow = (workflow: Workflow)=>{
      if(onWorkflowChanged){
        onWorkflowChanged(workflow.name)
      }
      setCurrentWorkflow(workflow);
    }

    useEffect(()=>{
      const changedWorkflowFeedback = ((selectedWorkflow: Workflow)=>{
        const encodeName = encodeURI(selectedWorkflow.name)
        axios.get(`/api/workflow?name=${encodeName}`)
            .then(res => {
            setWorkflowData(res.data.workflow)
        })
    })
      if (currentWorkflow){
        changedWorkflowFeedback(currentWorkflow);
      }
    }, [currentWorkflow])

    if(!workflowList) {
      return <div>Loading...</div>
    }
    const openDialog = (data: IData) =>{
      // setStreamUrlSSE(data.consoleStreamSSE)
      setStreamUrlWS(data.consoleStreamWS)
      setShowDialog(true)
    }
    if (workflowName){
        const workflow = getWorkflow(currentWorkflow, workflowName, workflowList);
        if (workflow) {
          setCurrentWorkflow(workflow);
        }
    }
    const description = workflowData? workflowData.description: ''
    let workflowDetails = <></>;
    const handleClose = ()=>{
      // setStreamUrlSSE(null)
      setStreamUrlWS(null)
      setShowDialog(false)
    }
    if (workflowData){
      const dialogTitle = workflowName ? workflowName :'Running Job';

      const dialogBox = streamUrlWS ?
          <JobProgressDialog
              title={dialogTitle}
              streamUrlWS={streamUrlWS}
              show={showDialog}
              onClose={handleClose}/>
          : <></>
      // const dialogBox = streamUrlSSE ?
      //     <JobProgressDialog
      //         title={dialogTitle}
      //         streamUrlSSE={streamUrlSSE}
      //         show={showDialog}
      //         onClose={handleClose}/>
      //     : <></>
      workflowDetails = (
          <>
            <Box sx={{my: 2}}>
              <FormGroup >
                <FormLabel>Description:</FormLabel>
                <span style={{'whiteSpace': 'pre-wrap', "textAlign": "left"}}>
                  {description}
                </span>
              </FormGroup>
            </Box>
            {dialogBox}
            <Box sx={{my: 2}}>
              <FormGroup>
                <FormLabel>Settings:</FormLabel>
                <>
                  {
                    workflowData? workflowData['parameters'].map((parameters)=>{
                      return <GetWidget {...parameters}/>
                    }): <></>
                  }
                </>
              </FormGroup>
            </Box>
          </>
      );
    }
    return(
        <div>
          <form onSubmit={(event => handleSubmitNewJob(event, openDialog))}>
            <FormControl fullWidth={true}>
                <FormGroup>
                  <WorkflowSelector
                      workflows={workflowList}
                      defaultValue={currentWorkflow}
                      onSelectChange={handleChangedWorkflow}
                  />
                </FormGroup>
                  {workflowDetails}
              <Box sx={{my: 2}}>
              <FormGroup row={true}>
                <Button
                    type="submit"
                    variant={"contained"}
                    disabled={currentWorkflow ? false: true}
                >
                  Start
                </Button>
              </FormGroup>
              </Box>
            </FormControl>
          </form>
        </div>
    )
}


const handleSubmitNewJob = (
    event: SyntheticEvent,
    onOpenDialog: (data:IData)=>void
) => {
  event.preventDefault()
  const formData = new FormData(event.target as HTMLFormElement);
  const formProps = Object.fromEntries(formData);
  const workflowId = formProps['workflow']
  delete formProps.workflow

  axios.post('/api/submitJob', {
    'details': formProps,
    'workflow_id': workflowId
  })
      .then((res)=>onOpenDialog(res.data))
    };

const getWorkflow = (
    currentWorkflow: Workflow | null,
    workflowName: string,
    workflowList: Workflow[]
)=>{
  if (!currentWorkflow || workflowName !== currentWorkflow.name){
    for (const value of Object.values(workflowList)){
      if ( value.name === workflowName){
        return value;
      }
    }
  }
  return null;
}
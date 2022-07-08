import {Button, Box} from "@mui/material";
import FormLabel from "@mui/material/FormLabel"
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
import {CheckBoxOption, DirectorySelect, FileSelect, SelectOption} from "./Widgets";
import InputLabel from '@mui/material/InputLabel';
interface WidgetApi{
    widget_type: string
    label: string
}

function WorkflowParams(props: any){
    if( props['parameters'] == null){
        return (<div></div>)
    }
    const s = props.parameters.map(
        (parameter: WidgetApi, index: number)=>{
            if(parameter.widget_type === 'DirectorySelect'){
                return (
                    <DirectorySelect key={index} label={parameter.label}/>
                )
            }
            if(parameter.widget_type === 'FileSelect'){
                return (
                    <FileSelect key={index} label={parameter.label}/>
                )
            }
            if(parameter.widget_type === 'BooleanSelect'){
                return (
                    <CheckBoxOption key={index} label={parameter.label}/>
                )
            }
            if(parameter.widget_type === 'ChoiceSelection'){
                return (
                    <SelectOption key={index} label={parameter.label}/>
                )
            }
            console.log(parameter)
            return (
                <SelectOption key={index} label={parameter.label}/>
            )
        }
    )
    return(
        <>
            {s}
        </>
    )
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
    return <MenuItem key={workflow.id.toString()} value={workflow.id}>
      {workflow.name}
    </MenuItem>;
  });
  const value = (!selected && selected !== 0) ? '': selected.toString();
  return (
      <>
        <InputLabel>Workflow</InputLabel>
        <Select label="Workflow" name="workflow" value={value} onChange={handleChange}>
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
                (workflowName: string, index: number) => (
                    {id: index, name: workflowName}
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

interface ISubmitJob{
  workflowName? : string | null
  onWorkflowChanged?: (workflowName: string)=>void
}
export default function SubmitJob({workflowName, onWorkflowChanged}: ISubmitJob){
    const workflowList = useWorkflowList()  // this causes reloading
    const [currentWorkflow, setCurrentWorkflow] = React.useState<Workflow | null>(null);
    const [workflowData, setWorkflowData] = React.useState<WorkflowDetails | null>(null);
    const [streamUrl, setStreamUrl] = useState<string|null>(null)
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
        fetch(`/api/workflow?name=${encodeName}`)
            .then((res=>res.json())).then(res => {
            setWorkflowData(res.workflow)
        })
    })
      if (currentWorkflow){
        changedWorkflowFeedback(currentWorkflow);
      }
    }, [currentWorkflow])

    if(!workflowList) {
      return <div>Loading...</div>
    }
    const handleSubmitNewJob = (event: SyntheticEvent) => {
        event.preventDefault()
        console.log("POpening up dialog box")
        const formData = new FormData(event.target as HTMLFormElement);
        let formProps = Object.fromEntries(formData);
        const workflowId = formProps['workflow']
        delete formProps.workflow

        axios.post('/api/submitJob', {
          'details': formProps,
          'workflow_id': workflowId
        })
            .then(
                (res)=>{
                  console.log(res.data)
                  setStreamUrl(res.data.consoleStream)
                  setShowDialog(true)
                }
            )
    };
    if (workflowName){
      if (!currentWorkflow || workflowName !== currentWorkflow.name){
        for (const [key, value ]of Object.entries(workflowList)){
          if ( value.name === workflowName){
            setCurrentWorkflow(value)
            break
          }
        }
      }
    }
    const description = workflowData? workflowData.description: ''
    let workflowDetails = <></>;
    const handleClose = ()=>{
      setStreamUrl(null)
      setShowDialog(false)
    }
    if (workflowData){
      const dialogBox = streamUrl ?
          <JobProgressDialog
              streamUrl={streamUrl}
              show={showDialog}
              onClose={handleClose}/>
          : <></>
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
                <WorkflowParams parameters={workflowData ? workflowData['parameters']: null}/>
              </FormGroup>
            </Box>
          </>
      );
    }
    return(
        <div>
            <form onSubmit={handleSubmitNewJob}>
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
                <Button type="submit" variant={"contained"} disabled={currentWorkflow ? false: true}>Start</Button>
              </FormGroup>
              </Box>
            </form>
        </div>
    )
}
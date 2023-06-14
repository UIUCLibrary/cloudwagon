import {Button, Box} from "@mui/material";
import FormLabel from "@mui/material/FormLabel"
import FormControl from "@mui/material/FormControl";
import Select, {SelectChangeEvent} from  "@mui/material/Select"
import FormGroup from "@mui/material/FormGroup"
import MenuItem from "@mui/material/MenuItem"
import  {
  FC,
  SyntheticEvent,
  useEffect,
  useState
} from "react";
import axios from 'axios';
import JobProgressDialog from '../dialogs/JobProgressDialog';

import {
  ISubmitJob,
  IData,
  WorkflowDetails,
  Workflow
} from './SubmitJob.types';
import {useWorkflowList} from './useWorkflowList';
import {WorkflowSelector} from './WorkflowSelector';
import {GetWidget} from './GetWidget';


export default function SubmitJob({workflowName, onWorkflowChanged}: ISubmitJob){
    const workflowList = useWorkflowList()  // this causes reloading
    const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
    const [workflowData, setWorkflowData] = useState<WorkflowDetails | null>(null);
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
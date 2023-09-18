import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel"
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup"
import {
    SyntheticEvent,
    useState,
    Fragment, PropsWithChildren
} from "react";
import axios from 'axios';

import {
    SubmitJobProps,
    IData,
    Workflow, WidgetApi, IUseWorkflowMetadataHookData
} from './SubmitJob.types';

import {WorkflowSelector} from './WorkflowSelector';
import {GetWidget} from './GetWidget';
import Skeleton from "@mui/material/Skeleton";

interface FormElementProps {
    label: string
}

function JobFormElement(props: PropsWithChildren<FormElementProps>){
    const label = `${props.label}:`
    return (
        <Box sx={{my: 2}}>
            <FormGroup>
                <FormLabel>{label}</FormLabel>
                {props.children}
            </FormGroup>
        </Box>
    )
}

const JobSettings = ({settings}: {settings: WidgetApi[] | null})=>{
    return (
        <JobFormElement label={'Settings'}>
            {
                settings? settings.map((parameters)=>{
                    return <Fragment key={parameters.label}><GetWidget {...parameters}/></Fragment>
                }): <></>
            }
        </JobFormElement>
    )
}

const JobSettingsSkeleton = ()=>{
    return (
        <JobFormElement label={"Settings"}>
            <Skeleton animation="wave" variant="rounded" height={40} style={{ marginBottom: 20, marginTop:10}} data-testid="settings-skeleton"/>
            <Skeleton animation="wave" variant="rounded" width="40%"  height={40} style={{ marginBottom: 20 }}/>
            <Skeleton animation="wave" variant="rounded" width="20%"  height={40} style={{ marginBottom: 20 }}/>
            <Skeleton animation="wave" variant="rounded" height={40} style={{ marginBottom: 20 }}/>
            <Skeleton animation="wave" variant="rounded" height={40} style={{ marginBottom: 20 }}/>
        </JobFormElement>
        )
}
const JobDescription = ({value}: {value: string})=>{
    return(
        <JobFormElement label={"Description"}>
            <span style={{'whiteSpace': 'pre-wrap', "textAlign": "left"}}>
              {value}
            </span>
        </JobFormElement>
    )
}

const JobDescriptionSkeleton = ()=>{
    return (
        <JobFormElement label={"Description"}>
            <Skeleton animation="wave" data-testid="description-skeleton"/>
            <Skeleton animation="wave"/>
            <Skeleton animation="wave"/>
            <Skeleton animation="wave" width="80%" style={{ marginBottom: 6 }}/>
        </JobFormElement>
    )
}

const JobSubmitContents = (workflowMetadata: IUseWorkflowMetadataHookData)=>{
    return (
        <>
            {
                workflowMetadata.loading ?
                    <JobDescriptionSkeleton/>:
                    <JobDescription value={workflowMetadata.data? workflowMetadata.data.description: ''}/>
            }
            {
                workflowMetadata.loading ?
                    <JobSettingsSkeleton/>:
                    <JobSettings settings={workflowMetadata.data? workflowMetadata.data.parameters : null}/>
            }
        </>
    )
}


export default function SubmitJob({workflowName, onWorkflowChanged, onJobSubmitted, useWorkflowMetadataHook, useWorkflowsListHook, onStatusMessage}: SubmitJobProps){
    const workflowList = useWorkflowsListHook()  // this causes reloading
    const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
    const workflowMetadata = useWorkflowMetadataHook(currentWorkflow)
    const handleChangedWorkflow = (workflow: Workflow)=>{
      if(onWorkflowChanged){
        onWorkflowChanged(workflow.name)
      }
      setCurrentWorkflow(workflow);
    }

    if(workflowList.loading) {
      return <div>Loading...</div>
    }
    const handleNewJobSubmitted = (data: IData) =>{
        if (onJobSubmitted){
            onJobSubmitted(data)
        }
        if (onStatusMessage){
            onStatusMessage(`Created new job`)
        }
    }
    if (workflowName){
        const workflow = getWorkflow(currentWorkflow, workflowName, workflowList.data ?? []);
        if (workflow) {
          setCurrentWorkflow(workflow);
        }
    }
    return(
        <div>
          <form onSubmit={(event => handleSubmitNewJob(event, handleNewJobSubmitted))}>
            <FormControl fullWidth={true}>
                <FormGroup>
                  <WorkflowSelector
                      workflows={workflowList.data ?? []}
                      defaultValue={currentWorkflow}
                      onSelectChange={handleChangedWorkflow}
                  />
                </FormGroup>
                {
                    currentWorkflow ? <JobSubmitContents {...workflowMetadata}/> : <></>
                }
                <Box sx={{my: 2}}>
                    <FormGroup row={true}>
                        <Button
                            type="submit"
                            variant={"contained"}
                            disabled={!currentWorkflow}
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
    onSuccessfulSubmit: (data:IData)=>void
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
      .then((res)=>onSuccessfulSubmit(res.data))
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
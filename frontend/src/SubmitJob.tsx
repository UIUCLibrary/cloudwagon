import {Button, Grid} from "@mui/material";
import Typography from '@mui/material/Typography';
import {DynamicAPISelect} from "./DynamicAPISelect";
import React, {SyntheticEvent, useEffect} from "react";
import {CheckBoxOption, DirectorySelect, FileSelect, SelectOption} from "./Widgets";

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
export default function SubmitJob(){
    const [workflow, setWorkflow] = React.useState({name: '', id: 0});
    const [workflowData, setWorkflowData] = React.useState({workflow: null});
    const changedWorkflowFeedback = ((name: string, id: number)=>{
        const encodeName = encodeURI(name)

        fetch(`/api/workflow?name=${encodeName}`)
            .then((res=>res.json())).then(res => {
            setWorkflowData({workflow: res.workflow})
        })
        setWorkflow({name, id})
    })
    useEffect(()=>{
    }, [workflow])
    const submit = (e: SyntheticEvent) => {
        e.preventDefault()
        console.log(e)
    };
    return(
        <div>
            <form onSubmit={submit}>
                <Grid container spacing={2}>
                    <Grid item xs={2}>
                        <h3>Workflow:</h3>
                    </Grid>
                    <Grid item xs={10}>
                        <DynamicAPISelect apiUrl={"/api/list_workflows"} onSelectChange={changedWorkflowFeedback}/>
                    </Grid>
                    <Grid item xs={2}>
                        <h3>Description:</h3>
                    </Grid>
                    <Grid item xs={10} style={{ display: "flex", justifyContent: "flex-start" }}>
                        <Typography>
                        {workflowData.workflow ? workflowData.workflow['description']: ""}
                        </Typography>
                    </Grid>
                    <Grid item xs={2}>
                        <h3>Settings:</h3>
                    </Grid>
                    <Grid item xs={10}>
                        <WorkflowParams parameters={workflowData.workflow ? workflowData.workflow['parameters']: null}/>
                    </Grid>
                </Grid>

                <Button type="submit" variant={"contained"}>Start</Button>
            </form>
        </div>
    )
}
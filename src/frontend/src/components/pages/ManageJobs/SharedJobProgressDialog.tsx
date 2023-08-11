import {forwardRef, useCallback, useEffect, useImperativeHandle, useState} from "react";
import {IJobStatusHookData, ProgressData, SharedJobProgressDialogRef} from "./ManageJobs.types.tsx";
import JobProgressDialog from "../../dialogs/JobProgressDialog";

interface SharedJobProgressDialogProps {
    useJobStatusHook: (jobId: string | null) => IJobStatusHookData
}


export const SharedJobProgressDialog = forwardRef<SharedJobProgressDialogRef, SharedJobProgressDialogProps>(
    (props, ref) =>{
        const [visible, setVisible] = useState(false)
        const [jobId, setJobId] = useState<string|null>(null)
        const [currentTask, setCurrentTask] = useState<string|null>(null)
        const jobStatus = props.useJobStatusHook(jobId)
        const [progress, setProgress] = useState<number|null>(null)
        const [logs, setLogs] = useState('')
        const [jobData, setJobData] = useState<ProgressData | null>(null)
        const [dialogTitle, setDialogTitle] = useState('')

        useEffect(() => {
            if (jobStatus.data && JSON.stringify(jobStatus.data) != JSON.stringify(jobData)){
                    setJobData(jobStatus.data)
            }
        }, [jobStatus.data])

        useEffect(() => {
            if (jobData){
                if(jobStatus.data === null) {
                    console.error(`jobStatus.data is null`)
                } else {
                    if (jobStatus.data.job_id){
                        setDialogTitle(`Job: "${jobStatus.data.job_id}"`)
                    }
                    setLogs(jobStatus.data.logs.map(log=>log.msg).join('\n'))
                    if (jobStatus.data.currentTask != currentTask){
                        setCurrentTask(jobStatus.data.currentTask)
                    }
                    if (jobStatus.data.progress !== progress){
                        setProgress(jobStatus.data.progress)
                    }
                }
            }
        }, [jobData]);
        const reset = ()=>{
            setLogs('')
            setCurrentTask(null)
            setProgress(null)
            setJobId(null)
        }
        useEffect(() => {
            if(jobStatus.loading){
                setDialogTitle("Loading")
            }
        }, [jobStatus.loading]);
        useEffect(() => {
            reset()
        }, [jobId, visible]);
        useImperativeHandle(ref, ()=>({
            open: ()=>{
                setVisible(true)
            },
            setJobId: (jobId)=>{setJobId(jobId)}
        }));
        const handleCloseDialogWindow = useCallback(()=>{
            setVisible(false)
            reset()
        }, [])
        return (
            <JobProgressDialog
                title={dialogTitle}
                progress={progress}
                show={visible}
                logs={logs}
                currentTaskDescription={currentTask}
                onClose={handleCloseDialogWindow}
            />
        )
    })
SharedJobProgressDialog.displayName = "SharedJobProgressDialog"

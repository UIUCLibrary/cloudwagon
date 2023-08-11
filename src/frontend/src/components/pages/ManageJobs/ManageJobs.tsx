import Button from '@mui/material/Button'
import TableCell from "@mui/material/TableCell";
import LinearProgress  from '@mui/material/LinearProgress'
import {IJobStatusHookData, SharedJobProgressDialogRef} from './ManageJobs.types.tsx'
import {SharedJobProgressDialog} from './SharedJobProgressDialog.tsx'
import {useCallback, useRef, useState} from "react";
import {UseSSEHookData} from "../../apiHooks/useSSE";
import JobQueueTable, {JobRow} from '../../widgets/JobQueueTable/JobQueueTable.tsx'
export interface JobStatus {
    job: any
    state: string
    progress: number | null
    order: number
    job_id: string
    time_submitted: string
    highlight?: boolean
    hasReport?: boolean
    onRequestDetails?: (jobId: string)=>void
}


const DateTimeSubmittedData = ({submitted}: { submitted: string}) =>{
    const isOlderThanADay = (timeSubmitted: string): boolean => {
        const dateTimeInHours = (new Date(timeSubmitted)).getHours()
        const nowInHours = (new Date()).getHours()
        return (nowInHours - dateTimeInHours) > 24
    }
    const timeSubmitted = new Date(submitted);
    return (
        <>
            {
                isOlderThanADay(submitted) ?
                    timeSubmitted.toLocaleDateString() :
                    `Today at ${timeSubmitted.toLocaleTimeString()}`
            }
        </>
    )
}
interface ManageJobsProps {
    jobId?: string;
    useAllJobsStatusHook: ()=>UseSSEHookData<JobStatus[]>;
    useSingleJobStatusHook: (jobId: string| null) => IJobStatusHookData;
}
export default function ManageJobs({jobId, useAllJobsStatusHook, useSingleJobStatusHook}: ManageJobsProps){
    const [selectedJobId, setSelectedJobId] = useState<string|null>(jobId)
    const jobsStatus = useAllJobsStatusHook()
    // FIXME: sse handle is not closed when switching to a new tab
    const dialogRef = useRef<SharedJobProgressDialogRef>(null)
    const headings = [
        {label: "Submitted", minWidth: 50},
        {label: "Workflow", minWidth: 75},
        {label: "Status", minWidth: 50},
        {label: "Progress", minWidth: 50},
        {label: "Report", minWidth: 50},
        {label: "Details", minWidth: 50},
    ]


    const handleNewClick = useCallback((jobId: string)=>{
        setSelectedJobId(jobId)
        if (dialogRef.current){
            dialogRef.current.setJobId(jobId)
            dialogRef.current.open()

        }
    },[selectedJobId]);

    const widgetBody =(
        <>
            {
                jobsStatus.data.map((jobsStatus)=> {
                    const data = {
                        "submitted": jobsStatus.time_submitted,
                        "name": jobsStatus.job.workflow.name,
                        "state": jobsStatus.state,
                        "progress": jobsStatus.progress,
                        "report": jobsStatus.hasReport,
                        "details": jobsStatus.job_id,
                    };
                    return (
                        <JobRow
                            key={jobsStatus.job_id}
                            data={data}
                            selected={selectedJobId === jobsStatus.job_id}
                            renderItem={
                                (key, value) => {
                                    switch (key) {
                                        case "submitted":
                                            return (
                                                <TableCell key={key}>
                                                    <DateTimeSubmittedData submitted={value}/>
                                                </TableCell>
                                            )
                                        case "progress":
                                            return (
                                                <TableCell key={key}>
                                                    {value === null ? '' : `${value}%`}
                                                </TableCell>
                                            )
                                        case "details":
                                            return (
                                                <TableCell key={key}>
                                                    <Button onClick={() => handleNewClick(jobsStatus.job_id)}>
                                                        Details
                                                    </Button>
                                                </TableCell>
                                            )
                                        default:
                                            return <TableCell key={key}>{value as string}</TableCell>
                                    }
                                }
                            }
                        />
                    )
                })
            }
        </>
    )

    return (
        <>
            <SharedJobProgressDialog ref={dialogRef} useJobStatusHook={useSingleJobStatusHook}/>
            <JobQueueTable headings={headings}>
                {widgetBody}
            </JobQueueTable>
            {jobsStatus.loading ? <LinearProgress/>: <></>}
        </>
    )
}
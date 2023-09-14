import {IJobStatusHookData, LogMessage} from "./ManageJobs.types.tsx";
import {useEffect, useState} from "react";
import {useJobStatusSSE} from "./useJobStatusSSE.tsx";
import axios from "axios";

interface JobInfoSmall {
    job_id: string
    job_status: string
}

export const useSingleJobStatus = (jobId: string | null): IJobStatusHookData =>{
    const [sseUrl, setSseUrl] = useState<string|null>(null)
    const sseHook = useJobStatusSSE(sseUrl)
    const [data, setData] = useState<IJobStatusHookData>({active: false, data: null, loading: false})
    const [logs, setLogs] = useState<LogMessage[]>([])

    const getJobStatus = (jobId: string)=>{
        const jobInfoUrl = `/api/jobInfo?job_id=${jobId}`
        axios.get<JobInfoSmall>(jobInfoUrl).then(
            (requestData) => {

                if (requestData.data.job_status === "running"){
                    setSseUrl(`/api/followJobStatus?job_id=${jobId}`)
                } else if (requestData.data.job_status === "success"){
                    setSseUrl(null)
                    setData(
                        {
                            active: true,
                            data: {
                                job_id: requestData.data.job_id,
                                logs: [
                                    {msg: "Loading", time: Date.now().toString()}
                                ]
                            },
                            loading: true
                        }
                    )
                    axios.get<LogMessage[]>(`/api/jobLogs?job_id=${jobId}`).then(response=> {
                        setLogs(response.data)
                        setData({active: false, data: {job_id: requestData.data.job_id, logs: []}, loading: false})
                    }).catch(console.error)
                }
            }
        ).catch(console.error)
    }
    useEffect(() => {
        if (jobId){
            getJobStatus(jobId)
        }
    }, [jobId]);
    useEffect(() => {
        if(sseHook && sseUrl){
            if (sseHook.data){
                if ('logs' in sseHook.data){
                    setLogs(sseHook.data.logs)
                }
            }
            if (JSON.stringify(sseHook) !== JSON.stringify(data)){
                setData(sseHook)
            }
        }

    }, [sseHook]);

    useEffect(() => {
        logs.sort((a, b)=> {
            return a < b ? 1: -1
        } )
        const mergedData = {...data.data, ...{logs: logs}}
        setData({...data, ...{data: mergedData}})
    }, [logs]);
    return data
}
export default useSingleJobStatus;
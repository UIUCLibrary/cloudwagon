import {useEffect, useState} from "react";
import {IJobStatusHookData, ProgressData, LogMessage} from './ManageJobs.types.tsx'
import {useSSE} from "../../apiHooks/useSSE";

export const useJobStatusSSE = (url: string| null): IJobStatusHookData=>{
    const [active, setActive] = useState(false)
    const [data, setData] = useState<ProgressData | null>(null)
    const [logs, setLogs] = useState<LogMessage[]>([])
    const sse = useSSE<ProgressData>(url)

    const resetData = ()=>{
        setLogs([])
    }

    useEffect(() => {
        resetData()
        if (url){
            setActive(true)
            sse.reset()
        } else {
            setActive(false)
        }
    }, [url]);

    const processData = (newData: ProgressData) =>{
        if ("logs" in newData){
            setLogs([...logs, ...newData.logs])
            // const reversed = newData.logs.reverse()
            // setLogs([...reversed, ...logs])
        }
        setData({...data, ...newData})
    }

    useEffect(() => {
        if (sse.data){
            processData(sse.data)
            if (
                ('job_status' in sse.data) &&
                (["success", "failure"].includes(sse.data.job_status))
            ){
                sse.stop()
            }
        }
    }, [sse.data]);
    const mergedData = data
    if (mergedData){
        mergedData.logs = logs
    }
    return {
        active: active,
        data: mergedData,
        loading: sse.loading
    }
};
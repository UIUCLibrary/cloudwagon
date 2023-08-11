export interface LogMessage {
    msg: string
    time: string
}
export interface ProgressData {
    logs?: LogMessage[]
    progress?: number
    currentTask?: string
    job_id?: string
    job_status?: string
}

export interface IJobStatusHookData {
    active: boolean;
    data: ProgressData | null;
    loading: boolean;
}

export type SharedJobProgressDialogRef = {
    open: ()=>void
    setJobId: (id: string)=>void
}
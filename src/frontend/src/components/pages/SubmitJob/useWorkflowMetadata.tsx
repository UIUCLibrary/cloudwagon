import {Workflow, WorkflowDetails} from "./SubmitJob.types.tsx";
import {useEffect, useState} from "react";
import {useAxios} from "../../apiHooks";
const useWorkflowMetadata = (selectedWorkflow: Workflow | null) => {
    const [url, setUrl] = useState<string|null>(null)
    const axiosData = useAxios<{workflow: WorkflowDetails}>(url)
    const [workflowData, setWorkflowData] = useState<WorkflowDetails | null>(null);
    useEffect(()=> {
        if (selectedWorkflow !== null){
            const encodeName = encodeURI(selectedWorkflow.name)
            setUrl(`/api/workflow?name=${encodeName}`)
        }
    }, [selectedWorkflow])
    useEffect(() => {
        if (axiosData.loading === false && axiosData.data){
            setWorkflowData(axiosData.data.workflow)
        }
    }, [axiosData]);
    return  {loading: axiosData.loading, data: workflowData, errors: axiosData.error}
}
export default useWorkflowMetadata

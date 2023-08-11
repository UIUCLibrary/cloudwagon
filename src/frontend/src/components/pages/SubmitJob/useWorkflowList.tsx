import {useEffect, useState} from 'react';
import {Workflow} from './SubmitJob.types';
import {useAxios} from '../../apiHooks'
const useWorkflowList= ()=>{
  const {loading, data, error} = useAxios<{workflows: Workflow[]}>("/api/list_workflows")
  const [workflowList, setWorkflowList] = useState<Workflow[] | null>(null)
  useEffect(()=>{
    if (data){
      data.workflows.sort(
          (a, b)=>b.name.localeCompare(a.name)
      )
      setWorkflowList(data.workflows.map(
          (workflow: { id: number, name: string }) => (
              {id: workflow.id, name: workflow.name}
          )
      ))
    }
  }, [data])
  return {loading: loading, data: workflowList, error: error}
}
export default useWorkflowList;
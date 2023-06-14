import {useEffect, useState} from 'react';
import axios from 'axios';
import {Workflow} from './SubmitJob.types';

export const useWorkflowList = ()=>{
  const [workflowList, setWorkflowList] = useState<Workflow[] | null>(null)
  useEffect(()=>{
    let ignore = false
    const fetchData = async (url: string) =>{
      const results = await axios.get(url)
          .then((res) => res.data.workflows);
      if (!ignore) {
        setWorkflowList(
            results.sort().map(
                (workflow: { id: number, name: string }) => (
                    {id: workflow.id, name: workflow.name}
                )
            ))
      }
    }
    if(workflowList === null) {
      fetchData("/api/list_workflows")
          .catch(console.error)
    }
    return ()=>{
      ignore = true
    }
  }, [workflowList])
  return workflowList
}
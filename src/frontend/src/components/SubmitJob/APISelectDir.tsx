import {WidgetApi} from './SubmitJob.types.tsx';
import {useEffect, useState} from 'react';
import {DirectorySelect, IAPIDirectoryContents} from '../widgets';
import axios from 'axios';

export const APISelectDir = ({widgetParameter}: { widgetParameter: WidgetApi})=>{
  const useAPI = (path: string | null) =>{
    const [data, setData]= useState<IAPIDirectoryContents | null>(null)
    const [error, setError]= useState('')
    const [loaded, setLoaded] = useState(false)
    const [outOfDate, setOutOfDate] = useState(true)

    const update = ()=>{
      setOutOfDate(true)
      setLoaded(false)
    }
    useEffect(()=>{
      if (path && !loaded) {
        setLoaded(false)
        axios.get(`/api/files/contents?path=${path}`)
            .then(response => {
              setData(response.data)
            })
            .catch(setError)
            .finally(()=>{
              setLoaded(true)
              setOutOfDate(false)
            })
      }
    }, [path, outOfDate])
    return {data: data, error: error, loaded: loaded, update: update}
  }
  return (
      <DirectorySelect
          required={widgetParameter.required}
          getDataHook={useAPI}
          label={widgetParameter.label}
          parameters={widgetParameter}/>
  )
}
import {useEffect, useRef, useState} from 'react';
import axios from 'axios';

export const useFilePathIsValid = (pathName: string | null) => {
  const [result, setResult] = useState<null | boolean>(null)
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false)
  const controllerRef = useRef(new AbortController());
  const cancel = () => {
    controllerRef.current.abort()
  }
  const update = () =>{
    console.log("updating")
  }
  useEffect(() => {
    if (pathName) {
      if (pathName === '' || !pathName.startsWith("/")) {
        setResult(false)
      } else {
        setLoaded(false)
        axios.get(`/api/files/exists?path=${pathName}`, {signal: controllerRef.current.signal})
            .then(res => {
              setResult(res.data.exists)
            }).catch(setError)
            .finally(() => {
              setLoaded(true)
            })
      }
    }
  }, [pathName])
  return {cancel, update, result, error, loaded}
}
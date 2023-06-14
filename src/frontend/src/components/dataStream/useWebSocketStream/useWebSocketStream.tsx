import {useEffect, useState} from 'react';
import {StreamApiData} from '../stream.types'
export const useWebSocketStream = (url: string| undefined):[StreamApiData[] | null, boolean, (value: boolean)=>void] =>{
  const [ws, setWs] = useState<WebSocket|null>(null);
  const [data, setData]= useState<StreamApiData[] | null>(null)
  const [streamOpen, setStreamOpen] = useState(false)
  const [abort, setAbort] = useState(false)
  useEffect(()=>{
    let ignore = false
    if (url) {
      if (ws === null){
        if (!ignore){
          setWs(new WebSocket(url));
          setStreamOpen(true)
        }
      }
    }

    return () =>{
      ignore = true;
      if (ws) {
        ws.close();
        setWs(null);
        setStreamOpen(false);
      }
    }
  }, [ws, url])
  if (!url){
    return [data, streamOpen, setAbort]
  }
  if (ws) {
    ws.onmessage = function(event) {
      const newData = JSON.parse(JSON.parse(event.data)) as StreamApiData;
      if (abort){
        ws.send('abort');
      } else {
        ws.send('ok');
      }
      setData(existingData =>{
        if (existingData === null){
          return [newData]
        } else {
          return  existingData.concat(newData)
        }
      })
    }
    ws.onerror = (event) =>{
      console.error("websocket failed:", event);
      ws.close();
    }
    ws.onclose = function (){
      setData(existingData =>{
        if (existingData) {
          return existingData.sort(
              (a, b) => {
                return a['order'] < b['order'] ? -1 : 1
              });
        }
        return existingData
      });
      setStreamOpen(false)
    }
  }
  return [data, streamOpen, setAbort]
}
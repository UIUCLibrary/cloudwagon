import {useEffect, useState} from 'react';
import {StreamApiData} from '../stream.types';

export const useSSEStream = (url: string):[StreamApiData[] | null, boolean] =>{
  const [eventSource, setEventSource] = useState<EventSource|null>(null);
  const [data, setData]= useState<StreamApiData[] | null>(null)
  const [streamOpen, setStreamOpen] = useState(false)
  useEffect(()=>{
    let ignore = false
    if (eventSource === null){
      if (!ignore){
        setEventSource(new EventSource(url));
        setStreamOpen(true)
      }
    }
    return () =>{
      ignore = true;
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    }
  }, [eventSource, url])
  if (eventSource) {
    eventSource.onmessage = function (event) {
      if(event.data) {
        if (event.data === 'done') {
          eventSource.close()
          setStreamOpen(false);
        } else {
          const newData = JSON.parse(event.data) as StreamApiData;
          setData(existingData => {
            if (existingData === null) {
              return [newData]
            } else {
              return existingData.concat(newData)
            }
          })
        }
        return data;
      }
      // } catch (e){
      //   console.error(e)
      //   console.error(event.data)
      //   throw e;
      // }
    }
    eventSource.onerror = (event) =>{
      // eventSource.onerror = (event) =>{
      console.error("EventSource failed:", event);

      eventSource.close();
    }
  }
  return [data, streamOpen];

}
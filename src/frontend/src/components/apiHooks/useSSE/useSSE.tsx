import {useEffect, useState} from "react";
import {UseSSEHookData} from './useSSE.types.ts'

const getStateChanges = (eventSource) => {
    switch (eventSource.readyState){
        case eventSource.CONNECTING:
            return {
                loading: true,
                open: false
            }
        case eventSource.OPEN:
            return {
                loading: false,
                open: true
            }
        case eventSource.CLOSED:
            return {
                loading: false,
                open: false
            }
    }
}

export function useSSE<Type>(
    url: string | null,
    eventSourceFactory: (url: string)=>EventSource=(url: string) => {
        return new EventSource(url)
    }
    ): UseSSEHookData<Type>{
    const [data, setData] = useState<Type | null>(null)
    const [error, setError] = useState<string|null>(null)
    const [eventSource, setEventSource] = useState<EventSource|null>(null);
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const closeConnection = () =>{
        if (eventSource){
            eventSource.close()
            setEventSource(null);
        }
    }
    const stop = ()=>{
        closeConnection()
    }
    const reset = () =>{
        setData(null)
    }
    useEffect(() => {
        if (eventSource && url === null){
            closeConnection()
        }
    }, [url, eventSource]);
    const handle_sse_event = (event: MessageEvent)=>{
        const this_data = event.data
        try {
            const parsedData = JSON.parse(this_data) as Type
            if (JSON.stringify(parsedData) !== JSON.stringify(data)){
                setData(parsedData)
            }
        } catch (e) {
            setError(e)
            throw e
        }
    }

    useEffect(() => {
        if (eventSource){
            const results = getStateChanges(eventSource)
            if(results){
                if (results.open != isOpen){
                    setIsOpen(results.open)
                }
                if (results.loading != loading){
                    setLoading(results.loading)
                }
            }
        } else {
            setLoading(false)
            setIsOpen(false)
        }
    });
    useEffect(()=>{
        if (url){
            if (eventSource === null){
                setData(null)
                    const sse = eventSourceFactory(url)
                    sse.addEventListener('message', handle_sse_event)
                    sse.onerror = (event) =>{
                        setError(JSON.stringify(event))
                    }
                    setEventSource(sse);
            }
        }
        return () =>{
            if (eventSource) {
                eventSource.close();
                eventSource.onmessage = null
                eventSource.removeEventListener('message', handle_sse_event)
                setEventSource(null);
            }
        }
    }, [url])
    return {
        data: data,
        loading: loading,
        error: error,
        isOpen: isOpen,
        stop: stop,
        reset: reset
    }
}
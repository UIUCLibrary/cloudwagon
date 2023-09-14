import {useEffect, useState, useCallback} from "react";
import axios from "axios";

export function useAxios<Type>(url: string | null){
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<unknown>(null)
    const [data, setData] = useState<Type | null>(null)

    const fetchData = useCallback(async (url: string)=> {
        const results = await axios.get<Type>(url).then((res) => res.data)
        setData(results)
    }, [url])

    useEffect(()=>{
        if(url) {
            setLoading(true)
            fetchData(url).catch(setError).finally(()=>setLoading(false))
        }
    }, [url])

    return {loading: loading, data: data, error: error}
}

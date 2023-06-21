import {useEffect, useState} from "react";
import {IFile} from "../../widgets";
import axios from "axios";
export interface useDirectoryContentsHookResponse{
    contents: IFile[]
    error: string | null
    loaded: boolean
    refresh: ()=>void
}
export const useDirectoryContents = (
    path: string | null
): useDirectoryContentsHookResponse => {
    const [contents, setContents] = useState<null | IFile[]>(null)
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false)
    const [isValid, setIsValid] = useState(false)
    const refresh = ()=>{
        setIsValid(false);
    }
    useEffect(()=>{
        setLoading(true);
        console.log('making a request');
        axios.get(`/api/files/contents?path=${encodeURI(path)}`)
            .then((result) => {
                setContents(result.data.contents)
                setError(null);
                setIsValid(true)
            })
            .catch((e)=>{
                setError(e.toString());
                // setPwd(pwd)
                console.error(e);
            })
            .finally(()=>{
                setLoading(false);
            })
    }, [path, isValid])
    return {contents, error, loaded: loading, refresh}
}
import {useEffect, useState} from "react";
import {IAPIDirectoryContents, IFile} from "../../widgets";
import axios, {AxiosResponse} from "axios";
export interface useDirectoryContentsHookResponse{
    contents: IFile[]
    error: string | null
    loaded: boolean
    refresh: ()=>void
}


export function axiosFetchFileContentsFunction (path: string, func?: (url: string)=>Promise<AxiosResponse>): Promise<IAPIDirectoryContents> {

    const method: (url: string) => Promise<AxiosResponse> = func? func: axios.get<IAPIDirectoryContents>
    return new Promise(
        (resolve, reject) =>method(`/api/files/contents?path=${encodeURI(path)}`)
            .then((result) => {
                // This validation could be made a lot better
                ['path', 'contents'].forEach((key)=>{
                    if (!Object.prototype.hasOwnProperty.call(result.data, key)){
                        return reject(`no ${key} in ${JSON.stringify(result.data)}`)
                    }
                })
                for (const file of result.data.contents) {
                    ["name", "type", 'path'].forEach((key)=>{
                        if (!Object.prototype.hasOwnProperty.call(file, key)){
                            return reject(`no ${key} in element ${JSON.stringify(file)}`)
                        }
                    })
                }

                return resolve(result.data)
            })
            .catch(reject)
    )
}
export const useDirectoryContents = (path: string | null, active: boolean, fetchingFunction?: (path: string)=> Promise<IAPIDirectoryContents>)=>{
    const [contents, setContents] = useState<IFile[] | null>(null)
    const [requestResponse, setRequestResponse] = useState<IAPIDirectoryContents | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<null|Error>(null)
    const refresh = () => {
        fetch()
    }

    const fetch = () => {
        if (path === null){
            setError(Error("Null path selected"))
        } else {
            setLoading(true);
            setError(null);
            try {
                const fetchFunction = fetchingFunction ? fetchingFunction : axiosFetchFileContentsFunction

                fetchFunction(path)
                    .then(setRequestResponse)
                    .catch(setError)
                    .finally(()=>{
                        setLoading(false);
                    })
            } catch (error){
                setError(error)
            }
        }
    }
    useEffect(()=>{
        if (active){
            fetch()
        }
    }, [active, path])
    useEffect(()=>{
        if (requestResponse) {
            const files: IFile[] = []
            for (const file of requestResponse.contents) {
                files.push({id: files.length, ...file})
            }
            setContents(files)
        }
    }, [requestResponse])
    return {contents, loading, error, refresh}
}
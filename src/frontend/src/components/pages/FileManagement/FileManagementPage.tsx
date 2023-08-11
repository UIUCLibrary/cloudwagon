import {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from 'react-router-dom';
import DisplayDirectoryItemAsRouteLink from './DisplayDirectoryItemAsRouteLink.tsx';
import {FileManager} from '../../widgets/FileManager'
import {
    FileManagementPageProps,
    IAPIRequest
} from './FileManagment.types';

import axios from "axios";

import BreadCrumbRouteLink from './BreadCrumbRouteLink.tsx';
const folderContentGetter = async (path: string): Promise<IAPIRequest> =>{
    return (async () =>{
        const response = await axios.get(`/api/files/contents?path=${encodeURI(path)}`)
        return response.data
    })()
}

export default function FileManagementPage(props: FileManagementPageProps){
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [pwd, setPwd] = useState(searchParams.get('path') ? searchParams.get('path'): '/')
    useEffect(()=>{
        const newUrl = `./?path=${pwd}`
        navigate(newUrl)
    }, [navigate, pwd])

    return (
        <>
            <FileManager
                path={pwd}
                DirectoryItem={DisplayDirectoryItemAsRouteLink}
                resourceGetter={props.contentGetter? props.contentGetter: folderContentGetter}
                BreadCrumbComponent={BreadCrumbRouteLink}
            />
        </>
    )
}
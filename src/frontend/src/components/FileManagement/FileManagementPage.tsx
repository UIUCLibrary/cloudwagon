import {ReactElement, useEffect, useReducer, useState} from "react";
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Folder from '@mui/icons-material/Folder';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Link as RouterLink} from 'react-router-dom';

import axios from "axios";
import {FileManager, BreadCrumbComponentProps} from '../widgets/FileManager'
import {
    IFileNode,
    IAPIRequest,
} from './FileManagment.types';

enum ACTIONS {
    REMOVE_ALL_FILES,
    ADD_FILES
}
type ActionPayload = {
    path?: string,
    files?: FileList
}
type Action = {
    type: ACTIONS,
    payload?: ActionPayload
}

type State = {
    promise?: Promise<any>
}
function reducer(promise: State, action: Action): State{
    switch (action.type){
        case ACTIONS.REMOVE_ALL_FILES:
            console.log(action.payload.path)
            return {promise: axios.delete('/api/files')}
        case ACTIONS.ADD_FILES:
            console.log(action.payload.files)
            if(action.payload.files) {
                const formData = new FormData();
                for (const file of action.payload.files) {
                    formData.append("files", file, file.name);
                }
                const path = action.payload.path
                return {promise: axios.post(`/api/files?path=${path}`, formData)}
            }
    }
    return {
        promise: Promise.resolve()
    }
}



function BreadCrumbRouteLink({path, display, onClick}: BreadCrumbComponentProps) {
    return (
        <RouterLink
            to={`/manageFiles/?path=${path}`}
            style={{textDecoration: 'none'}}
            onClick={()=> {
                if (onClick) {
                    onClick(path)
                }
            }}
        >{display}</RouterLink>
    )
}

const getNodeIcon = (file: IFileNode)=>{
    switch (file.type){
        case "File":
            return <InsertDriveFileIcon/>
        case "Directory":
            return <Folder/>
        default:
            return <></>
    }
}

export interface DisplayItem2Props {
    file: IFileNode,
    pwd: string,
    onClick: (string)=>void
}


function DisplayDirectoryItemAsRouteLink(props: DisplayItem2Props){
    const getDisplay = (file: IFileNode): string => {
        if (file.type === "Directory") {
            switch (file.name) {
                case "..":
                    return file.name
                case ".":
                    return file.name
            }
            return `${file.name}/`
        }
        return file.name
    }
    const getUrl = (file: IFileNode): string => {
        if (file.type === "Directory") {
            switch (file.name){
                case "..":
                    return `${file.name}/`
                case '.':
                    return ''
            }
            return file.name === ".." ? file.name : `${file.name}/`
        }
        return file.name
    }
    const getLine = (file: IFileNode, onClick: (string)=>void): ReactElement =>{
        if (file.type === "Directory"){
            const outputPath = getUrl(file)
            const fullpath = `${props.pwd}/${outputPath}`
            const linkUrl = `./?path=${encodeURI(fullpath)}`
            return (
                <RouterLink
                    to={linkUrl}
                    style={{textDecoration: 'none',}}
                    onClick={()=> {
                        onClick(file.path)
                    }

                }>{getDisplay(file)}</RouterLink>
            )
        }
        return <>{file.name}</>;
    }
    return (
        <>
            <ListItemIcon>{getNodeIcon(props.file)}</ListItemIcon>
            <ListItemText>{getLine(props.file, props.onClick)}</ListItemText>
        </>
    )
}


interface FileManagementPageProps{
    contentGetter?: (path: string)=> Promise<IAPIRequest>
}
export default function FileManagementPage(props: FileManagementPageProps){
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [pwd, setPwd] = useState(searchParams.get('path') ? searchParams.get('path'): '/')
    useEffect(()=>{
        const newUrl = `./?path=${pwd}`
        navigate(newUrl)
    }, [navigate, pwd])

    const contentGetter = async (path: string): Promise<IAPIRequest> =>{
        return (async () =>{
            const response = await axios.get(`/api/files/contents?path=${encodeURI(path)}`)
            return response.data
        })()
    }
    return (
        <>
            <FileManager
                path={pwd}
                DirectoryItem={DisplayDirectoryItemAsRouteLink}
                resourceGetter={props.contentGetter? props.contentGetter: contentGetter}
                BreadCrumbComponent={BreadCrumbRouteLink}
            />
        </>
    )
}
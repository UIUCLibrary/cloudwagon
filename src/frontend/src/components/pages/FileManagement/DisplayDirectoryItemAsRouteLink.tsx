import {IFileNode} from "./FileManagment.types.ts";
import {ReactElement} from "react";
import {Link as RouterLink} from "react-router-dom";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import Folder from "@mui/icons-material/Folder";

export const getNodeIcon = (file: IFileNode)=>{
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
export const getDisplay = (file: IFileNode): string => {
    if (file.type === "Directory") {
        switch (file.name) {
            case "..":
            case ".":
                return file.name
        }
        return `${file.name}/`
    }
    return file.name
}

export const getUrl = (file: IFileNode): string => {
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

export default function DisplayDirectoryItemAsRouteLink(props: DisplayItem2Props){
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

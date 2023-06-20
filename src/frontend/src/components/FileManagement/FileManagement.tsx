import {useEffect, useState} from "react";
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Folder from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import IconButton  from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar';
import MenuItem from '@mui/material/MenuItem';
import AppBar from '@mui/material/AppBar';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {AddFilesDialog, ConfirmRemovalFiles} from '../dialogs';
import {useDirectoryContents, useUploadFiles} from '../apiHooks';
import axios from "axios";

import {
    IFileNode,
    IAPIRequest,
} from './FileManagment.types';
import {IRoute} from '../widgets'

export const splitRoutes = (pwd: string | null): IRoute[] =>{
    if (!pwd){
        return [];
    }
    const components: IRoute[] = [
        {
            display: '/',
            path: '/'
        }
    ];
    const root = ['']
    for (const x of pwd.trim().split('/').filter(element => element)){
        components.push(
            {
                display: x,
                path: root.concat([x]).join('/')
            }
        )
        root.push(x);
    }
    return components;
}
const removeAllFiles = ()=>{
    return axios.delete('/api/files')
}
export default function FileManagement(){
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<IFileNode[]|null>(null);
    const [data, setData] = useState<IAPIRequest|null>(null);
    const [addFilesDialogOpen, setAddFilesDialogOpen] = useState<boolean>(false);
    const [removeFilesDialogOpen, setRemoveFilesDialogOpen] = useState<boolean>(false);
    const [breadCrumbRoutes, setBreadCrumbRoutes] = useState<IRoute[]>([
        {display: 'Root', path:'/'}
    ])
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [pwd, setPwd] = useState(searchParams.get('path') ? searchParams.get('path'): '/')
    const directoryContentsHook = useDirectoryContents(pwd);
    const uploadFilesHook = useUploadFiles(pwd);
    useEffect(()=>{
        console.log(directoryContentsHook.contents);
        setFiles(directoryContentsHook.contents)
    }, [directoryContentsHook])
    useEffect(()=>{
        const newUrl = `./?path=${pwd}`
        navigate(newUrl)
    }, [navigate, pwd])
    const handleAddNewFiles = (accept: boolean, files?: FileList|null) =>{
        setAddFilesDialogOpen(false)
            if(files) {
                uploadFilesHook.upload(Array.from(files))
                    .finally(()=> {
                        directoryContentsHook.refresh()
                    });
            }
    }
    const handleRemoveFiles = (accept: boolean) =>{
        setRemoveFilesDialogOpen(false)
        if(accept){
            removeAllFiles().then((result) => {
                setData(result.data)
            }).finally(()=> {
                directoryContentsHook.refresh()
            })
        }
    }
    const sortByType = ((a:IFileNode, b:IFileNode) =>{
        if (a.type < b.type){
            return -1;
        }
        return 1;

    })
    useEffect(()=>{
        if(data === null){
            setFiles(null)
        } else {
            try {
                setFiles([...data.contents].sort(sortByType));

            } catch (e) {
                setError('failed')
            }
        }
    },[data])
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
    const getDisplayName = (file: IFileNode) =>{
        if (file.type === "Directory"){
            const outputPath = file.name === ".."? file.name :  `${file.name}/`
            const fullpath = `${pwd}/${outputPath}`
            const linkUrl = `./?path=${encodeURI(fullpath)}`
            return (
                <Link
                    onClick={()=> {setPwd(file.path);}}
                    to={linkUrl}
                    style={{textDecoration: 'none',}}
                >
                    {outputPath}
                </Link>)
        }
        return file.name;
    }
    const n = 8
    const loadingSkeleton = [...Array(n)].map((value, index)=> (
        <Stack key={index} direction="row" spacing={2}>
            <Skeleton animation="wave" variant="circular" width={40} height={40} />
            <Skeleton animation="wave"  height={40} width="100%" style={{ marginBottom: 6 }}/>
        </Stack>
    ))
    const listOfFiles = files? files.map((file, index) =>{
        return <ListItem key={index}>
            <ListItemIcon>{getNodeIcon(file)}</ListItemIcon>
            <ListItemText>{getDisplayName(file)}</ListItemText>
        </ListItem>
    }): '';

    const breadCrumbComponents = breadCrumbRoutes.map(value => {
        const linkUrl = `/manageFiles/?path=${value.path}`;
        return (
            <Link
                key={value.path}
                to={linkUrl}
                style={{textDecoration: 'none'}}
                onClick={()=> {setPwd(value.path)}}
            >{value.display}</Link>
        )
    })

    const errorBlock = (
        <Collapse in={!!error}>
            <Alert
                severity="error"
                action={
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => {
                            setError(null);
                        }}
                    >
                        <CloseIcon fontSize="inherit" />
                    </IconButton>
                }
                sx={{ mb: 2 }}

            >
                <AlertTitle>Error</AlertTitle>
                {error?.toString()}
            </Alert>
        </Collapse>
    );
    return (
        <>
            <AddFilesDialog open={addFilesDialogOpen} onSetClose={handleAddNewFiles}/>
            <ConfirmRemovalFiles open={removeFilesDialogOpen} onSetClose={handleRemoveFiles}/>
            <AppBar position="static">
                <Toolbar>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ flexGrow: 1 }}>
                        {breadCrumbComponents}
                    </Breadcrumbs>
                    <MenuItem
                        onClick={()=>{setAddFilesDialogOpen(true) }}
                    >Add Files</MenuItem>
                    <MenuItem onClick={()=>{setRemoveFilesDialogOpen(true)}}>Remove All Files</MenuItem>
                </Toolbar>
            </AppBar>
            {errorBlock}
            <List>
                {loading ? loadingSkeleton : listOfFiles}
            </List>
        </>
    )
}
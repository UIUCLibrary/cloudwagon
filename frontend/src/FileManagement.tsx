import {useEffect, useState} from "react";
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Breadcrumbs from '@mui/material/Breadcrumbs'
import {Alert, AlertTitle} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import {Folder, FilePresent} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton  from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar';
import MenuItem from '@mui/material/MenuItem';
import AppBar from '@mui/material/AppBar';
import {Link, NavLink, useNavigate, useSearchParams} from 'react-router-dom';
import {AddFilesDialog, ConfirmRemovalFiles} from './FilesDialog'
import axios from "axios";
interface IFileNode{
    name: string
    path: string
    type: string
    size: number | null
}

interface IAPIRequest{
    // files: IFile[]
    contents: IFileNode[]
}

export interface IRoute{
  display: string
  path: string
}
export const splitRoutes = (pwd: string | null): IRoute[] =>{
    if (!pwd){
        return [];
    }
    let components: IRoute[] = [
        {
            display: '/',
            path: '/'
        }
    ];
    let root = ['']
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

export default function FileManagement(){
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<IFileNode[]|null>(null);
    const [data, setData] = useState<IAPIRequest|null>(null);
    const [dataIsValid, setDataIsValid] = useState<boolean>(false)
    const [addFilesDialogOpen, setAddFilesDialogOpen] = useState<boolean>(false);
    const [removeFilesDialogOpen, setRemoveFilesDialogOpen] = useState<boolean>(false);
    const [breadCrumbRoutes, setBreadCrumbRoutes] = useState<IRoute[]>([
        {display: 'Root', path:'/'}
    ])

    let [searchParams] = useSearchParams();
    let navigate = useNavigate();
    const [pwd, setPwd] = useState(searchParams.get('path') ? searchParams.get('path'): '/')
    useEffect(()=>{
        const newUrl = `./?path=${pwd}`
        console.log(`changing url to ${newUrl}`)
        navigate(newUrl)

    }, [navigate, pwd])
    const handleAddNewFiles = (accept: boolean, files?: FileList|null) =>{
        setAddFilesDialogOpen(false)
            if(files) {
                const formData = new FormData();
                for (const file of Array.from(files)) {
                    formData.append("files", file, file.name);
                }
                axios.post(`/api/files?path=${pwd}`, formData).then(()=>{setDataIsValid(false)});
            }
        setDataIsValid(false);
    }
    const handleRemoveFiles = (accept: boolean) =>{
        console.log(accept)
        setRemoveFilesDialogOpen(false)
        if(accept){
            axios.delete('/api/files').then((result) => {
                console.log(result.data);
                setData(result.data)
                setDataIsValid(false)
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
        if(!dataIsValid){
            const path = pwd ? pwd: '/';
            setLoading(true)
            axios.get(`/api/files?path=${encodeURI(path)}`)
                .then((result) => {
                    setData(result.data)
                    setError(null);
                    setDataIsValid(true)
                    const newPath = result.data.path;
                    setBreadCrumbRoutes(splitRoutes(newPath))
                    setPwd(newPath)
                })
                .catch((e)=>{
                    setError(e.toString());
                    setBreadCrumbRoutes(splitRoutes('/'))
                    setPwd(pwd)
                    console.error(e);
                })
                .finally(()=>{
                  setLoading(false);
                })
        }
    }, [pwd, dataIsValid])
    useEffect(()=>{
        if(!data){
            setFiles(null)
        } else {
            setFiles([...data.contents].sort(sortByType));
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
                    onClick={()=> {
                        setPwd(file.path);
                        setDataIsValid(false);
                    }}
                    to={linkUrl}
                    style={{textDecoration: 'none',}}
                >
                    {outputPath}
                </Link>)
        }
        return file.name;
    }
    const n = 8
    const loadingSkeleton = [...Array(n)].map((value, index, array)=> (
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
                onClick={()=> {
                    setPwd(value.path)
                    setDataIsValid(false)}}
            >{value.display}</Link>
        )
    });

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
                        onClick={(event)=>{setAddFilesDialogOpen(true) }}
                    >Add Files</MenuItem>
                    <MenuItem onClick={(event)=>{setRemoveFilesDialogOpen(true)}}>Remove All Files</MenuItem>
                </Toolbar>
            </AppBar>
            {errorBlock}
            <List>
                {loading ? loadingSkeleton : listOfFiles}
            </List>
        </>
    )
}
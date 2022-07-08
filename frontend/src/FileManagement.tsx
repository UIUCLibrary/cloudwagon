import {useEffect, useState} from "react";
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Toolbar from '@mui/material/Toolbar';
import MenuItem from '@mui/material/MenuItem';
import AppBar from '@mui/material/AppBar';
import {AddFilesDialog, ConfirmRemovalFiles} from './FilesDialog'
import axios from "axios";
interface IFile{
    name: string
}

interface IAPIRequest{
    files: IFile[]
}
export default function FileManagement(){
    const [files, setFiles] = useState<IFile[]|null>(null);
    const [data, setData] = useState<IAPIRequest|null>(null);
    const [dataIsValid, setDataIsValid] = useState<boolean>(false)
    const [addFilesDialogOpen, setAddFilesDialogOpen] = useState<boolean>(false);
    const [removeFilesDialogOpen, setRemoveFilesDialogOpen] = useState<boolean>(false);

    const handleAddNewFiles = (accept: boolean, files?: FileList|null) =>{
        console.log(accept)
        setAddFilesDialogOpen(false)
        console.log(files)
            if(files) {
                const formData = new FormData();
                for (const file of Array.from(files)) {
                    formData.append("files", file, file.name);
                }
                axios.post('/api/files', formData).then(()=>{setDataIsValid(false)});
            }
        // }
        setDataIsValid(false);
    }
    const handleRemoveFiles = (accept: boolean) =>{
        console.log(accept)
        setRemoveFilesDialogOpen(false)
        if(accept){
            axios.delete('/api/files').then((result) => {
                setData(result.data)
                setDataIsValid(false)
            })
        }
    }

    useEffect(()=>{
        if(!dataIsValid){
            axios.get('/api/files').then((result) => {
              setData(result.data)
              setDataIsValid(true)
          })
        }
    }, [dataIsValid])
    useEffect(()=>{
        if(!data){
            setFiles(null)
        } else {
            setFiles(data.files)
        }
    },[data])
    const listOfFiles = files? files.map((file, index) =>{
        return <ListItem key={index}>
            <ListItemIcon>
                <InsertDriveFileIcon/>
            </ListItemIcon>
            <ListItemText>
                {file.name}
            </ListItemText>
        </ListItem>
    }): "Loading"
    return (
        <>
            <AddFilesDialog open={addFilesDialogOpen} onSetClose={handleAddNewFiles}/>
            <ConfirmRemovalFiles open={removeFilesDialogOpen} onSetClose={handleRemoveFiles}/>
            <AppBar position="static">
                <Toolbar disableGutters>
                    <MenuItem
                        onClick={(event)=>{setAddFilesDialogOpen(true) }}
                    >Add Files</MenuItem>
                    <MenuItem onClick={(event)=>{setRemoveFilesDialogOpen(true)}}>Remove All Files</MenuItem>
                </Toolbar>
            </AppBar>
            <List>
                {listOfFiles}
            </List>
        </>
    )
}
import Dialog from "@mui/material/Dialog";
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {Input} from "@mui/material";

import {useEffect, useRef, useState} from "react";
interface IDialog{
    open?: boolean
    onSetClose?: (accept: boolean, files?: FileList|null)=>void;

}
export function AddFilesDialog(props: IDialog){
    const [open, setOpen] = useState(props.open ? props.open : false)
    const form = useRef<HTMLInputElement>()
    const handleClose = (accepted: boolean) => {
        setOpen(false);
        if(props.onSetClose){
            const files = form.current?.files
            props.onSetClose(accepted, files? files: null)
        }
    }
    useEffect(()=>{
        if (props.open){
            setOpen(props.open )
        }
    }, [props.open])
    return(
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Add Files</DialogTitle>
            <form>
                <DialogContent>
                    <DialogContentText>
                        <Input inputRef={form} type="file" inputProps={{ multiple: true }}/>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>{handleClose(false)}}>Cancel</Button>
                    <Button onClick={()=>{handleClose(true)}}>Add</Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export const ConfirmRemovalFiles = (props: IDialog)=>{
    const [open, setOpen] = useState(props.open ? props.open : false)
    const handleClose = (accepted: boolean) => {
        setOpen(false);
        if(props.onSetClose){
            props.onSetClose(accepted)
        }
    }
    useEffect(()=>{
        if (props.open){
            setOpen(props.open )
        }
    }, [props.open])
    return <Dialog open={open}>
        <DialogTitle>Remove all files</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Are you sure you want to remove all files?
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={()=>{handleClose(true)}}>Yes</Button>
            <Button onClick={()=>{handleClose(false)}}>No</Button>
        </DialogActions>
    </Dialog>
}

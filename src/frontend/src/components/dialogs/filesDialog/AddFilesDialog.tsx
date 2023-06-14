import {useEffect, useRef, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import {Input} from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {IDialog} from './fileDialog.types';
export default function AddFilesDialog(props: IDialog){
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
// import Dialog from "@mui/material/Dialog";
// import DialogTitle from '@mui/material/DialogTitle'
// import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText';
// import DialogActions from '@mui/material/DialogActions';
// import Button from '@mui/material/Button';
// import {IDialog} from './fileDialog.types';
//
// import {useEffect, useState} from "react";
//
// export const ConfirmRemovalFiles = (props: IDialog)=>{
//     const [open, setOpen] = useState(props.open ? props.open : false)
//     const handleClose = (accepted: boolean) => {
//         setOpen(false);
//         if(props.onSetClose){
//             props.onSetClose(accepted)
//         }
//     }
//     useEffect(()=>{
//         if (props.open){
//             setOpen(props.open )
//         }
//     }, [props.open])
//     return <Dialog open={open}>
//         <DialogTitle>Remove all files</DialogTitle>
//         <DialogContent>
//             <DialogContentText>
//                 Are you sure you want to remove all files?
//             </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//             <Button onClick={()=>{handleClose(true)}}>Yes</Button>
//             <Button onClick={()=>{handleClose(false)}}>No</Button>
//         </DialogActions>
//     </Dialog>
// }

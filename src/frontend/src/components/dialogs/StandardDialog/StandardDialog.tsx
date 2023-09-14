import {PropsWithChildren} from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import {AppDialogBoxProps} from './StandardDialog.types.tsx'

export default function StandardDialog(props: PropsWithChildren<AppDialogBoxProps>) {
    const handelClose = () => {
        if (props.onClose) {
            props.onClose();
        }
    }
    return (<>
            <Dialog open={props.open} fullWidth={true}
                    maxWidth={'lg'}
                    PaperProps={{style: {borderRadius: 10}}}>
                <DialogTitle>{props.title}</DialogTitle>
                <DialogContent>
                    {props.children}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handelClose}>close</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
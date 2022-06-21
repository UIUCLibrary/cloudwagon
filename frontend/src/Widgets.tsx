import React, {FC, useState} from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select"
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    InputAdornment,
    TextField,
    Checkbox, FormControlLabel
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InputLabel from "@mui/material/InputLabel";
import FileOpenIcon from '@mui/icons-material/FileOpen';

interface APIWidgetData {
    label: string
}

export const SelectOption: FC<APIWidgetData> = ({label}) => {
    return(
        <FormControl fullWidth sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-label">{label}</InputLabel>
            <Select label={label}></Select>
        </FormControl>
    )
}
export const CheckBoxOption: FC<APIWidgetData> = ({label}) => {
    return (
        <FormControl fullWidth sx={{ m: 1, minWidth: 120 }}>
            <FormControlLabel control={<Checkbox></Checkbox>} label={label}/>
        </FormControl>
        )
}

export const DirectorySelect: FC<APIWidgetData> = ({label}) => {
    const [openDialogBox, setOpenDialogBox] = useState(false)
    const handleClose = () => {
        setOpenDialogBox(false)
    }
    const handleMouseDown = () => {
        console.log('clicky');
        setOpenDialogBox(true)
    }
    return (
        <FormControl fullWidth sx={{ m: 1, minWidth: 120 }}>
            <Dialog open={openDialogBox}>
                <DialogTitle id="alert-dialog-title">
                    {"Select a directory"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>Do something here</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Accept</Button>
                    <Button onClick={handleClose} autoFocus>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
            <TextField
                label={label}
                InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">
                        <IconButton
                            onMouseDown={handleMouseDown}
                        ><FolderIcon/></IconButton>
                    </InputAdornment>
                }}>

            </TextField>

        </FormControl>
    )
};

export const FileSelect: FC<APIWidgetData> = ({label}) => {
    const [openDialogBox, setOpenDialogBox] = useState(false)
    const handleClose = () => {
        setOpenDialogBox(false)
    }
    const handleMouseDown = () => {
        console.log('clicky');
        setOpenDialogBox(true)
    }
    return (
        <FormControl fullWidth sx={{ m: 1, minWidth: 120 }}>
        <Dialog open={openDialogBox}>
                <DialogTitle id="alert-dialog-title">
                    {"Select a file"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>Do something here</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Accept</Button>
                    <Button onClick={handleClose} autoFocus>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
            <TextField
                label={label}
                InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">
                        <IconButton
                            onMouseDown={handleMouseDown}
                        ><FileOpenIcon/></IconButton>
                    </InputAdornment>
                }}>

            </TextField>

        </FormControl>
    )
};
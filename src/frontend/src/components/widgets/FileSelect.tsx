import {forwardRef, Ref, useRef, useState} from 'react';
import {
    IDirectorySelect,
    SelectionRef
} from './Widgets.types';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import {
    FileSelectDialog
} from '../dialogs/FileSelectDialog/FileSelectDialog.tsx';
import {TextFieldProps} from '@mui/material/TextField/TextField';


export const FileSelect = forwardRef(
    (
        {label, onRejected, fetchingFunction, onAccepted, required}: IDirectorySelect,
        ref: Ref<SelectionRef>) => {
        const [openDialogBox, setOpenDialogBox] = useState(false)
        const textBoxRef = useRef<TextFieldProps>(null);
        const [browsePath, setBrowsePath] = useState<null | string>('/');
        const [value, setValue] = useState('')
        const handleClose = () => {
            setOpenDialogBox(false)
        }
        const handleMouseDown = () => {
            setOpenDialogBox(true)
        }
        const handleAccepted = (value: string) => {
            setValue(value)
            setBrowsePath(value)
            if (onAccepted) {
                onAccepted(value)
            }
        }
        return (
            <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
                <FileSelectDialog
                    show={openDialogBox}
                    startingPath={browsePath}
                    fetchingFunction={fetchingFunction}
                    onAccepted={handleAccepted}
                    onRejected={onRejected}
                    onClose={handleClose}
                />
                <TextField
                    required={required}
                    name={label}
                    inputRef={textBoxRef}
                    label={label}
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value)
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onMouseDown={handleMouseDown}>
                                    <FileOpenIcon/>
                                </IconButton>
                            </InputAdornment>
                        )
                    }}>
                </TextField>
            </FormControl>
        )
    });
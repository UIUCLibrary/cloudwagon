import {forwardRef, Ref, useRef, useState} from 'react';
import {TextFieldProps} from '@mui/material/TextField/TextField';
import FormControl from '@mui/material/FormControl';
import {
    DirectorySelectDialog,
} from '../../dialogs/DirectorySelectDialog';
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import FolderIcon from '@mui/icons-material/Folder';
import {
    SelectionRef,
    IDirectorySelect,
} from '../Widgets.types';
import {FileSystemSelectDialogRef} from "../../dialogs/FileSystemSelectDialog";

export const DirectorySelect = forwardRef(
    (
        {label, onRejected, fetchingFunction, onAccepted, required}: IDirectorySelect,
        ref: Ref<SelectionRef>) => {
        const dialogBoxRef = useRef<FileSystemSelectDialogRef>(null);
        const textBoxRef = useRef<TextFieldProps>(null);
        const [openDialogBox, setOpenDialogBox] = useState(false)
        const [value, setValue] = useState('')
        const [browsePath, setBrowsePath] = useState<null | string>(value ? value : '/');

        const handleMouseDown = () => {
            setBrowsePath(value ? value : '/')
            setOpenDialogBox(true)
        }

        const handleOnRejected = () => {
            if (onRejected) {
                onRejected()
            }
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
                <DirectorySelectDialog
                    ref={dialogBoxRef}
                    startingPath={browsePath}
                    show={openDialogBox}
                    fetchingFunction={fetchingFunction}
                    onAccepted={handleAccepted}
                    onRejected={handleOnRejected}
                    onClose={() => {
                        setOpenDialogBox(false)
                    }}
                />
                <TextField
                    required={required}
                    inputRef={textBoxRef}
                    label={label}
                    name={label}
                    onChange={(event) => {
                        setValue(event.target.value)
                    }}
                    value={value}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton aria-label="browse" onClick={handleMouseDown}>
                                    <FolderIcon/>
                                </IconButton>
                            </InputAdornment>
                        )
                    }}>

                </TextField>

            </FormControl>
        )
    });
DirectorySelect.displayName = 'DirectorySelect';

import {forwardRef, Ref, useRef, useState} from 'react';
import {TextFieldProps} from '@mui/material/TextField/TextField';
import FormControl from '@mui/material/FormControl';
import {DirectorySelectDialog, DirectorySelectDialogRef} from '../../dialogs/DirectorySelectDialog';
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import FolderIcon from '@mui/icons-material/Folder';
import {SelectionRef, IDirectorySelect} from '../Widgets.types';

export const DirectorySelect = forwardRef(
    (
        {label, onRejected, getDataHook, onAccepted, onReady, required}: IDirectorySelect,
        ref: Ref<SelectionRef>) => {
      const dialogBoxRef = useRef<DirectorySelectDialogRef>(null);
      const textBoxRef = useRef<TextFieldProps>(null);
      const [openDialogBox, setOpenDialogBox] = useState(false)
      const [browsePath, setBrowsePath] = useState<null | string>(null);
      const [value, setValue] = useState('')
      const handleMouseDown = () => {
        setBrowsePath(value ? value : '/')
        setOpenDialogBox(true)
      }
      const handleAccepted = (value: string) => {
        setValue(value)
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
                getDataHook={getDataHook}
                onAccepted={handleAccepted}
                onRejected={onRejected}
                onReady={onReady}
                onClose={() => setOpenDialogBox(false)}
            />
            <TextField
                required={required}
                inputRef={textBoxRef}
                label={label}
                onChange={(event) => {
                  setValue(event.target.value)
                }}
                value={value}
                InputProps={{
                  endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label="browse"
                                    onClick={handleMouseDown}>
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

import {FC, useState} from 'react';
import {APIWidgetData} from './Widgets.types';
import FormControl from '@mui/material/FormControl';
import {
  Button,
  Dialog, DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle, IconButton, InputAdornment, TextField
} from '@mui/material';
import FileOpenIcon from '@mui/icons-material/FileOpen';

export const FileSelect: FC<APIWidgetData> = ({label, required}) => {
  const [openDialogBox, setOpenDialogBox] = useState(false)
  const handleClose = () => {
    setOpenDialogBox(false)
  }
  const handleMouseDown = () => {
    setOpenDialogBox(true)
  }
  return (
      <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        <Dialog open={openDialogBox}>
          <DialogTitle id="alert-dialog-title">
            {"Select a file"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>Do something here</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Accept</Button>
            <Button aria-label="cancel" onClick={handleClose} autoFocus>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
        <TextField
            required={required}
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
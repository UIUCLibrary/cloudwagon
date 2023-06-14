import {NewDirectoryDialogProps} from './NewDirectoryDialog.types';
import {KeyboardEventHandler, useRef, useState} from 'react';
import {TextFieldProps} from '@mui/material/TextField/TextField';
import Zoom from '@mui/material/Zoom';
import {
  Alert,
  AlertTitle, Backdrop, Button, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle,
  IconButton, TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const NewDirectoryDialog = (props: NewDirectoryDialogProps) => {
  const {onClose, onCreate, open, path, ...other} = props;
  const [isLoading, setIsLoading] = useState(false)
  const [changesMade, setChangesMade] = useState(false)
  const [error, setError] = useState('')
  const text = useRef<TextFieldProps>(null)
  const [isValid, setIsValid] = useState(false)
  const handleClose = () => {
    setError('')
    if (onClose) {
      onClose({serverDataChanged: changesMade});
    }
    setIsValid(false)
  }
  const handleAccept = () => {
    if (onCreate) {
      setIsLoading(true)
      if (text.current) {
        onCreate(text.current.value as string, path)
            .then(() => {
              setChangesMade(true)
              handleClose()
            })
            .catch((e) => {
              setError(e.toString())
            })
            .finally(() => {
              setIsLoading(false)
            })
      }
    }
  }

  const handleKeyboard: KeyboardEventHandler = (event) => {
    if (event.key === 'Enter') {
      handleAccept()
    }
  }
  const handleChange = () => {
    if (text.current?.value === '') {
      setIsValid(false);
    } else {
      setIsValid(true)
    }
  }
  const errorElement = error ?
      <Zoom in={true}>
        <Alert
            severity="error"
            action={
              <IconButton
                  aria-label={"close"}
                  size={'small'}
                  onClick={() => {
                    setError('')
                  }
                  }>
                <CloseIcon fontSize={"inherit"}/>
              </IconButton>
            }
        >
          <AlertTitle>Error</AlertTitle>{error}
        </Alert>
      </Zoom>
      :
      <></>
  return (
      <Dialog
          id='createNewDirectoryDialog'
          open={open}
          fullWidth={true}
          maxWidth={'xs'}
      >
        <DialogTitle>New Directory</DialogTitle>
        <DialogContent style={{overflow: "hidden"}}>
          <TextField
              autoFocus
              margin={'dense'}
              id={"name"}
              inputRef={text}
              onChange={handleChange}
              onKeyDown={handleKeyboard}
              label={'Name'}
              fullWidth
              variant={'standard'}
          />
          <DialogContentText>

            {errorElement}
          </DialogContentText>
          <Backdrop open={isLoading}>
            <CircularProgress/>
          </Backdrop>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAccept} disabled={!isValid}>Ok</Button>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>

      </Dialog>
  )
}
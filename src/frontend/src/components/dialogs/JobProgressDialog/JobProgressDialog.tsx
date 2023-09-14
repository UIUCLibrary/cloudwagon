import DialogContentText from '@mui/material/DialogContentText';
import Box from '@mui/material/Box'
import LinearProgress, {
  LinearProgressProps
} from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState} from 'react';
import {IJobProgressDialog} from './JobProgressDialog.types';
import {StandardDialog} from '../StandardDialog';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
      <Box sx={{display: 'flex', alignItems: 'center'}}>
        <Box sx={{width: '100%', mr: 1}}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{minWidth: 35}}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
              props.value,
          )}%`}</Typography>
        </Box>
      </Box>
  );
}
interface IJobProgressDialogInner {
    log?: string,
    progress: number | null
}
function JobProgressDialogInner({log, progress}: IJobProgressDialogInner){
    const terminal = useRef<HTMLTextAreaElement>(null);
    const progressBar = progress != null ?
        <LinearProgressWithLabel value={progress}/>
        : <></>
        // : <LinearProgress/>
    return (
        <>
            <Box sx={{
                width: '100%',
            }}>
            {progressBar}
            </Box>
            <Box>
                <TextField
                    value={log}
                    inputRef={terminal}
                    fullWidth={true}
                    minRows={8}
                    maxRows={8}
                    InputProps={{
                        readOnly: true,
                    }}
                    multiline
                    variant="filled"
                />
            </Box>
        </>
    )
}

export default function JobProgressDialog(
    {
        title,
        logs,
        show,
        progress,
        currentTaskDescription,
        onClose,
    }: IJobProgressDialog) {
  const [showDialog, setShowDialog] = useState(show)
  useEffect(() => {
    setShowDialog(show)
  }, [show])

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setShowDialog(false)
  }
  
  return (
      <StandardDialog title={title} open={showDialog} onClose={handleClose}>
          <DialogContentText >{currentTaskDescription ?? ''}</DialogContentText>
          <JobProgressDialogInner progress={progress} log={logs}/>
      </StandardDialog>
  )
}
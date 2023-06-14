import Dialog from "@mui/material/Dialog";
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress, {
  LinearProgressProps
} from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography';
import {useEffect, useRef, useState} from 'react';
import {IJobProgressDialog} from './JobProgressDialog.types';
import {useWebSocketStream, StreamApiData} from '../../dataStream';
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

export default function JobProgressDialog({
                                            title,
                                            // streamUrlSSE,
                                            show,
                                            streamUrlWS,
                                            onClose
                                          }: IJobProgressDialog) {
  const [showDialog, setShowDialog] = useState(show)
  const [cancel, setCancel] = useState(false)
  const [data, streamOpen, setAbort] = useWebSocketStream(streamUrlWS);
  const [currentTaskDescription, setCurrentTaskDescription] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const terminal = useRef<HTMLTextAreaElement>();
  useEffect(() => {
    setShowDialog(show)
  }, [show])
  useEffect(() => {
    if (terminal.current) {
      if (data) {
        const logLines = data.map(
            (packet) => {

              return packet['log'] ? packet['log'] : null
            }
        )

        const diff = terminal.current.scrollHeight - terminal.current.scrollTop
        terminal.current.value = logLines.filter(Boolean).join('\n');
        if (diff < 200) {
          terminal.current.scrollTo({top: terminal.current.scrollHeight});
        }
        const current_data: StreamApiData = data[data.length - 1]
        if (current_data) {
          if (current_data['progress']) {
            setProgress(current_data['progress'] * 100);
          }
          if (current_data['task']) {
            setCurrentTaskDescription(current_data['task']);
          }
        }
      }
    }
  }, [data, streamOpen, progress])
  useEffect(()=>{
    console.log("cancel changed")
    if (cancel){
      setProgress(0)
    }
  }, [cancel, data])
  const progressBar = progress != null ?
      <LinearProgressWithLabel value={progress}/>
      : <LinearProgress/>
  const handleCancel = () => {
    console.log("Cancle")
    setCancel(true)
    setAbort(true)
  }
  const handelClose = () => {
    if (onClose) {
      onClose();
    }
    setProgress(0);
  }
  return (
      <Dialog open={showDialog} fullWidth={true}
              PaperProps={{style: {borderRadius: 10}}}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{currentTaskDescription ? currentTaskDescription : ''}</DialogContentText>
          <Box sx={{
            width: '100%',
          }}>
            {progressBar}
          </Box>
          <Box>
            <TextField
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handelClose} disabled={streamOpen}>
            close
          </Button>
          <Button color='error' onClick={handleCancel} disabled={!streamOpen}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
  )
}
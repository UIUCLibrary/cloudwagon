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

async function* decodeStream(stream: AsyncIterable<Uint8Array>) {
  const decoder = new TextDecoder('utf-8');
  for await (const buffer of stream) {
    const chunk = decoder.decode(buffer);

    try {
      const packet = JSON.parse(chunk)
      yield {data: packet, error: null}
    } catch (e: any) {
      yield {data: null, error: e.toString()}
    }
  }
}

export async function* asyncIterableFromStream<T>(stream: ReadableStreamReader<T>): AsyncIterable<T> {
  try {
    while (true) {
      const {done, value} = await stream.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    stream.releaseLock();
  }
}

interface JobStreamState {
  streamOpen: boolean,
  errors: string[]
  data: StreamApiData[]

}

const useJobStream = (streamHandleReader: ReadableStreamDefaultReader<Uint8Array> | null | undefined) => {
  const [state, setState] =
      useState<JobStreamState>({
            streamOpen: false,
            errors: [],
            data: [],
          }
      )
  const getData = async (reader: ReadableStreamDefaultReader) => {
    const streamIterator = asyncIterableFromStream(reader);
    let allData: StreamApiData[] = []
    let allErrors: string[] = []

    for await (const {data, error} of decodeStream(streamIterator)) {
      if (error) {
        allErrors = allErrors.concat(error)
      }

      if (data) {
        const unsortedData = allData.concat(data)
        allData = unsortedData.sort(
            (a, b) => {
              return a['order'] < b['order'] ? -1 : 1
            }
        )
      }

      setState(
          {
            streamOpen: true,
            errors: allErrors,
            data: allData,
          }
      )
    }
    setState(
        {
          streamOpen: false,
          errors: allErrors,
          data: allData,
        }
    )
  }
  useEffect(() => {
    if (streamHandleReader) {
      getData(streamHandleReader).then().catch();
    }
  }, [streamHandleReader]);
  return [state]
};

const useGetStreamHandle = (apiUrl?: string) => {
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader | null | undefined>(null)
  const fetchStream = async (url: string) => {
    const fetchedResource = await fetch(url)
    if (!fetchedResource.body) {
      return
    }
    return fetchedResource.body.getReader();
  }
  useEffect(() => {
    if (apiUrl) {
      fetchStream(apiUrl).then(setStreamReader).catch(console.error)
    }
  }, [apiUrl])
  return [streamReader]
}

interface StreamApiData {
  progress?: number
  order: number
  log?: string
  task?: string
}

interface IJobProgressDialog {
  streamUrl: string
  show: boolean
  onClose?: () => void
}

export default function JobProgressDialog({
                                            streamUrl,
                                            show,
                                            onClose
                                          }: IJobProgressDialog) {
  const [showDialog, setShowDialog] = useState(show)
  const [streamReader] = useGetStreamHandle(streamUrl);
  const [streamState] = useJobStream(streamReader);
  const [currentTask, setCurrentTask] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const terminal = useRef<HTMLTextAreaElement>();
  useEffect(() => {
    setShowDialog(show)
  }, [show])
  useEffect(() => {
    if (terminal.current) {
      const logLines = streamState.data.map(
          (packet) => {
            return packet['log'] ? `${packet['order']} ${packet['log']}` : null
          }
      )
      terminal.current.value = logLines.filter(Boolean).join('\n');
      if (terminal.current.scrollHeight - terminal.current.scrollTop < 200) {
        terminal.current.scrollTo({top: terminal.current.scrollHeight});
      }
      if (streamState.data) {
        const current_data: StreamApiData = streamState.data[streamState.data.length - 1]
        if (current_data) {
          if (current_data['progress']) {
            setProgress(current_data['progress'] * 100);
          }
          if (current_data['task']) {
            setCurrentTask(current_data['task']);
          }
        }
      }
    }
  }, [streamState.data])

  const progressBar = progress ?
      <LinearProgressWithLabel value={progress}/>
      : <LinearProgress/>
  const handelClose = () => {
    if (onClose) {
      onClose();
    }
    setProgress(0);
  }

  return (
      <Dialog open={showDialog} fullWidth={true}
              PaperProps={{style: {borderRadius: 10}}}>
        <DialogTitle>Running Job</DialogTitle>
        <DialogContent>
          <DialogContentText>{currentTask ? currentTask : ''}</DialogContentText>
          <Box sx={{width: '100%'}}>
            {progressBar}
          </Box>
          <Box>
            <TextField
                inputRef={terminal}
                fullWidth={true}
                minRows={4}
                maxRows={4}
                InputProps={{
                  readOnly: true,
                }}
                multiline
                variant="filled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handelClose} disabled={streamState.streamOpen}>
            close
          </Button>
          {/*<Button onClick={handleCancel} disabled={true}>*/}
          {/*  Cancel*/}
          {/*</Button>*/}
        </DialogActions>
      </Dialog>
  )
}
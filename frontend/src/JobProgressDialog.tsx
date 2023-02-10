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
    const chunk = decoder.decode(buffer, {stream: true});

    try {
      const packet = JSON.parse(chunk)
      yield {data: packet, error: null}
    } catch (e: unknown) {
      yield {data: null, error: e ? e.toString(): null}
    }
  }
}

export async function* asyncIterableFromStream<T>(stream: ReadableStreamDefaultReader<T>): AsyncIterable<T> {
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

// eslint-disable-next-line
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
// eslint-disable-next-line
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
  title: string,
  // streamUrlSSE: string
  streamUrlWS?: string
  show: boolean
  onClose?: () => void
}
// eslint-disable-next-line
const useSSEStream = (url: string):[StreamApiData[] | null, boolean] =>{
  const [eventSource, setEventSource] = useState<EventSource|null>(null);
  const [data, setData]= useState<StreamApiData[] | null>(null)
  const [streamOpen, setStreamOpen] = useState(false)
  useEffect(()=>{
    let ignore = false
    if (eventSource === null){
      if (!ignore){
        setEventSource(new EventSource(url));
        setStreamOpen(true)
      }
    }
    return () =>{
      ignore = true;
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    }
  // eslint-disable-next-line
  }, [url])
  if (eventSource) {
    eventSource.onmessage = function (event) {
      if(event.data) {
        if (event.data === 'done') {
          eventSource.close()
          setStreamOpen(false);
        } else {
          const newData = JSON.parse(event.data) as StreamApiData;
          setData(existingData => {
            if (existingData === null) {
              return [newData]
            } else {
              return existingData.concat(newData)
            }
          })
        }
        return data;
      }
      // } catch (e){
      //   console.error(e)
      //   console.error(event.data)
      //   throw e;
      // }
    }
    eventSource.onerror = (event) =>{
    // eventSource.onerror = (event) =>{
      console.error("EventSource failed:", event);

      eventSource.close();
    }
  }
  return [data, streamOpen];

}
const useWebSocketStream = (url: string| undefined):[StreamApiData[] | null, boolean, (value: boolean)=>void] =>{
  const [ws, setWs] = useState<WebSocket|null>(null);
  const [data, setData]= useState<StreamApiData[] | null>(null)
  const [streamOpen, setStreamOpen] = useState(false)
  const [abort, setAbort] = useState(false)
  useEffect(()=>{
    let ignore = false
    if (url) {
      if (ws === null){
        if (!ignore){
          setWs(new WebSocket(url));
          setStreamOpen(true)
        }
      }
    }

    return () =>{
      ignore = true;
      if (ws) {
        ws.close();
        setWs(null);
        setStreamOpen(false);
      }
    }
  // eslint-disable-next-line
  }, [url])
  if (!url){
    return [data, streamOpen, setAbort]
  }
  if (ws) {
    ws.onmessage = function(event) {
      const newData = JSON.parse(JSON.parse(event.data)) as StreamApiData;
      if (abort){
        ws.send('abort');
      } else {
        ws.send('ok');
      }
      setData(existingData =>{
        if (existingData === null){
          return [newData]
        } else {
          return  existingData.concat(newData)
        }
      })
    }
    ws.onerror = (event) =>{
      console.error("websocket failed:", event);
      ws.close();
    }
    ws.onclose = function (){
      setData(existingData =>{
        if (existingData) {
          return existingData.sort(
              (a, b) => {
                return a['order'] < b['order'] ? -1 : 1
              });
        }
        return existingData
      });
      setStreamOpen(false)
    }
  }
  return [data, streamOpen, setAbort]
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
 // const [data, streamOpen] = useSSEStream(streamUrlSSE);
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
              // return packet['log'] ? `${packet['order']} ${packet['log']}` : null
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
  // }, [streamState.data])
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
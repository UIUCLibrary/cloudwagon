import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import {FileSystemContentRef, FolderContentBrowser} from './FolderContentBrowser'
import {
  DirectoryDialogProps,
  DialogTitleBarProps,
  ISelectedItem,
  FileSystemDialogMenuBarProps,
} from './FileSystemSelectDialog.types';
import {
    forwardRef,
    PropsWithChildren,
    Ref,
    useEffect,
    useImperativeHandle,
    useRef,
    useState
} from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import {RefreshDirectoryAction} from './Actions.tsx';
import {IFile} from '../../widgets';

const DialogTitleBar = ({label, onCloseWindow}: DialogTitleBarProps) =>{
  return (
      <DialogTitle>
        {label}
        <IconButton
            aria-label="close"
            onClick={onCloseWindow}
            sx={{position: 'absolute', right: 8, top: 8}}>
          <CloseIcon/>
        </IconButton>
      </DialogTitle>
  )
}

export const DirectoryDialog = (
    {
      children,
      title,
      open,
      onClose,
      onAccepted,
      onRejected,
      selectionIsValid,
      selectionWidget
    }: PropsWithChildren<DirectoryDialogProps>) =>{
    const [acceptIsDisable, setAcceptIsDisable ] = useState(false)
    useEffect(()=>{
        switch (selectionIsValid) {
            case false:
                setAcceptIsDisable(true)
                break;
            case true:
                setAcceptIsDisable(false)
                break;
            case undefined:
                setAcceptIsDisable(false)
                break;
        }
    }, [selectionIsValid])
  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }
  const handleAccept = () => {
    handleClose();
    if (onAccepted) {
      onAccepted()
    }
  }
  const handelRejected = () => {
    handleClose();
    if (onRejected) {
      onRejected()
    }
  }
  return (
      <>
        <Dialog
            PaperProps={{style: {borderRadius: 10}}}
            open={open} fullWidth={true} maxWidth="md">
          <DialogTitleBar label={title} onCloseWindow={handleClose}/>
          <DialogContent style={{overflow: "hidden"}}>
            <Paper variant="outlined">
              <Box sx={{display: 'flex', pb: 1}}>
                <Box sx={{
                  flexGrow: 2,
                  borderColor: "text.disabled",
                  overflow: "hidden",
                  height: 500,
                  p: 1,
                  pb: 11
                }}>
                  {children ? children : undefined}
                </Box>
              </Box>
              {selectionWidget}
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button disabled={acceptIsDisable}
                    onClick={handleAccept}>Accept</Button>
            <Button onClick={handelRejected} autoFocus>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </>
  )
}
export const SelectedItem = ({label, value}: ISelectedItem) =>{
  return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 1,
        pr: 1
      }}>
        <Box sx={{mr: 2, ml: 2}}>{label}</Box>
        <Box aria-label={"selected path"} sx={{
          border: "2px inset",
          flexGrow: 1,
          pl: 1
        }}>{value}</Box>
      </Box>
  )
}

export const FileSystemDialogMenuBar = ({children, onRefresh}: FileSystemDialogMenuBarProps)=>{
  return (
      <>
        <AppBar
            sx={{style: {borderRadius: 10}}}
            position="static"
            color="inherit"
            variant={'outlined'}
            elevation={0}
        >
          <Toolbar variant="dense">
            <Box sx={{ flexGrow: 1 }}>
              <RefreshDirectoryAction onTriggered={onRefresh}/>
            </Box>
            {children}
          </Toolbar>
        </AppBar>
      </>
  )
}

const AllFileItemsAreValid = (item: IFile | null) => {
    return !!item;

}
interface FileSystemSelectDialogProps {
    title: string,
    cwd?: string,
    selectionLabel?: string
    show: boolean
    loading?: boolean
    folderContent?: IFile[]
    children?: JSX.Element | JSX.Element[] |  null
    onChangeCurrentPath?: (path: string) => void,
    onClose? : ()=>void
    onAccepted?: (item: IFile) => void
    onRejected?: ()=>void
    validItemFilter? : (item: IFile | null)=>boolean
}
export interface FileSystemSelectDialogRef {
    selectedItem: IFile | null
    selectedPath: string | null
    currentPath: string| null
}
export const FileSystemSelectDialog =  forwardRef((props: FileSystemSelectDialogProps, ref: Ref<FileSystemSelectDialogRef>) =>{
    const [cwd, setCwd] = useState<string | null>(props.cwd === undefined ? null : props.cwd)
    const [selectionText, setSelectionText] = useState<string | JSX.Element | null>(null)
    const [selectedItem, setSelectedItem] = useState<IFile | null>(null)
    const [selectionIsValid, setSelectionIsValid] = useState(true)
    const browserRef = useRef<FileSystemContentRef>(null)
    const fileSelectionFilter = props.validItemFilter? props.validItemFilter: AllFileItemsAreValid
    useEffect(() => {
        let displayText = <></>;
        if (selectedItem){
            if(cwd === selectedItem.path){
                displayText = <small><i>Current Directory:</i> "{selectedItem.path}"</small>
            } else {
                displayText = <>{selectedItem.name}</>
            }
        }
        setSelectionText(displayText)
    }, [selectedItem, cwd]);

    useEffect(() => {
        let path: string| null
        if (cwd === null){
            path = null
        } else {
            path = cwd
        }
        setSelectedItem({path: path, name: '', type: "Directory", size: null})
        }, [cwd]
    )
    useImperativeHandle(ref, ()=>{
        return {
            selectedItem: selectedItem,
            selectedPath: selectedItem ? selectedItem.path : null,
            currentPath: cwd
        }
    }, [selectedItem])

    useEffect(()=>{
        if(selectedItem && fileSelectionFilter){
            setSelectionIsValid(fileSelectionFilter(selectedItem))
        }
    }, [selectedItem, fileSelectionFilter])
    const handleClose = () => {
        setSelectedItem(null)
        setCwd(null)
        if (props.onClose) {
            props.onClose()
        }
    }
    const handleAccept = () => {
        handleClose();
        if (props.onAccepted){
            props.onAccepted(selectedItem)
        }
    }
    const handelRejected = () => {
        handleClose();
        if (props.onRejected) {
            props.onRejected()
        }
    }
    const handelBrowserClick = (item: IFile) =>{
        if (fileSelectionFilter(item)){
            setSelectedItem(item)
        }
    }
    const handelBrowserDblClick = (item: IFile) =>{
        if (item.type === "Directory"){
            if (props.onChangeCurrentPath){
                props.onChangeCurrentPath(item.path)
            }
            setSelectedItem(item)
        } else {
            if (fileSelectionFilter(item)){
                setSelectedItem(item)
            } else {
                console.log(`Browser Double: not valid ${JSON.stringify(item)}`)
            }
        }
    }
    return (
        <DirectoryDialog
            title={props.title}
            open={props.show}
            onClose={handleClose}
            onAccepted={handleAccept}
            onRejected={handelRejected}
            selectionIsValid={selectionIsValid}
            selectionWidget={
                <SelectedItem
                    label={props.selectionLabel ? props.selectionLabel : "Selection"}
                    value={selectionText}
                />}
        >
            {props.children}
            <FolderContentBrowser
                  folderContent={props.folderContent ? props.folderContent: []}
                  loading={props.loading !== undefined ? props.loading : false}
                  onClick={handelBrowserClick}
                  itemSelectionFilter={fileSelectionFilter}
                  onDoubleClick={handelBrowserDblClick}
                  ref={browserRef}
              />
        </DirectoryDialog>
    )
})

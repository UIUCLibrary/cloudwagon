import React, {
  FC,
  useState,
  useEffect,
  useImperativeHandle,
  useId, forwardRef, Ref, useRef, KeyboardEventHandler, useReducer,
} from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select"
import MenuItem from '@mui/material/MenuItem';
import {styled} from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';

import Link from '@mui/material/Link';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  CircularProgress,
  Backdrop,
  Alert,
  AlertTitle
} from "@mui/material";
import Zoom from '@mui/material/Zoom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridRowClassNameParams,
  GridValidRowModel
} from '@mui/x-data-grid';
import FolderIcon from "@mui/icons-material/Folder";
import InputLabel from "@mui/material/InputLabel";
import {splitRoutes} from './FileManagement';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileOutlinedIcon
  from '@mui/icons-material/InsertDriveFileOutlined';
import PortraitOutlinedIcon from '@mui/icons-material/PortraitOutlined';
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';

import {
  GridCellParams, GridRenderCellParams,
  GridValueFormatterParams
} from '@mui/x-data-grid/models/params/gridCellParams';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import axios, {AxiosResponse} from 'axios';
import {TextFieldProps} from '@mui/material/TextField/TextField';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';

interface IWidget {
  label: string
}

export interface APIWidgetData extends IWidget {

  parameters?: { [key: string]: any }
  onAccepted?: (value: string) => void
  onRejected?: () => void,
}

interface IChoiceSelection extends IWidget {
  placeholder_text?: string,
  selections: string[]

}

export interface IAPIDirectoryContents {
  path: string,
  contents: IFile[]
}

interface IDirectorySelect extends APIWidgetData {
  getDataHook: (path: string | null) => { data: IAPIDirectoryContents | null, error: string, loaded: boolean, update: () => void }
  onReady?: () => void
}

export const SelectOption: FC<APIWidgetData> = ({label, parameters}) => {
  const id = useId();
  if (!parameters) {
    return (
        <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        </FormControl>
    )
  }
  const params = parameters as IChoiceSelection;
  const options = params.selections.map(
      (option, index) => {
        return (
            <MenuItem key={index} value={option}>
              {option}
            </MenuItem>
        )
      }
  );

  return (
      <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        <InputLabel
            id={id}>{label}</InputLabel>
        <Select
            labelId={id}
            name={label} label={label} defaultValue='z'>{options}</Select>
      </FormControl>
  )
}
export const CheckBoxOption: FC<APIWidgetData> = ({label}) => {
  const [value, setValue] = useState(false);
  const checkbox = <>
    <Checkbox
        checked={value}
        value={value}
        onChange={() => {
          setValue(!value)
        }}
    />
    <input type="hidden" defaultChecked={true} value={value.toString()}
           name={label}/>
  </>
  return (
      <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        <FormControlLabel
            name={label}
            control={checkbox}
            label={label}/>
      </FormControl>
  )
}

export interface IFile {
  id: number
  size: number | null
  name: string
  type: string
  path: string
}

const StyledDataGrid = styled(DataGrid, {})({
  "&.MuiDataGrid-root": {
    ".MuiDataGrid-columnHeader:focus": {
      outline: 'none'
    },
    ".MuiDataGrid-columnHeader:focus-within": {
      outline: 'none'
    },
    ".MuiDataGrid-cell:focus": {
      outline: 'none'
    },
    ".MuiDataGrid-row.Mui-selected": {
      border: "1px solid grey"
    },
  },
})

interface IRoute {
  display: string
  path: string
}

interface IToolbar {
  selected: string | undefined | null
  setPwd: (pwd: string) => void
}

const CurrentPath: FC<IToolbar> = ({selected, setPwd}) => {
  const breadcrumbs = selected ? splitRoutes(selected).map((route: IRoute, index) => {
    return <Link
        key={index}
        underline="hover"
        color="inherit"
        href={"#"}
        onClick={() => {
          setPwd(route.path)
        }}>{route.display}</Link>
  }) : <></>
  return (
      <Box sx={{pb: 1, borderColor: 'text.disabled'}}>
        <Box aria-label={'working path'}
             sx={{pl: 1, minHeight: 28, border: "2px inset"}}>
          <Breadcrumbs separator={<NavigateNextIcon
              fontSize="small"/>}>{breadcrumbs}</Breadcrumbs>
        </Box>
      </Box>
  );
}

interface IDirectorySelectDialog {
  getDataHook: (path: string | null) => { data: IAPIDirectoryContents | null, error: string, loaded: boolean, update: ()=>void }
  startingPath?: string | null,
  defaultValue?: string,
  show: boolean
  onClose?: () => void
  onReady?: () => void
  onAccepted?: (path: string) => void
  onRejected?: () => void
}

interface DirectorySelectDialogRef {
  selectedPath: string | null
}

const fileSizeFormatter = (params: GridValueFormatterParams<number>) => {
  if (params.value == null) {
    return '';
  }
  return `${params.value} bytes`
}
const fileRowClass = (params: GridRowClassNameParams<GridValidRowModel>) => {
  if (params.row.type === "Directory") {
    return 'theme-selectable'
  }
  return ''
}
const fileCellClass = (params: GridCellParams<GridValidRowModel>) => {
  if (params.row.type === "File" && params.field === 'name') {
    return 'theme-disabled'
  }
  return ''
}

const fileOnDoubleClick = (
    params: GridRowParams<IFile>,
    loading: boolean,
    setSelection: (path: string) => void
) => {
  if (!loading) {
    if (params.row.type === "Directory") {
      setSelection(params.row.path);
    }
  }
}
const fileIsRowSelectable = (params: GridRowParams<GridValidRowModel>, loading: boolean): boolean => {
  if (loading) {
    return false;
  }
  if (params.row.type === "File") {
    return false;
  }
  return params.row.name !== "..";

}
const filesOnRowClick = (
    params: GridRowParams<IFile>,
    loading: boolean,
    setSelected: (path: string) => void
) => {
  if (!loading) {
    if (params.row.type === "Directory" && params.row.name !== "..") {
      setSelected(params.row.path);
    }

  }
}

const formatWithIcon = (params: GridRenderCellParams<any, any, any>) => {
  if (params.row.type === "Directory") {
    return <><FolderOutlinedIcon/><Box sx={{pl: 1}}>{params.value}</Box></>
  }
  if (params.row.type === "File") {
    const fileNameLowerCase = params.value.toLowerCase()
    if (
        fileNameLowerCase.endsWith('.jp2') ||
        fileNameLowerCase.endsWith('.tif') ||
        fileNameLowerCase.endsWith('.gif') ||
        fileNameLowerCase.endsWith('.jpg') ||
        fileNameLowerCase.endsWith('.jpeg')
    ) {
      return <><PortraitOutlinedIcon/><Box sx={{pl: 1}}>{params.value}</Box></>
    }
    if (params.value.endsWith('.txt')) {
      return <><TextSnippetOutlinedIcon/><Box
          sx={{pl: 1}}>{params.value}</Box></>
    }
    return <><InsertDriveFileOutlinedIcon/><Box
        sx={{pl: 1}}>{params.value}</Box></>
  }
  return params.value
}

interface NewDirectoryProps {
  open: boolean;
  path: string
  onClose?: (props: {serverDataChanged: boolean}) => void;
  onCreate?: (name: string, location: string) => Promise<AxiosResponse>;
}

export const NewDirectoryDialog = (props: NewDirectoryProps) => {
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

const DirectorySelectDialog = forwardRef((
    {
      startingPath,
      show,
      onClose,
      onAccepted,
      onRejected,
      onReady,
      getDataHook
    }: IDirectorySelectDialog,
    ref: Ref<DirectorySelectDialogRef>
) => {
  const [pwd, setPwd] = useState(startingPath)
  const [selectedPath, setSelectedPath] = useState(pwd)
  const [selectionIsValid, setSelectionIsValid] = useState(false)
  const directoryHook = useDirectory(pwd ? pwd : null, getDataHook)
  const [loading, setLoading] = useState(!directoryHook.loaded)
  const [files, setFiles] = useState<null | IFile[]>(null)
  const [openNewDirectoryDialog, setOpenNewDirectoryDialog] = useState(false)
  useEffect(() => {
    setLoading(!directoryHook.loaded)
    if (directoryHook.loaded) {
      if (onReady) {
        onReady()
      }
    }
  }, [directoryHook.loaded])

  useEffect(() => {
    setFiles(directoryHook.data)
  }, [directoryHook.data])

  useEffect(() => {
    setPwd(startingPath)
  }, [startingPath, show])
  useEffect(() => {
    setSelectedPath(pwd)
  }, [pwd])
  useEffect(() => {
    setSelectionIsValid(!!selectedPath)
  }, [selectedPath])
  const handleClose = () => {
    setPwd(undefined)
    setSelectedPath(undefined)
    if (onClose) {
      onClose()
    }
  }
  const handleAccept = () => {
    handleClose();
    if (onAccepted && selectedPath) {
      onAccepted(selectedPath)
    }
  }
  const handelRejected = () => {
    handleClose();
    if (onRejected) {
      onRejected()
    }
  }
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: "Name",
      headerClassName: 'dialog-header',
      flex: 0.5,
      minWidth: 250,
      editable: false,
      renderCell: formatWithIcon
      // valueFormatter: nameFormatter
    },
    {
      field: 'size',
      headerName: "Size",
      type: 'number',
      headerClassName: 'dialog-header',
      minWidth: 100,
      flex: 0.2,
      editable: false,
      valueFormatter: fileSizeFormatter,
    },
    {
      field: 'type',
      headerName: "Type",
      headerClassName: 'dialog-header',
      width: 150,
      editable: false,
    }
  ];
  useImperativeHandle(ref, () => (
      {
        selectedPath: selectedPath ? selectedPath : null
      }
  ), [selectedPath]);
  const handleNewFolderRequest = async (name: string, location: string) => {
    return axios.post(
        "/api/files/directory",
        {path: location, name: name}
    )
  }
  const handleRefreshPath = ()=> {
    directoryHook.refresh()
  }
  return (
      <Dialog
          PaperProps={{style: {borderRadius: 10}}}
          open={show} fullWidth={true} maxWidth="md">
        <DialogTitle>
          {"Select a Directory"}
          <IconButton
              aria-label="close"
              onClick={handelRejected}
              sx={{position: 'absolute', right: 8, top: 8}}>
            <CloseIcon/>
          </IconButton>
        </DialogTitle>
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
                <NewDirectoryDialog
                    path={pwd ? pwd : '/'}
                    open={openNewDirectoryDialog}
                    onCreate={handleNewFolderRequest}
                    onClose={(props) => {
                      if (props.serverDataChanged) {
                        handleRefreshPath()
                      }
                      setOpenNewDirectoryDialog(false)
                    }}
                />
                <CurrentPath selected={pwd} setPwd={setPwd}/>
                <AppBar
                    sx={{style: {borderRadius: 10}}}
                    position="static"
                    color="inherit"
                    variant={'outlined'}
                    elevation={0}
                >
                  <Toolbar variant="dense">
                    <Box sx={{ flexGrow: 1 }}>
                      <IconButton edge={'start'} onClick={handleRefreshPath}>
                        <SyncIcon/>
                      </IconButton>
                    </Box>
                    {/*</Box>*/}
                    <MenuItem
                        onClick={() => setOpenNewDirectoryDialog(true)}
                    >
                      New Directory
                    </MenuItem>
                  </Toolbar>
                </AppBar>
                <StyledDataGrid
                    sx={{
                      '& .MuiDataGrid-panelContent': {
                        color: "blue"
                      },
                      overflow: "hidden",
                      '& .theme-disabled': {
                        color: "text.disabled",
                      },
                      '& .theme-selectable': {
                        color: "text.primary",
                      },
                      '& .theme-selected': {
                        color: "text.primary",
                      },
                    }}
                    getCellClassName={fileCellClass}
                    getRowClassName={fileRowClass}
                    columnVisibilityModel={{
                      name: true,
                      size: true,
                      type: true,
                      location: false
                    }}
                    components={{
                      LoadingOverlay: LinearProgress,
                    }}
                    loading={loading}
                    componentsProps={
                      {
                        toolbar: {selected: selectedPath, setPwd: setPwd},
                        loadingOverlay: {role: 'progressBar'},
                      }
                    }
                    onRowClick={(params) => {
                      return filesOnRowClick(params, loading, setSelectedPath);
                    }}
                    onRowDoubleClick={
                      (params: GridRowParams<IFile>) => fileOnDoubleClick(
                          params,
                          loading,
                          setPwd
                      )
                    }
                    isRowSelectable={
                      (params: GridRowParams<GridValidRowModel>): boolean => {
                        return fileIsRowSelectable(params, loading)
                      }}
                    rows={files ? files : []}
                    columns={columns}
                    disableColumnMenu={true}
                    hideFooterSelectedRowCount={true}
                    hideFooter={true}
                    rowHeight={40}
                />

              </Box>
            </Box>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              py: 1,
              pr: 1
            }}>
              <Box sx={{mr: 2, ml: 2}}>Directory Name:</Box>
              <Box aria-label={"selected path"} sx={{
                border: "2px inset",
                flexGrow: 1,
                pl: 1
              }}>{selectedPath}</Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button disabled={!selectionIsValid}
                  onClick={handleAccept}>Accept</Button>
          <Button onClick={handelRejected} autoFocus>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
  )
});

export interface SelectionRef {
  value: string | null
}

const useFilePathIsValid = (pathName: string | null) => {
  const [result, setResult] = useState<null | boolean>(null)
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false)
  const controllerRef = useRef(new AbortController());
  const cancel = () => {
    controllerRef.current.abort()
  }
  const update = () =>{
    console.log("updating")
  }
  useEffect(() => {
    if (pathName) {
      if (pathName === '' || !pathName.startsWith("/")) {
        setResult(false)
      } else {
        setLoaded(false)
        axios.get(`/api/files/exists?path=${pathName}`, {signal: controllerRef.current.signal})
            .then(res => {
              setResult(res.data.exists)
            }).catch(setError)
            .finally(() => {
              setLoaded(true)
            })
      }
    }
  }, [pathName])
  return {cancel, update, result, error, loaded}
}
const useDirectory = (
    path: string | null,
    getDataHook: (path: string | null) => { data: IAPIDirectoryContents | null, error: string, loaded: boolean, update: ()=>void }
) => {
  const [data, setData] = useState<null | IFile[]>(null)
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false)
  const [isValid, setIsValid] = useState(false)

  const dataProvider = getDataHook(path)

  const refresh = ()=>{
    dataProvider.update()
  }
  useEffect(() => {
    if (dataProvider.data) {
      const result = dataProvider.data
      const newFiles: IFile[] = []
      for (const fileNode of result['contents']) {
        newFiles.push(
            {
              id: newFiles.length,
              size: fileNode.size,
              name: fileNode.name,
              type: fileNode.type,
              path: fileNode.path,
            }
        )
      }
      setData(newFiles)
    }
    setLoaded(dataProvider.loaded)
    setError(dataProvider.error)
  }, [path, dataProvider.data, isValid])
  return {data, error, loaded, refresh}
}
export const DirectorySelect = forwardRef(
    (
        {label, onRejected, getDataHook, onAccepted, onReady}: IDirectorySelect,
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

export const FileSelect: FC<APIWidgetData> = ({label}) => {
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
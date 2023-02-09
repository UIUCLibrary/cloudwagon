import React, {
  FC,
  useState,
  useEffect,
  useImperativeHandle,
  useId, forwardRef, Ref, useRef,
} from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select"
import MenuItem from '@mui/material/MenuItem';
import {styled} from '@mui/material/styles';


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
  Checkbox, FormControlLabel
} from "@mui/material";
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridRowClassNameParams,
  GridValidRowModel,
} from '@mui/x-data-grid';
import FolderIcon from "@mui/icons-material/Folder";
import InputLabel from "@mui/material/InputLabel";
import {splitRoutes} from './FileManagement';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import {
  GridCellParams,
  GridValueFormatterParams
} from '@mui/x-data-grid/models/params/gridCellParams';
import LinearProgress from '@mui/material/LinearProgress';


interface IWidget {
  label: string
}

export interface APIWidgetData extends IWidget {

  parameters?: { [key: string]: any }
  onAccepted?: (value: string)=>void
  onRejected?: ()=>void,
}

interface IChoiceSelection extends IWidget {
  placeholder_text?: string,
  selections: string[]

}
export interface IAPIDirectoryContents {
  path: string,
  contents: IFile[]
}
interface IDirectorySelect extends APIWidgetData{
  getDataHook: ()=>Promise<IAPIDirectoryContents | null>
  onReady?: ()=>void
}
export const SelectOption: FC<APIWidgetData> = ({label, parameters}) => {
  const id = useId();
  if (!parameters){
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
            name={label} label={label} defaultValue=''>{options}</Select>
      </FormControl>
  )
}
export const CheckBoxOption: FC<APIWidgetData> = ({label}) => {
  const [value, setValue] = useState(false);
  const checkbox = <>
      <Checkbox
        checked={value}
        value={value}
        onChange={()=>{setValue(!value)}}
      />
    <input type="hidden" defaultChecked={true} value={value.toString()} name={label}/>
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
  size: number
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

    }
})
interface IRoute{
  display: string
  path: string
}
interface IToolbar {
  selected: string
  setPwd: (pwd: string)=>void
}
const CustomToolBar: FC<IToolbar> = ({selected, setPwd})=> {
  const routes = splitRoutes(selected)
  const breadcrumbs = routes.map( (route: IRoute, index)=>{
    return <Link
        key={index}
        underline="hover"
        color="inherit"
        href={"#"}
        onClick={()=> {
          setPwd(route.path)
    }}>{route.display}</Link>
  })
  return (
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'text.disabled' }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>{breadcrumbs}</Breadcrumbs>
      </Box>
  );
}
const useGetFileData = (source: { contents: IFile[]} | null): IFile[] | null=>{
  const [files, setFiles] = useState<IFile[] | null>(null);
  const contentName = (file: IFile) =>{
    if (file.type === "Directory" ) {
      if (file.name === "..") {
        return file.name;
      }
      return `${file.name}/`;
    }
    return file.name
  }
  useEffect(()=>{
    if (source) {
        const newFiles: IFile[] = []
          for (const fileNode of source['contents']) {
            newFiles.push(
                {
                  id: newFiles.length,
                  size: fileNode.size,
                  name: contentName(fileNode),
                  type: fileNode.type,
                  path: fileNode.path,
                }
            )
          }
          setFiles(newFiles)
    }
  }, [source])
  return files
}
interface IDirectorySelectDialog {
  getDataHook: (path: string | null)=>[loading: boolean, files: IFile[] | null],
  startingPath?: string,
  show: boolean
  onClose?: ()=>void
  onAccepted?: (path: string)=>void
  onRejected?: ()=>void
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
  if (params.row.type === "Directory"){
    return 'theme-selectable'
  }
  return ''
}
const fileCellClass = (params: GridCellParams<GridValidRowModel>)=>{
  if (params.row.type === "File" && params.field === 'name'){
    return 'theme-disabled'
  }
  return ''
}

const fileOnDoubleClick = (
    params: GridRowParams<IFile>,
    loading: boolean,
    setSelection: (path: string)=>void
)=> {
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
  if (params.row.type === "File"){
    return false;
  }
  return params.row.name !== "..";

}
const filesOnRowClick = (
    params: GridRowParams<IFile>,
    loading: boolean,
    setSelected: (path: string)=>void
)=>{
  if (!loading){
    if (params.row.type === "Directory" && params.row.name !== ".."){
      setSelected(params.row.path);
    }

  }
}

const DirectorySelectDialog = forwardRef((
    {
      startingPath,
      show,
      onClose,
      onAccepted,
      onRejected,
      getDataHook
    }: IDirectorySelectDialog,
    ref: Ref<DirectorySelectDialogRef>
)=>{
  const [pwd, setPwd] = useState(startingPath)
  const [selected, setSelected] = useState(pwd)
  const [loading, files] = getDataHook(pwd ? pwd: null)
  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }
  const handleAccept = ()=> {
    handleClose();
    if (onAccepted && selected) {
      onAccepted(selected)
    }
  }
  const handelRejected = ()=>{
    handleClose();
    if (onRejected){
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
        selectedPath: selected ? selected : null
      }
  ), [selected]);
  return(
    <Dialog
        PaperProps={{style: {borderRadius: 10}}}
            open={show} fullWidth={true} maxWidth="md">
          <DialogTitle id="alert-dialog-title">
            {"Select a Directory"}
          </DialogTitle>
          <DialogContent style={{ overflow: "hidden"}}>
            <div style={{ display: 'flex', minHeight: 400}}>
            <div style={{ flexGrow: 1 }}>

                <StyledDataGrid
                    sx={{
                      borderRadius: 2,
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
                      Toolbar: CustomToolBar,
                      LoadingOverlay: LinearProgress
                    }}
                    loading={loading}
                    componentsProps={
                      {
                        toolbar: {selected: selected, setPwd: setPwd},
                        loadingOverlay:{role: 'progressBar'}
                      }
                    }
                    onRowClick={(params)=> {
                      return filesOnRowClick(params, loading, setSelected);
                    }}
                    onRowDoubleClick={
                      (params: GridRowParams<IFile>)=> fileOnDoubleClick(
                          params,
                          loading,
                          setPwd
                      )
                    }
                    isRowSelectable={
                      (params: GridRowParams<GridValidRowModel>): boolean => {
                        return fileIsRowSelectable(params, loading)
                    }}
                    rows={files? files: []}
                    columns={columns}
                    disableColumnMenu={true}
                    hideFooterSelectedRowCount={true}
                    hideFooter={true}
                    rowHeight={40}
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAccept}>Accept</Button>
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
export const DirectorySelect = forwardRef(
    (
        {label, onRejected, getDataHook, onReady}: IDirectorySelect,
        ref: Ref<SelectionRef>) => {
  const dialogBoxRef = useRef<DirectorySelectDialogRef>(null);
  const [openDialogBox, setOpenDialogBox] = useState(false)
  const [selected, setSelected] = useState<undefined | string>();
  const handleMouseDown = () => {
    setOpenDialogBox(true)
  }
  const useHook = (path: string | null):[boolean, IFile[] | null] => {
    const [loading, setLoading] = useState(false);
    const [rawData, setRawData] = useState<{ contents: IFile[]} | null>(null);
    const files = useGetFileData(rawData)
    useImperativeHandle(ref, () =>({
      value: dialogBoxRef.current ? dialogBoxRef.current.selectedPath : null
    }), []);
    useEffect(()=>{
      if (getDataHook) {
        setLoading(true);
        getDataHook()
            .then((response) => {
              setRawData(response)
            })
            .catch(console.error)
            .finally(() => {
              setLoading(false);
              if (onReady){
                onReady()
              }
            });
      }

    }, [path])

    return [loading, files];
  }
  return (
      <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        <DirectorySelectDialog
            ref={dialogBoxRef}
            startingPath={selected}
            show={openDialogBox}
            getDataHook={useHook}
            onAccepted={(value)=>setSelected(value)}
            onRejected={onRejected}
            onClose={()=>setOpenDialogBox(false)}
        />
        <TextField
            label={label}
            value={selected ? selected : ''}
            InputProps={{
              readOnly: true,
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
            <Button onClick={handleClose} autoFocus>
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
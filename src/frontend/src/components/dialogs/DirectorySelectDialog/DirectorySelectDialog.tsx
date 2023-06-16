import {forwardRef, Ref, useEffect, useImperativeHandle, useState} from 'react';
import {useDirectory} from '../../widgets/useDirectory';
import {
  DataGrid,
  GridColDef, GridRowClassNameParams,
  GridRowParams,
  GridValidRowModel
} from '@mui/x-data-grid';
import axios from 'axios';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';

import CloseIcon from '@mui/icons-material/Close';
import {NewDirectoryDialog} from '../NewDirectoryDialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import SyncIcon from '@mui/icons-material/Sync';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import {
  GridCellParams,
  GridRenderCellParams, GridValueFormatterParams
} from '@mui/x-data-grid/models/params/gridCellParams';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PortraitOutlinedIcon from '@mui/icons-material/PortraitOutlined';
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';
import InsertDriveFileOutlinedIcon
  from '@mui/icons-material/InsertDriveFileOutlined';

import {
  CurrentPath
} from '../../widgets/CurrentPath';

import {
  IDirectorySelectDialog,
  DirectorySelectDialogRef,
} from './DirectorySelectDialog.types'

import {IFile} from '../../widgets';
import {styled} from '@mui/material/styles';

const fileSizeFormatter = (params: GridValueFormatterParams<number>) => {
  if (params.value == null) {
    return '';
  }
  return `${params.value} bytes`
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

const fileCellClass = (params: GridCellParams<GridValidRowModel>) => {
  if (params.row.type === "File" && params.field === 'name') {
    return 'theme-disabled'
  }
  return ''
}

const fileRowClass = (params: GridRowClassNameParams<GridValidRowModel>) => {
  if (params.row.type === "Directory") {
    return 'theme-selectable'
  }
  return ''
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
export const DirectorySelectDialog = forwardRef((
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
                      (params: GridRowParams<IFile>) => {
                        fileOnDoubleClick(
                            params,
                            loading,
                            setPwd
                        )
                        handleRefreshPath();
                      }
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
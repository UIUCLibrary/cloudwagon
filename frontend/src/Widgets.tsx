import React, {FC, useState, useEffect, useId} from "react";
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
import axios from 'axios';
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
  parameters: { [key: string]: any }
  onAccepted?: (value: string)=>void
}

interface IChoiceSelection extends IWidget {
  placeholder_text?: string,
  selections: string[]

}

export const SelectOption: FC<APIWidgetData> = ({label, parameters}) => {
  const id = useId();
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
  return (
      <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        <FormControlLabel name={label} control={<Checkbox></Checkbox>}
                          label={label}/>
      </FormControl>
  )
}
interface IFile {
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
// const useStyles = makeStyles((theme: Theme) => ({
//   tableRowRoot: {
//     "&$tableRowSelected, &$tableRowSelected:hover": {
//       backgroundColor: theme.palette.primary.main
//     }
//   },
//   tableRowSelected: {
//     backgroundColor: theme.palette.primary.main
//   }
// }));
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
interface IDirectorySelectDialog {
  startingPath?: string,
  show: boolean
  onClose?: ()=>void
  onAccepted?: (path: string)=>void
}
const DirectorySelectDialog: FC<IDirectorySelectDialog> = ({startingPath, show, onClose, onAccepted})=>{
  const [pwd, setPwd] = useState(startingPath)
  const [selected, setSelected] = useState(pwd)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<IFile[] | null>(null);
  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }
  const handleAccept = ()=>{
    handleClose();
    if (onAccepted && selected){
      onAccepted(selected)
    }
  }
   const contentName = (file: IFile) =>{
      if (file.type === "Directory" ) {
        if (file.name === "..") {
          return file.name;
        }
        return `${file.name}/`;
      }
      return file.name
    }
  const fetchData = async () =>{
    if (!loading) {
      setLoading(true)
      setRows([])
      console.log(pwd)
      axios.get(`/api/files?path=${pwd ? pwd : '/'}`)
          .then((data) => {
            const newFiles: IFile[] = []
            for (const fileNode of data.data['contents']) {
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
            setSelected(data.data.path);
            setRows(newFiles)
          })
          .finally(() => {
                setLoading(false);
              }
          )
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
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        if (params.value == null) {
          return '';
        }
        return `${params.value} bytes`
      }
    },
    {
      field: 'type',
      headerName: "Type",
      headerClassName: 'dialog-header',
      width: 150,
      editable: false,
    }
  ];
  useEffect(()=>{
    if (show){
      fetchData()
    }
  }, [pwd, show])
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
                    getCellClassName={(params: GridCellParams<GridValidRowModel>)=>{
                      if (params.row.type === "File" && params.field === 'name'){
                        return 'theme-disabled'
                      }
                      return ''
                    }}
                    getRowClassName={(params: GridRowClassNameParams<GridValidRowModel>) => {
                      if (params.row.type === "Directory"){
                        return 'theme-selectable'
                      }
                      return ''
                    }}
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
                    componentsProps={{toolbar: {selected: selected, setPwd: setPwd}}}
                    onRowClick={(params: GridRowParams<IFile>)=>{
                      if (params.row.type === "Directory" && params.row.name !== ".."){
                        setSelected(params.row.path);
                      }
                    }}
                    onRowDoubleClick={(
                        params: GridRowParams<IFile>,
                    )=> {
                      if (params.row.type === "Directory"){
                        setRows([]);
                        setPwd(params.row.path);
                      }
                    }}

                    isRowSelectable={(params: GridRowParams<GridValidRowModel>): boolean => {
                      if (params.row.type === "File"){
                        return false;
                      }
                      return params.row.name !== "..";

                    }}
                    rows={rows? rows:[]}
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
            <Button onClick={handleClose} autoFocus>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
)
}

export const DirectorySelect: FC<APIWidgetData> = ({label}) => {

  const [openDialogBox, setOpenDialogBox] = useState(false)
  const [selected, setSelected] = useState<undefined | string>();
  const handleMouseDown = () => {
    setOpenDialogBox(true)
  }
  return (
      <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        <DirectorySelectDialog
            startingPath={selected}
            show={openDialogBox}
            onAccepted={(value)=>setSelected(value)}
            onClose={()=>setOpenDialogBox(false)}
        />
        <TextField
            label={label}
            value={selected ? selected : ''}
            InputProps={{
              readOnly: true,
              endAdornment: <InputAdornment position="end">
                <IconButton aria-label="browse"
                    onMouseDown={handleMouseDown}
                ><FolderIcon/></IconButton>
              </InputAdornment>
            }}>

        </TextField>

      </FormControl>
  )
};

export const FileSelect: FC<APIWidgetData> = ({label}) => {
  const [openDialogBox, setOpenDialogBox] = useState(false)
  const handleClose = () => {
    setOpenDialogBox(false)
  }
  const handleMouseDown = () => {
    console.log('clicky');
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
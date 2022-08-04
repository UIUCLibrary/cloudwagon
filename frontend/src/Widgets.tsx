import React, {FC, useState, useEffect, useId} from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select"
import MenuItem from '@mui/material/MenuItem';
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
import {DataGrid, GridColDef} from '@mui/x-data-grid';
import FolderIcon from "@mui/icons-material/Folder";
import InputLabel from "@mui/material/InputLabel";
import FileOpenIcon from '@mui/icons-material/FileOpen';
import {
  GridValueFormatterParams
} from '@mui/x-data-grid/models/params/gridCellParams';


interface IWidget {
  label: string
}

export interface APIWidgetData extends IWidget {
  parameters: { [key: string]: any }
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
}
export const DirectorySelect: FC<APIWidgetData> = ({label}) => {
  const [openDialogBox, setOpenDialogBox] = useState(false)
  const [rows, setRows] = useState<IFile[] | null>(null);
  useEffect(() => {
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
      const newFiles: IFile[] = []
      for (const x of (await axios.get('/api/files?path=/')).data['contents']){
        newFiles.push(
            {
              id: newFiles.length,
              size: x.size,
              name: contentName(x),
              type: x.type
            }
        )
      }
      setRows(newFiles)
    }
    fetchData();
  }, [])
  if (rows === null){
    return <>Loading...</>
  }
  const handleClose = () => {
    setOpenDialogBox(false)
  }
  const handleMouseDown = () => {
    setOpenDialogBox(true)
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

  return (
      <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        <Dialog
            PaperProps={{style: {borderRadius: 10}}}
            open={openDialogBox} fullWidth maxWidth="md">
          <DialogTitle id="alert-dialog-title">
            {"Select a Directory"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{height: 400, width: '100%'}}>
              <Breadcrumbs>
                <h4>myfiles</h4>
              </Breadcrumbs>
              <DataGrid
                  sx={{
                    '.MuiDataGrid-columnHeaders': {
                      backgroundColor: 'primary.light'
                    },
                  }}
                  rows={rows}
                  columns={columns}
                  disableColumnMenu={true}
                  hideFooterSelectedRowCount={true}
                  hideFooter={true}
                  rowHeight={40}
              />
            </Box>
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
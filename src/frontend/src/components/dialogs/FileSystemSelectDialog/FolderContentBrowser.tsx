import {forwardRef, Ref, useEffect, useImperativeHandle, useState} from 'react';
import {IFile} from '../../widgets';
import {
  DataGrid, GridCellParams,
  GridColDef, GridRowClassNameParams,
  GridRowParams,
  GridValidRowModel
} from '@mui/x-data-grid';
import {
  GridRenderCellParams
} from '@mui/x-data-grid/models/params/gridCellParams';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import Box from '@mui/material/Box';
import PortraitOutlinedIcon from '@mui/icons-material/PortraitOutlined';
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';
import InsertDriveFileOutlinedIcon
  from '@mui/icons-material/InsertDriveFileOutlined';
import {styled} from '@mui/material/styles';

export interface FileSystemContentRef {
  selectedItem: IFile | null
  rowCount: number
}

const fileSizeFormatter = (value: string) => {
  if (value == null) {
    return '';
  }
  return `${value} bytes`
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

        return <><TextSnippetOutlinedIcon/><Box sx={{pl: 1}}>{params.value}</Box></>
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

const fileRowClass = (params: GridRowClassNameParams<GridValidRowModel>) => {
  if (params.row.type === "Directory") {
    return 'theme-selectable'
  }
  return ''
}

interface FileSystemContentProps {
  loading: boolean,
  folderContent?: IFile[],
  onItemAccepted?: (item: IFile) => void
  onItemSelected?: (item: IFile) => void
  onInvalidSelection?: (item: IFile) => void
  itemSelectionFilter?: (item: IFile) => boolean
  onClick?: (item: IFile)=> void
  onDoubleClick?: (item: IFile)=> void
}

const directoryAreOnlyEnabled = (params:  GridCellParams<IFile, GridValidRowModel>, filter: (IFile)=>boolean): string=>{
  if (params.field === 'name') {
    if (params.row.type !== "Directory"){
      if (!filter(params.row as IFile)) {
        return 'theme-disabled'
      }
    }
  }
  return ''
}

export const itemIsSelectable = (item: IFile, itemSelectionFilter?: (IFile)=> boolean): boolean => {
  if (["..", '.'].includes(item.name)){
    return true
  }
  if(itemSelectionFilter){
    return itemSelectionFilter(item)
  }
  return true
}
/**
 * Check if a selection is a valid one. Returns true if is a valid selection and false if not.
 * @param selection
 * @param itemFilter - Optional filter function callback that checks if the content of the selection
 *
 */
const isValidSelection = (selection: IFile, itemFilter?: (item: IFile) => boolean): boolean =>{
  if(itemFilter) {
    return itemFilter(selection)
  }
  return true
}

const handleBrowserRowDoubleClick = (row: IFile, onDoubleClick?: (item: IFile)=> void, onItemAccepted?: (item: IFile) => void)=>{
  if (onDoubleClick) {
    onDoubleClick(row)
  }
  if (onItemAccepted) {
    onItemAccepted(row)
  }
}

export const handleBrowserInvalidSelection = (row: IFile, onInvalidSelection?: (item: IFile) => void) =>{
  if (onInvalidSelection) {
    onInvalidSelection(row)
  }
}
const handleBrowserRowClick = (row: IFile, onClick?: (item: IFile)=> void) =>{
  if(onClick){
    onClick(row)
  }
}
export const FolderContentBrowser = forwardRef(({loading, folderContent, itemSelectionFilter, onItemAccepted, onItemSelected, onInvalidSelection, onClick, onDoubleClick}: FileSystemContentProps, ref: Ref<FileSystemContentRef>) =>{
  const [selected, setSelected] = useState<IFile|null>(null)
  const actualFolderContent = folderContent ? folderContent : []
  useImperativeHandle(ref, ()=>(
      {
        selectedItem: selected,
        rowCount: actualFolderContent.length
      }
  ));
  useEffect(()=>{
    if (onItemSelected && selected){
      onItemSelected(selected)
    }
  }, [selected])
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: "Name",
      headerClassName: 'dialog-header',
      flex: 0.5,
      minWidth: 250,
      editable: false,
      display: 'flex',
      renderCell: formatWithIcon
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
  const handleRowClick = (row: IFile): void =>  {
    if (isValidSelection(row, itemSelectionFilter)){
      setSelected(row);
    } else {
      handleBrowserInvalidSelection(row, onInvalidSelection)
    }
    handleBrowserRowClick(row, onClick)
  }
  return(
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
            getCellClassName={(params:  GridCellParams<IFile, GridValidRowModel>): string=>{
              return directoryAreOnlyEnabled(params, itemSelectionFilter)
            }}
            getRowClassName={fileRowClass}
            columnVisibilityModel={{
              name: true,
              size: true,
              type: true,
              location: false
            }}
            slotProps={{

              loadingOverlay: {
                role: 'progressBar',
                variant: 'linear-progress',
              },
            }}
            loading={loading}
            onRowClick={
              (params: GridRowParams<IFile>): void => {
                if (!loading) {
                  handleRowClick(params.row)
                }
            }}
            onRowDoubleClick={
              (params: GridRowParams<IFile>): void => {
                if (!loading) {
                  handleBrowserRowDoubleClick(params.row, onDoubleClick, onItemAccepted)
                }
              }
            }
            isRowSelectable={(params: GridRowParams<GridValidRowModel>): boolean => {
              if (loading) {
                return false;
              }
              return itemIsSelectable(params.row as IFile, itemSelectionFilter)
            }}
            rows={loading ? [] : actualFolderContent}
            columns={columns}
            disableColumnMenu={true}
            hideFooterSelectedRowCount={true}
            hideFooter={true}
            rowHeight={40}
        />
  )
});
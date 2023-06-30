import {forwardRef, Ref, useEffect, useImperativeHandle, useState} from 'react';
import {IFile} from '../../widgets';
import {
  DataGrid,
  GridColDef, GridRowClassNameParams,
  GridRowParams,
  GridValidRowModel
} from '@mui/x-data-grid';
import LinearProgress from '@mui/material/LinearProgress';
import {
  GridRenderCellParams, GridValueFormatterParams
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

const fileSizeFormatter = (params: GridValueFormatterParams<number>) => {
  if (params.value == null) {
    return '';
  }
  return `${params.value} bytes`
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
            getCellClassName={(params)=>{
              if (params.field === 'name') {
                if (params.row.type !== "Directory"){
                  if (!itemSelectionFilter(params.row as IFile)) {
                    return 'theme-disabled'
                  }
                }
              }
              return ''
            }}
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
                loadingOverlay: {role: 'progressBar'},
              }
            }
            onRowClick={
              (params: GridRowParams<IFile>): void => {
                if (!loading) {
                  if(itemSelectionFilter){
                    if (itemSelectionFilter(params.row)) {
                      setSelected(params.row);
                    } else {
                      if( onInvalidSelection){
                        onInvalidSelection(params.row)
                      }
                    }
                  } else {
                    setSelected(params.row);
                  }
                  if(onClick){
                    onClick(params.row)
                  }
                }
            }}
            onRowDoubleClick={
              (params: GridRowParams<IFile>): void => {
                if (!loading) {
                  if (onDoubleClick) {
                    onDoubleClick(params.row)
                  }
                  if (onItemAccepted) {
                    onItemAccepted(params.row)
                  }
                }
              }
            }
            isRowSelectable={
              (params: GridRowParams<GridValidRowModel>): boolean => {
                if (loading) {
                  return false;
                }
                if (["..", '.'].includes(params.row.name)){
                  return true
                }
                if(itemSelectionFilter){
                  return itemSelectionFilter(params.row as IFile)
                }
                return true
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
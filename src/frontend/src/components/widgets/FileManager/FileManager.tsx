import {FC, ReactElement, useEffect, useState} from 'react';

import {useDirectoryContentsHookResponse, useUploadFiles} from '../../apiHooks';
import {AddFilesDialog, ConfirmRemovalFiles} from '../../dialogs';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MenuItem from '@mui/material/MenuItem';
import List from '@mui/material/List';
import axios from 'axios';
import Link from '@mui/material/Link';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Folder from '@mui/icons-material/Folder';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AlertTitle from '@mui/material/AlertTitle';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import ListItem from '@mui/material/ListItem';
import {IRoute} from '../Widgets.types';
import {
  IFileNode,
  DisplayItem2Props,
  IAPIRequest,
  BreadCrumbProps,
  ListOfFilesProps,
  BreadCrumbComponentProps,
  ErrorBlockProps,
  FileManagerProps
} from './FileManager.types';

const useDataSource = (path: string, getResourceFunc: (string)=> Promise<IAPIRequest>): useDirectoryContentsHookResponse =>{
  const [data,setData] = useState([])
  useEffect(()=>{
    fetchData();
  }, [path])
  const fetchData = () => {
    (async () => {
      try {
        const result = await getResourceFunc(path);
        setData(result.contents);
      } catch (error){
        console.log("error fetching data")
        throw error;
      }
    })().catch(e => console.error(e));
  }
  return {
    contents: data,
    error: null,
    loaded: true,
    refresh: ()=> {
      fetchData()
    }
  }
}

const removeAllFiles = ()=>{
  return axios.delete('/api/files')
}
const getNodeIcon = (file: IFileNode)=>{
  switch (file.type){
    case "File":
      return <InsertDriveFileIcon/>
    case "Directory":
      return <Folder/>
    default:
      return <></>
  }
}


function DefaultDirectoryItem(props: DisplayItem2Props){
  const getDisplayName = (file: IFileNode, pwd: string, onClick: (string)=>void): ReactElement =>{
    if (file.type === "Directory"){
      const outputPath = file.name === ".."? file.name :  `${file.name}/`
      const fullpath = (pwd === '/')? `\/${outputPath}`: `${pwd}/${outputPath}`;
      const linkUrl = `./?path=${encodeURI(fullpath)}`
      return (
          <Link href={"#"} underline="hover" onClick={()=>{onClick(linkUrl)}}>
            {outputPath}
          </Link>
      )
    }
    return <>{file.name}</>;
  }
  return <>
    <ListItemIcon>{getNodeIcon(props.file)}</ListItemIcon>
    <ListItemText>{getDisplayName(props.file,  props.pwd, props.onClick)}</ListItemText>
  </>
}

function BreadCrumbComponents({path, onClick, BreadCrumbComponent}: BreadCrumbProps) {
  const routes = splitRoutes(path)
  const elementValues = routes.map(value=> {
    return (
        <BreadCrumbComponent
            display={value.display}
            key={value.path}
            path={path} onClick={()=> {
          if (onClick) {
            onClick(value.path)
          }
        }}/>
    )
  })

  return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ flexGrow: 1 }} separator="›" >
        {elementValues}
      </Breadcrumbs>
  )
}


const ListOfFiles = ({files, pwd, onClick, DisplayDirectoryItemWidget}: ListOfFilesProps): ReactElement => {
  return (
      <>
        {
          files? files.map((file, index) =>{
            return (
                <ListItem key={index}>
                  <DisplayDirectoryItemWidget file={file} pwd={pwd} onClick={onClick}/>
                </ListItem>
            )
          }): <></>
        }
      </>
  )

}
const LoadingSkeleton = (): ReactElement => {
  const n = 8
  const elements = [...Array(n)].map((value, index)=> {
    return (
        <Stack key={index} direction="row" spacing={2}>
          <Skeleton animation="wave" variant="circular" width={40}
                    height={40}/>
          <Skeleton animation="wave" height={40} width="100%"
                    style={{marginBottom: 6}}/>
        </Stack>
    )
  });
  return <>{elements}</>
}

function DefaultBreadCrumbComponent(props: BreadCrumbComponentProps){
  return (
      <>
        <Link
            href={"#"}
            underline="hover"
            color="inherit"
            onClick={()=>{props.onClick(`/manageFiles/?path=${props.path}`)}}
        >
          {props.display}
        </Link>
      </>
  )
}
function ErrorBlock(props: ErrorBlockProps){
  return (
      <Collapse in={!!props.error}>
        <Alert
            severity="error"
            action={
              <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={()=>props.onDismiss()}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}

        >
          <AlertTitle>Error</AlertTitle>
          {props.error?.toString()}
        </Alert>
      </Collapse>
  );
}

export const splitRoutes = (pwd: string | null): IRoute[] =>{
  if (!pwd){
    return [];
  }
  const components: IRoute[] = [
    {
      display: '/',
      path: '/'
    }
  ];
  const root = ['']
  for (const x of pwd.trim().split('/').filter(element => element)){
    components.push(
        {
          display: x,
          path: root.concat([x]).join('/')
        }
    )
    root.push(x);
  }
  return components;
}

export function FileManager({path, DirectoryItem, BreadCrumbComponent, resourceGetter}: FileManagerProps) {
  const [pwd, setPwd] = useState(path)
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<IFileNode[]|null>(null);
  const [error, setError] = useState<string | null>(null);
  const directoryContentsHook = useDataSource(pwd, resourceGetter ? resourceGetter : async () =>Promise.resolve({contents: []}));
  const uploadFilesHook = useUploadFiles(pwd);
  const [addFilesDialogOpen, setAddFilesDialogOpen] = useState<boolean>(false);
  const [removeFilesDialogOpen, setRemoveFilesDialogOpen] = useState<boolean>(false);
  useEffect(()=>{
    setFiles(directoryContentsHook.contents)
  }, [directoryContentsHook.contents])

  const handleAddNewFiles = (accept: boolean, files?: FileList|null) =>{
    setAddFilesDialogOpen(false)
    if(files) {
        setLoading(true)
      uploadFilesHook.upload(Array.from(files))
          .finally(()=> {
              setLoading(false)
            directoryContentsHook.refresh()
          });
    }
  }
  const handleRemoveFiles = (accept: boolean) =>{
    setRemoveFilesDialogOpen(false)
    if(accept){
      removeAllFiles()
          .then(() => {
            console.log('success removed')
          }).finally(()=> {
        console.log('refreshing data')
        directoryContentsHook.refresh()
      })
    }
  }

  const DirectoryItemUsed: FC<DisplayItem2Props> = DirectoryItem? DirectoryItem : DefaultDirectoryItem
  const BreadCrumbComponentUsed: FC<BreadCrumbComponentProps> = BreadCrumbComponent? BreadCrumbComponent : DefaultBreadCrumbComponent

  return (
      <>
        <AddFilesDialog open={addFilesDialogOpen} onSetClose={handleAddNewFiles}/>
        <ConfirmRemovalFiles open={removeFilesDialogOpen} onSetClose={handleRemoveFiles}/>
        <AppBar position="static">
          <Toolbar>
            <BreadCrumbComponents
                path={pwd}
                onClick={(path)=>{setPwd(path)}}
                BreadCrumbComponent={BreadCrumbComponentUsed}
            />
            <MenuItem onClick={()=>{setAddFilesDialogOpen(true) }}>Add Files</MenuItem>
            <MenuItem onClick={()=>{setRemoveFilesDialogOpen(true)}}>Remove All Files</MenuItem>
          </Toolbar>
        </AppBar>
        <ErrorBlock error={error} onDismiss={()=>{setError(null)}}/>
        <List>
          {
            loading ?
                <LoadingSkeleton/> :
                <ListOfFiles
                    files={files}
                    pwd={pwd}
                    onClick={setPwd}
                    DisplayDirectoryItemWidget={DirectoryItemUsed}
                />
          }
        </List>
      </>
  )
}
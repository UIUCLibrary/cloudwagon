import {
  forwardRef,
  Ref,
  useEffect,
  useState
} from 'react';
import axios, {AxiosError, AxiosResponse} from 'axios';
import {NewDirectoryDialog} from '../NewDirectoryDialog';

import CurrentPath from '../../widgets/CurrentPath';
import {CreateNewDirectoryAction} from '../FileSystemSelectDialog/Actions'
import {IFileSystemSelectDialog} from '../FileSystemSelectDialog/FileSystemSelectDialog.types'
import {IFile} from '../../widgets';
import {
  FileSystemDialogMenuBar,
  FileSystemSelectDialog,
  FileSystemSelectDialogRef
} from '../FileSystemSelectDialog'
import {useDirectoryContents} from "../../apiHooks/"
import {rejects} from "assert";

const directoriesOnlySelectable = (item: IFile | null): boolean =>{
  if (item === null){
    return false
  }
  if(item.type !== "Directory"){
    return false
  }
  return ![".."].includes(item.name);

}


export const DirectorySelectDialog = forwardRef((
    {
        startingPath,
        show,
        onClose,
        onAccepted,
        onRejected,
        fetchingFunction
    }: IFileSystemSelectDialog,
    ref: Ref<FileSystemSelectDialogRef>
) => {
    const [cwd, setCwd] = useState(startingPath ? startingPath : null)
    const contentGetter = useDirectoryContents(cwd ? cwd : startingPath, show, fetchingFunction)
    const [folderContent, setFolderContent] = useState<null | IFile[]>(null)
    const [openDialog, setOpenDialog] = useState(false)
    const handelAxiosErrors = (error: AxiosError) =>{
        console.error(error.response)
        if (error.response.status === 400){
            setCwd('/')
        }
    }
    useEffect(() => {
        if (contentGetter.error){
            switch (contentGetter.error.constructor)
            {
                case AxiosError:
                    handelAxiosErrors(contentGetter.error as AxiosError)
                    break
                default:
                    console.error(contentGetter.error)
            }
        }
    }, [contentGetter.error])
    useEffect(() => {
        setCwd(startingPath)
    }, [startingPath, show])
    useEffect(() => {
        if (show) {
            if (contentGetter.contents) {
                setFolderContent(contentGetter.contents)
            }
        }
    }, [contentGetter.contents, show])

    const handleNewFolderRequest = async (name: string, location: string): Promise<AxiosResponse> => {
        return new Promise((resolve, reject) =>{

            axios.post(
                "/api/files/directory",
                {path: location, name: name}
                )
                .then(resolve).catch(reject).finally(()=>{
                    contentGetter.refresh()
                })
        })
    }

    return (
        <FileSystemSelectDialog
            ref={ref}
            loading={contentGetter.loading}
            title={"Select a Directory"}
            cwd={cwd}
            show={show}
            selectionLabel={'Selected Directory:'}
            onClose={() => {
                setCwd(null)
                setFolderContent(null)
                if (onClose) {
                    onClose()
                }
            }}
            folderContent={folderContent}
            onAccepted={(item) => {
                if (onAccepted) {
                    if (onAccepted) {
                        onAccepted(item.path)
                    }
                }
            }}
            onChangeCurrentPath={setCwd}
            validItemFilter={directoriesOnlySelectable}
            onRejected={() => {
                if (onRejected) {
                    onRejected()
                }
            }}
        >
            <NewDirectoryDialog
                path={cwd}
                open={openDialog}
                onCreate={(name: string, location: string) => handleNewFolderRequest(name.trim(), location)}
                onClose={() => {
                    setCwd(null)
                    setOpenDialog(false)
                }}
            />
            <CurrentPath selected={cwd} onGotoParent={setCwd}/>
            <FileSystemDialogMenuBar onRefresh={contentGetter.refresh}>
                <CreateNewDirectoryAction onTriggered={() => setOpenDialog(true)}/>
            </FileSystemDialogMenuBar>
        </FileSystemSelectDialog>
    )
});
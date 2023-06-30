import {IFile} from '../../widgets';
import {IFileSystemSelectDialog} from '../FileSystemSelectDialog/FileSystemSelectDialog.types'
import {
    FileSystemDialogMenuBar,
    FileSystemSelectDialog,
    FileSystemSelectDialogRef
} from '../FileSystemSelectDialog'
import {forwardRef, Ref, useEffect, useState} from 'react';
import CurrentPath from '../../widgets/CurrentPath';
import {NewDirectoryDialog} from "../NewDirectoryDialog";
import {CreateNewDirectoryAction} from "../FileSystemSelectDialog/Actions.tsx";
import axios, {AxiosResponse} from "axios";
import {useDirectoryContents} from "../../apiHooks";

export const FileSelectDialog = forwardRef((
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
    useEffect(() => {
        if (show) {
            if (contentGetter.contents) {
                setFolderContent(contentGetter.contents)
            }
        }
    }, [contentGetter.contents, show])
    const filesOnlySelectable = (item: IFile): boolean => {
        if (item.type === "Directory") {
            return false
        }
        return true
    }
    const handleNewFolderRequest = async (name: string, location: string): Promise<AxiosResponse> => {
        return new Promise((resolve, reject) => {

            axios.post(
                "/api/files/directory",
                {path: location, name: name}
            )
                .then(resolve).catch(reject).finally(() => {
                contentGetter.refresh()
            })
        })
    }
    return (
        <FileSystemSelectDialog
            ref={ref}
            loading={contentGetter.loading}
            title={"Select a File"}
            cwd={cwd}
            show={show}
            selectionLabel={'Selected File:'}
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
            validItemFilter={filesOnlySelectable}
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

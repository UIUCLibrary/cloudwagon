import {IAPIDirectoryContents} from '../../widgets';
import {MenuAction} from './Actions';

export interface IFileSystemSelectDialog {
  fetchingFunction?: (path: string) => Promise<IAPIDirectoryContents>
  startingPath: string | null,
  show: boolean
  onClose?: () => void
  onAccepted?: (path: string) => void
  onRejected?: () => void
}
export interface DialogTitleBarProps {
  label: string
  onCloseWindow: ()=>void
}

export interface DirectoryDialogProps{
  title: string,
  open: boolean,
  onClose?: ()=>void
  onAccepted?: ()=>void
  onRejected?: ()=>void
  selectionIsValid?: boolean
  selectionWidget: JSX.Element
}

export interface ISelectedItem {
  label: string, value: string | JSX.Element | null
}

export interface FileSystemDialogMenuBarProps {
  children?: React.ReactElement<MenuAction>| React.ReactElement<MenuAction>[]
  onRefresh: ()=>void,
}
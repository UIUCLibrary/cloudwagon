import {IAPIDirectoryContents} from '../../widgets';
export interface IDataHook {
  data: IAPIDirectoryContents | null,
  error: string,
  loaded: boolean,
  update: ()=>void
}
export interface IDirectorySelectDialog {
  getDataHook?: (path: string | null) => IDataHook
  startingPath?: string | null,
  defaultValue?: string,
  show: boolean
  onClose?: () => void
  onReady?: () => void
  onAccepted?: (path: string) => void
  onRejected?: () => void
}
export interface DirectorySelectDialogRef {
  selectedPath: string | null,
  currentPath: string | null,
}

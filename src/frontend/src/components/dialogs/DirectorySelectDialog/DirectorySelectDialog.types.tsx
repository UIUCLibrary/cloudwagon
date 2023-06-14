import {IAPIDirectoryContents} from '../../widgets';

export interface IDirectorySelectDialog {
  getDataHook: (path: string | null) => { data: IAPIDirectoryContents | null, error: string, loaded: boolean, update: ()=>void }
  startingPath?: string | null,
  defaultValue?: string,
  show: boolean
  onClose?: () => void
  onReady?: () => void
  onAccepted?: (path: string) => void
  onRejected?: () => void
}
export interface DirectorySelectDialogRef {
  selectedPath: string | null
}
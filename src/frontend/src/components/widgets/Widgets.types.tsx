import {AxiosResponse} from 'axios';

// export interface NewDirectoryDialogProps {
//   open: boolean;
//   path: string
//   onClose?: (props: {serverDataChanged: boolean}) => void;
//   onCreate?: (name: string, location: string) => Promise<AxiosResponse>;
// }
export interface IWidget {
  label: string
  required?: boolean
}

export interface IChoiceSelection extends IWidget {
  placeholder_text?: string,
  selections: string[]
}

export interface APIWidgetData extends IWidget {
  parameters?: { [key: string]: any }
  onAccepted?: (value: string) => void
  onRejected?: () => void,
}
export interface IAPIDirectoryContents {
  path: string,
  contents: IFile[]
}
export interface IDirectorySelect extends APIWidgetData {
  getDataHook: (path: string | null) => { data: IAPIDirectoryContents | null, error: string, loaded: boolean, update: () => void }
  onReady?: () => void
}

export interface SelectionRef {
  value: string | null
}

export interface IRoute {
  display: string
  path: string
}

export interface IToolbar {
  selected: string | undefined | null
  setPwd: (pwd: string) => void
}

export interface IFile {
  id: number
  size: number | null
  name: string
  type: string
  path: string
}

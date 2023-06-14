import {AxiosResponse} from 'axios';

export interface NewDirectoryDialogProps {
  open: boolean;
  path: string
  onClose?: (props: {serverDataChanged: boolean}) => void;
  onCreate?: (name: string, location: string) => Promise<AxiosResponse>;
}

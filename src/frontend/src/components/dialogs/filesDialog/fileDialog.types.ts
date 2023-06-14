export interface IDialog{
  open?: boolean
  onSetClose?: (accept: boolean, files?: FileList|null)=>void;

}
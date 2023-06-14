export interface IJobProgressDialog {
  title: string,
  // streamUrlSSE: string
  streamUrlWS?: string
  show: boolean
  onClose?: () => void
}

export interface IJobProgressDialog {
  title: string,
  logs?: string
  currentTaskDescription?: string
  show: boolean
  progress: number
  onClose?: () => void
}

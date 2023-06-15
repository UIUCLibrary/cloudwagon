export interface IFileNode{
  name: string
  path: string
  type: string
  size: number | null
}
export interface IAPIRequest{
  // files: IFile[]
  contents: IFileNode[]
}
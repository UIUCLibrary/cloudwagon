export interface IFileNode{
  name: string
  path: string
  type: string
  size: number | null
}

export interface FileManagementPageProps{
  contentGetter?: (path: string)=> Promise<IAPIRequest>
}

export interface IAPIRequest{
  contents: IFileNode[]
}

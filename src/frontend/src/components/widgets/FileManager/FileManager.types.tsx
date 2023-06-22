import {FC} from 'react';

export interface BreadCrumbComponentProps {
  display: string,
  path: string,
  // key: React.Key,
  onClick: (path)=>void
}

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

export interface DisplayItem2Props {
  file: IFileNode,
  pwd: string,
  onClick: (string)=>void
}
export interface FileManagerProps {
  path: string
  DirectoryItem?: FC<DisplayItem2Props>
  BreadCrumbComponent?: FC<BreadCrumbComponentProps>
  resourceGetter? : (str) => Promise<IAPIRequest>
}

export interface BreadCrumbProps {
  path: string
  onClick?: (string)=>void
  BreadCrumbComponent: FC<BreadCrumbComponentProps>
}


export interface ErrorBlockProps {
  error: string | null,
  onDismiss: () => void
}
export interface ListOfFilesProps {
  files: IFileNode[],
  pwd: string,
  onClick: (string)=>void
  DisplayDirectoryItemWidget: FC<DisplayItem2Props>
  // DisplayDirectoryItemWidget: FC<DisplayItemProps>
}

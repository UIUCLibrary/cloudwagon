import {useEffect, useState} from 'react';
import {IAPIDirectoryContents, IFile} from './Widgets.types';

export const useDirectory = (
    path: string | null,
    getDataHook: (path: string | null) => { data: IAPIDirectoryContents | null, error: string, loaded: boolean, update: ()=>void }
) => {
  const [data, setData] = useState<null | IFile[]>(null)
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false)
  const [isValid, setIsValid] = useState(false)

  const dataProvider = getDataHook(path)

  const refresh = ()=>{
    dataProvider.update()
  }
  useEffect(() => {
    if (dataProvider.data) {
      const result = dataProvider.data
      const newFiles: IFile[] = []
      for (const fileNode of result['contents']) {
        newFiles.push(
            {
              id: newFiles.length,
              size: fileNode.size,
              name: fileNode.name,
              type: fileNode.type,
              path: fileNode.path,
            }
        )
      }
      setData(newFiles)
    }
    setLoaded(dataProvider.loaded)
    setError(dataProvider.error)
  }, [path, dataProvider.data, isValid])
  return {data, error, loaded, refresh}
}
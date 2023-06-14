import {useEffect,useState} from 'react';

// eslint-disable-next-line
export const useGetStreamHandle = (apiUrl?: string) => {
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader | null | undefined>(null)
  const fetchStream = async (url: string) => {
    const fetchedResource = await fetch(url)
    if (!fetchedResource.body) {
      return
    }
    return fetchedResource.body.getReader();
  }
  useEffect(() => {
    if (apiUrl) {
      fetchStream(apiUrl).then(setStreamReader).catch(console.error)
    }
  }, [apiUrl])
  return [streamReader]
}

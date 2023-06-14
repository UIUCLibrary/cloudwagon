import {useEffect, useState} from 'react';
import {JobStreamState} from './useJobStream.types'
import {StreamApiData} from '../stream.types'
export async function* asyncIterableFromStream<T>(stream: ReadableStreamDefaultReader<T>): AsyncIterable<T> {
  try {
    while (true) {
      const {done, value} = await stream.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    stream.releaseLock();
  }
}


async function* decodeStream(stream: AsyncIterable<Uint8Array>) {
  const decoder = new TextDecoder('utf-8');

  for await (const buffer of stream) {
    const chunk = decoder.decode(buffer, {stream: true});

    try {
      const packet = JSON.parse(chunk)
      yield {data: packet, error: null}
    } catch (e: unknown) {
      yield {data: null, error: e ? e.toString(): null}
    }
  }
}

export const useJobStream = (streamHandleReader: ReadableStreamDefaultReader<Uint8Array> | null | undefined) => {
  const [state, setState] =
      useState<JobStreamState>({
            streamOpen: false,
            errors: [],
            data: [],
          }
      )
  const getData = async (reader: ReadableStreamDefaultReader) => {
    const streamIterator = asyncIterableFromStream(reader);
    let allData: StreamApiData[] = []
    let allErrors: string[] = []

    for await (const {data, error} of decodeStream(streamIterator)) {
      if (error) {
        allErrors = allErrors.concat(error)
      }

      if (data) {
        const unsortedData = allData.concat(data)
        allData = unsortedData.sort(
            (a, b) => {
              return a['order'] < b['order'] ? -1 : 1
            }
        )
      }

      setState(
          {
            streamOpen: true,
            errors: allErrors,
            data: allData,
          }
      )
    }
    setState(
        {
          streamOpen: false,
          errors: allErrors,
          data: allData,
        }
    )
  }
  useEffect(() => {
    if (streamHandleReader) {
      getData(streamHandleReader).then().catch();
    }
  }, [streamHandleReader]);
  return [state]
};
import {asyncIterableFromStream} from './useJobStream'
import {waitFor} from '@testing-library/react';
describe('asyncIterableFromStream', ()=>{
  const mockedStream = {
    read: () => {
      const response: ReadableStreamReadResult<string> = {done: true}
      return Promise.resolve(response)
    },
    releaseLock:  () => {},
  } as jest.Mocked<ReadableStreamDefaultReader<string>> ;
  test('releaseLock is called', async ()=>{
    jest.spyOn(mockedStream,'releaseLock')
    await waitFor(async ()=>{
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const num of asyncIterableFromStream(mockedStream)){}
    })
    expect(mockedStream.releaseLock).toHaveBeenCalled()
  })
})
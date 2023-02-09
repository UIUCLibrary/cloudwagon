import {asyncIterableFromStream} from '../frontend/src/JobProgressDialog'
import {waitFor} from '@testing-library/react';
describe('asyncIterableFromStream', ()=>{
  const mockedStream = {
    read: () => {return Promise.resolve({done: true})},
    releaseLock:  () => {},
  } as jest.Mocked<ReadableStreamDefaultReader<string>> ;
  test('releaseLock is called', async ()=>{
    jest.spyOn(mockedStream,'releaseLock')
    await waitFor(async ()=>{
      for await (const num of asyncIterableFromStream(mockedStream)){

      }
    })
    expect(mockedStream.releaseLock).toHaveBeenCalled()
  })
})
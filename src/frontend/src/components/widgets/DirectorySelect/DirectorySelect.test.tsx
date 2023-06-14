import '@testing-library/jest-dom'
import axios from 'axios';
import {IFile} from '../Widgets.types.tsx';
import {DirectorySelect} from './DirectorySelect.tsx';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('DirectorySelect', ()=>{
  beforeEach(()=>{
    mockedAxios.get.mockImplementation((url) => {
      if (url.startsWith('/api/files/exists')) {
        return Promise.resolve(
            {
              data:
                  {
                    exists: true
                  }
            });
      }
      return Promise.resolve();
    })
  })
  const onLoaded = jest.fn()
  const onRejected = jest.fn()
  const onAccepted = jest.fn()
  afterEach(()=>{
    onLoaded.mockReset()
    onAccepted.mockReset()
    onRejected.mockReset()
  })
  const directoryContents = {
    path: '/',
    contents: [
      {name: "t2", path: "/t2", type: "Directory", size: null}
    ] as IFile[]
  }
  const element = <DirectorySelect
      required={true}
      getDataHook={
        ()=>{
          return {data: directoryContents, error:'', loaded:true, update: ()=>{}}
        }
      }
      onReady={onLoaded}
      onRejected={onRejected}
      onAccepted={onAccepted}
      label="tester"
      parameters={{'selections': []}}
  />
  test('browse Button opens dialog', async ()=>{
    render(element)
    await waitFor(()=>expect(onLoaded).toBeCalled());
    fireEvent.click(screen.getByRole('button', {name: /browse/}));
    await waitFor(()=>{
      expect(screen.getByText('Select a Directory')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Cancel'))
    await waitFor(()=>{
      expect(onRejected).toBeCalled();
    })
  })
  describe('callbacks', ()=>{
    test('Accept button calls onAccepted', async ()=>{
      render(element)

      const browseButton = screen.getByRole('button', {name: /browse/})
      fireEvent.click(browseButton);
      await waitFor(()=>{
        expect(screen.getByText('t2')).toBeInTheDocument()
      })
      const selectedPathDisplay = screen.getByLabelText('selected path')
      fireEvent.click(screen.getByText('t2'));
      expect(selectedPathDisplay).toHaveTextContent("/t2")
      fireEvent.click(screen.getByText('Accept'));
      await waitFor(()=>expect(onAccepted).toBeCalled());
    })
    test('Cancel button calls onRejected', async ()=>{
      render(element)

      const browseButton = screen.getByRole('button', {name: /browse/})
      fireEvent.click(browseButton);
      await waitFor(()=>{
        expect(screen.getByText('t2')).toBeInTheDocument()
      })
      const selectedPathDisplay = screen.getByLabelText('selected path')
      fireEvent.click(screen.getByText('t2'));
      expect(selectedPathDisplay).toHaveTextContent("/t2")
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(()=>expect(onRejected).toBeCalled());

    })
  })
  describe('open dialog is reset dialog after close', ()=>{



    test('resets the directory name', async ()=>{
      render(element)

      const browseButton = screen.getByRole('button', {name: /browse/})
      fireEvent.click(browseButton);
      await waitFor(()=>{
        expect(screen.getByText('t2')).toBeInTheDocument()
      })
      const selectedPathDisplay = screen.getByLabelText('selected path')
      fireEvent.click(screen.getByText('t2'));
      expect(selectedPathDisplay).toHaveTextContent("/t2")
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(()=>expect(onRejected).toBeCalled());
      fireEvent.click(browseButton);
      expect(selectedPathDisplay).not.toHaveTextContent("/t2")
    })
    test('current path does not change', async ()=>{
      render(element)

      const browseButton = screen.getByRole('button', {name: /browse/})
      fireEvent.click(browseButton);
      const workingPathDisplay = screen.getByLabelText('working path')
      expect(workingPathDisplay).toHaveTextContent("/")
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(()=>expect(onRejected).toBeCalled());
      fireEvent.click(browseButton);
      expect(workingPathDisplay).toHaveTextContent("/")
    })
  })
})
import '@testing-library/jest-dom'
import {
  fireEvent,
  render,
  screen, waitFor,
} from '@testing-library/react';
import {
  SelectOption,
  DirectorySelect,
  CheckBoxOption,
  IFile, IAPIDirectoryContents,
} from '../Widgets'
import {FormEvent} from 'react';
import axios from 'axios';
jest.mock('axios');

describe('SelectOption', ()=>{
  it('Label is written', function () {
    render(
        <SelectOption label="tester" parameters={{'selections': []}}/>
    )
    expect(screen.getByLabelText('tester')).toBeInTheDocument()
  });
})
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
  const element = <>
    <DirectorySelect
        getDataHook={
          ()=>{
            return {data: directoryContents, error:'', loaded:true}
          }
        }
        onReady={onLoaded}
        onRejected={onRejected}
        onAccepted={onAccepted}
        label="tester"
        parameters={{'selections': []}}
    />
  </>
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
describe('CheckBoxOption', ()=>{
  test('default', ()=>{
    const onSubmit = (event: FormEvent<HTMLFormElement>)=>{
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement);
      let formProps = Object.fromEntries(formData);
      expect(formProps).toStrictEqual({foo: 'false'});
    }
    render(
        <>
          <form onSubmit={onSubmit}>
            <CheckBoxOption label={'foo'}/>
            <button type='submit'>Submit</button>
          </form>
        </>
    )
    fireEvent.click(screen.getByText('Submit'))
  })
  test('true', ()=>{
    const onSubmit = (event: FormEvent<HTMLFormElement>)=>{
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement);
      let formProps = Object.fromEntries(formData);
      expect(formProps).toStrictEqual({foo: 'true'});
    }
    render(
        <>
          <form onSubmit={onSubmit}>
            <CheckBoxOption label={'foo'}/>
            <button type='submit'>Submit</button>
          </form>
        </>
    )
    fireEvent.click(screen.getByLabelText('foo'));

    fireEvent.click(screen.getByText('Submit'))
  })
  test('false', ()=>{
    const onSubmit = (event: FormEvent<HTMLFormElement>)=>{
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement);
      let formProps = Object.fromEntries(formData);
      expect(formProps).toStrictEqual({foo: 'false'});
    }
    render(
        <>
          <form onSubmit={onSubmit}>
            <CheckBoxOption label={'foo'}/>
            <button type='submit'>Submit</button>
          </form>
        </>
    )
    fireEvent.click(screen.getByLabelText('foo'));
    fireEvent.click(screen.getByLabelText('foo'));
    fireEvent.click(screen.getByText('Submit'))
  })
})
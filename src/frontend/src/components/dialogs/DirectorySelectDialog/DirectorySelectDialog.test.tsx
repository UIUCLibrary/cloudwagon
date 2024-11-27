import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen, waitFor,
  within
} from '@testing-library/react';
import {DirectorySelectDialog} from './DirectorySelectDialog';
import {IAPIDirectoryContents} from '../../widgets';
import {createRef} from 'react';
import {FileSystemSelectDialogRef} from "../FileSystemSelectDialog";

describe('DirectorySelectDialog', ()=>{
  test('render simple no hook', async ()=>{
    const fetchingFunction = (path: string): Promise<IAPIDirectoryContents> => {
      const data = {
        path: path,
        contents: [
          {
            id: 1,
            "name": ".",
            "path": path,
            "type": "Directory",
            "size": null
          },
          {
            id: 2,
            "name": "more",
            "path": "/more",
            "type": "Directory",
            "size": null
          },
        ]
      }
      return Promise.resolve(data)
    }
    await waitFor(()=>render(<DirectorySelectDialog show={true} startingPath={'/'} fetchingFunction={fetchingFunction}/>))
    await waitFor(()=>expect(screen.getByRole('heading', {name: 'Select a Directory'})).toBeVisible())
  })
  test('handleClose is called when clicked the x in top', async ()=>{
    const fetchingFunction = (path: string): Promise<IAPIDirectoryContents> => {
      const data = {
        path: path,
        contents: [
          {
            id: 1,
            "name": ".",
            "path": path,
            "type": "Directory",
            "size": null
          },
          {
            id: 2,
            "name": "more",
            "path":"/more",
            "type": "Directory",
            "size": null
          },
        ]
      }
      return Promise.resolve(data)
    }
    const handleClose = jest.fn()
    await waitFor(()=>render(<DirectorySelectDialog show={true} onClose={handleClose} startingPath={'/'} fetchingFunction={fetchingFunction}/>))
    await waitFor(()=>fireEvent.click(screen.getByTestId('CloseIcon')))
    expect(handleClose).toBeCalled()
  })
  test('onRejected called when clicked cancel', async ()=>{
    const handleRejected = jest.fn()
    const fetchingFunction = (path: string): Promise<IAPIDirectoryContents> => {
      const data = {
        path: path,
        contents: [
          {
            id: 1,
            "name": ".",
            "path": path,
            "type": "Directory",
            "size": null
          },
          {
            id: 2,
            "name": "more",
            "path":"/more",
            "type": "Directory",
            "size": null
          },
        ]
      }
      return Promise.resolve(data)
    }
    await waitFor(()=>render(
        <DirectorySelectDialog show={true} startingPath={'/'} onRejected={handleRejected} fetchingFunction={fetchingFunction}/>
    ))
    // const errorConsole = jest.spyOn(console, 'error').mockImplementation(() => {});
    await waitFor(()=>fireEvent.click(screen.getByRole('button', {name: 'Cancel'})))
    expect(handleRejected).toBeCalled()
  })
  test('render data', async ()=>{
    const fetchingFunction = (path: string): Promise<IAPIDirectoryContents> => {
      const data = {
        path: path,
        contents: [
          {
            id: 1,
            "name": ".",
            "path": path,
            "type": "Directory",
            "size": null
          },
          {
            id: 2,
            "name": "more",
            "path":"/more",
            "type": "Directory",
            "size": null
          },
        ]
      }
      return Promise.resolve(data)
    }
    render(
        <DirectorySelectDialog show={true} startingPath={'/'} fetchingFunction={fetchingFunction}/>
    )
    await waitFor(()=>{
      return expect(screen.getByRole('gridcell', {name: 'more'})).toBeVisible()
    })
  })
  test('onAccepted calls selected with correct value', async ()=>{
    const fetchingFunction = (path: string): Promise<IAPIDirectoryContents> => {
      const data = {
            path: path,
            contents: [
              {
                id: 1,
                "name": ".",
                "path": path,
                "type": "Directory",
                "size": null
              },
              {
                id: 2,
                "name": "more",
                "path": "/more",
                "type": "Directory",
                "size": null
              },
            ]
          }
      return Promise.resolve(data)
    }
    const handleAccepted = jest.fn()
    await waitFor(()=>{
      render(
          <DirectorySelectDialog startingPath={'/'} show={true} fetchingFunction={fetchingFunction} onAccepted={handleAccepted}/>
      )
    })
    await waitFor(()=>screen.getByRole('gridcell',  {name: 'more'}))
    fireEvent.click(screen.getByRole('gridcell',  {name: 'more'}))
    jest.spyOn(console, 'error').mockImplementation(() => null);
    await waitFor(()=>fireEvent.click(screen.getByRole('button',  {name: 'Accept'})))
    await waitFor(()=>expect(handleAccepted).toBeCalledWith("/more"))
  })
  test('Files are not selectable', async ()=>{
    const fetchingFunction = (path: string) => {
      return Promise.resolve(
        {
          path: path,
          contents: [
            {
              id: 1,
              "name": ".",
              "path": path,
              "type": "Directory",
              "size": null
            },
            {
              id: 2,
              "name": "more",
              "path": "/more",
              "type": "Directory",
              "size": null
            },
            {
              id: 3,
              "name": "some_file.png",
              "path": "/some_file.png",
              "type": "File",
              "size": 1234869
            },
          ]
        })
    }
    render(<DirectorySelectDialog show={true} startingPath={'/'} fetchingFunction={fetchingFunction}/>)
    await waitFor(()=>expect(screen.getByRole('dialog')).toBeVisible())
    await waitFor(()=>expect(screen.getByRole('gridcell',  {name: 'some_file.png'})).toBeInTheDocument());
    fireEvent.click(screen.getByRole('gridcell',  {name: 'some_file.png'}))
    expect(
        within(
            screen.getByLabelText('selected path')
        ).queryByText("some_file.png")
    ).toBeNull()
  })
  describe("ref", ()=>{
  //
    test('selectedPath ref no click',  async ()=>{
      const ref = createRef<FileSystemSelectDialogRef>()
      const errorConsole = jest.spyOn(console, 'error').mockImplementation(() => null);

      const fetchingFunction = (path: string) => {
        return Promise.resolve({
          path: path,
          contents: [
            {
              id: 1,
              "name": ".",
              "path": path,
              "type": "Directory",
              "size": null
            },
            {
              id: 2,
              "name": "more",
              "path":"/some_path/more",
              "type": "Directory",
              "size": null
            },
          ]
        })
      }
      await waitFor(()=>render(<DirectorySelectDialog show={true} startingPath={null} ref={ref} fetchingFunction={fetchingFunction}/>))
      await waitFor(()=>expect(ref.current.selectedPath).toBeNull())
      expect(errorConsole).toBeCalled()
    })
    test('selectedPath ref no click with data hook defaults to data path value', async ()=>{
      const fetchingFunction = (path: string) => {
        return Promise.resolve({
          path: path,
          contents: [
            {
              id: 1,
              "name": ".",
              "path": "/some_path",
              "type": "Directory",
              "size": null
            },
            {
              id: 2,
              "name": "more",
              "path":"/some_path/more",
              "type": "Directory",
              "size": null
            },
          ]
        })
      }
      const ref = createRef<FileSystemSelectDialogRef>()
      await waitFor(()=>{

        render(
            <DirectorySelectDialog show={true} ref={ref} startingPath={'/some_path'} fetchingFunction={fetchingFunction}/>
        )
      })
      await waitFor(()=>expect(ref.current.selectedPath).toBe('/some_path'))
    })
    test('cwd is is based on the value', async ()=>{
      const fetchingFunction = (path: string): Promise<IAPIDirectoryContents> => {
        const data = {
          path: path,
          contents: [
            {
              id: 1,
              "name": ".",
              "path": "/some_path",
              "type": "Directory",
              "size": null
            },
            {
              id: 2,
              "name": "more",
              "path":"/some_path/more",
              "type": "Directory",
              "size": null
            },
          ]
        }
        return Promise.resolve(data)
      }
      const ref = createRef<FileSystemSelectDialogRef>()
      await waitFor(()=>{

        render(
            <DirectorySelectDialog show={true} ref={ref} startingPath={'/some_path'} fetchingFunction={fetchingFunction}/>
        )
      })
      await waitFor(()=>expect(ref.current.currentPath).toBe('/some_path'))

    })
    test('selectedPath ref', async ()=>{
      const fetchingFunction = (path: string) => {
        return Promise.resolve({
              path: path,
              contents: [
                {
                  id: 1,
                  "name": ".",
                  "path":"/",
                  "type": "Directory",
                  "size": null
                },
                {
                  id: 2,
                  "name": "more",
                  "path":"/more",
                  "type": "Directory",
                  "size": null
                },
              ]
            }
        )
      }
      const ref = createRef<FileSystemSelectDialogRef>()
      const handleAccepted = jest.fn()
      render(
          <DirectorySelectDialog show={true} ref={ref} fetchingFunction={fetchingFunction} startingPath={'/'} onAccepted={handleAccepted}/>
      )

      await waitFor(()=>expect(screen.getByRole('gridcell', {name: 'more'})).toBeInTheDocument())
      fireEvent.click(screen.getByRole('gridcell', {name: 'more'}))
      expect(ref.current.selectedPath).toBe('/more')
    })
  })
  test('dialog on close does not retain value', async ()=>{
    const fetchingFunction = (path: string) => {
      const data = {
        '/': {
          path: '/',
          contents: [
            {
              id: 1,
              "name": ".",
              "path": "/",
              "type": "Directory",
              "size": null
            },
            {
              id: 2,
              "name": "some_path",
              "path": "/some_path",
              "type": "Directory",
              "size": null
            }
          ]
        },
        '/some_path':{
          path: '/some_path',
          contents: [
            {
              id: 1,
              "name": ".",
              "path": "/some_path",
              "type": "Directory",
              "size": null
            },
            {
              id: 2,
              "name": "..",
              "path": "/",
              "type": "Directory",
              "size": null
            },
            {
              id: 3,
              "name": "more",
              "path": "/some_path/more",
              "type": "Directory",
              "size": null
            },
          ]
        }
      }
      const result = data[path]
      return Promise.resolve(result)
    }
    const ref = createRef<FileSystemSelectDialogRef>()
    await waitFor(()=>{})
    render(
        <DirectorySelectDialog show={true} ref={ref} fetchingFunction={fetchingFunction} startingPath={'/'}/>
    )
    await waitFor(()=>fireEvent.doubleClick(screen.getByRole('gridcell', {name: 'some_path'})))
    await waitFor(()=>expect(screen.getByRole('gridcell', {name: 'more'})).toBeVisible())
    await waitFor(()=>fireEvent.click(screen.getByRole('button', {name: 'Cancel'})))
    expect(ref.current.selectedPath).toBe(null)
    expect(ref.current.currentPath).toBe(null)
      // return expect(screen.getByRole('cell', {name: 'some_path'})).toBeVisible()
    // })
  })
})
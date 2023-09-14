import '@testing-library/jest-dom';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import FileManagementPage from './FileManagementPage';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {IAPIRequest} from '../../widgets/FileManager';
import BreadCrumbRouteLink from "./BreadCrumbRouteLink.tsx";
import DisplayDirectoryItemAsRouteLink, {getDisplay, getNodeIcon, getUrl} from "./DisplayDirectoryItemAsRouteLink.tsx";
import {IFileNode} from './FileManagment.types.ts'
import Folder from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import {ReactElement} from 'react'
describe('FileManagementPage', ()=>{
  const dataGetter = async (path: string): Promise<IAPIRequest> =>{
    return Promise.resolve({
      "path": path,
      "contents": [
        {
          "name": ".",
          "path": path,
          "type": "Directory",
          "size": null
        },
        {
          "name": "more",
          "path": "/more",
          "type": "Directory",
          "size": null
        },
      ]
    })
  }
  test('placeholder', async ()=>{
    render(
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<FileManagementPage contentGetter={dataGetter}/>}/>
          </Routes>
        </BrowserRouter>
    )
    await waitFor(()=>expect(screen.getByRole('link', {name: 'more/'})).toBeInTheDocument())
  })

  test('open add file dialog box', async ()=>{

    render(
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<FileManagementPage contentGetter={dataGetter}/>}/>
          </Routes>
        </BrowserRouter>
    )
    await waitFor(()=>expect(screen.getByRole('link', {name: 'more/'})).toBeInTheDocument())
    expect(screen.queryByRole('dialog', {name: 'Add Files'})).toBeNull()
    fireEvent.click(screen.getByRole('menuitem', {name: "Add Files"}));
    await waitFor(()=> {
      expect(screen.getByRole('dialog', {name: 'Add Files'})).toBeInTheDocument()
    });

  })

})
describe("BreadCrumbRouteLink", ()=>{
  const testPath = "/some/path"
  test('display', ()=>{
    render(
        <BrowserRouter>
          <BreadCrumbRouteLink path={"/some/path/"} display={testPath} onClick={jest.fn()}/>
        </BrowserRouter>
    )
    expect(screen.getByText(testPath)).toBeInTheDocument()
  })
  test('on click callback', ()=>{
    const onClick = jest.fn()
    render(
        <BrowserRouter>
          <BreadCrumbRouteLink path={"/some/path/"} display={testPath} onClick={onClick}/>
        </BrowserRouter>
    )
    fireEvent.click(screen.getByText(testPath))
    expect(onClick).toBeCalled()
  })
})

describe('DisplayDirectoryItemAsRouteLink', ()=>{
    describe('DisplayDirectoryItemAsRouteLink', ()=>{

      test('on click directory', ()=>{
        const onClick = jest.fn()
        render(
            <BrowserRouter>
                <DisplayDirectoryItemAsRouteLink
                    onClick={onClick}
                    pwd={'/'}
                    file={{
                        "name": "path",
                        'path': "/mypath",
                        'type': "Directory",
                        'size':  null,
                  }
                }
                />
            </BrowserRouter>
        )
        fireEvent.click(screen.getByText("path/"))
        expect(onClick).toBeCalledWith("/mypath")
      })
    })
    const testFolders: [
        IFileNode,
        {
            display: string,
            url: string
            icon: ReactElement
        }
    ][] =
        [
        [
            {
                "name": "another thing",
                'path': "/mypath",
                'type': "some other type not yet defined",
                'size':  null,
            },
            {
                display: "another thing",
                url: "another thing",
                icon: <></>
            }
        ],
        [
            {
                "name": "my file",
                'path': "/mypath",
                'type': "File",
                'size':  12345,
            },
            {
                display: "my file",
                url: "my file",
                icon: <InsertDriveFileIcon/>
            }
        ],
        [
            {
                "name": "somePath",
                'path': "/somePath",
                'type': "Directory",
                'size':  null,
            },
            {
                display: "somePath/",
                url: "somePath/",
                icon: <Folder/>
            },
        ],
        [
            {
                "name": ".",
                'path': "/somePath",
                'type': "Directory",
                'size':  null,
            },
            {
                display: ".",
                url: "",
                icon: <Folder/>
            }
        ],
        [
            {
                "name": "..",
                'path': "/somePath",
                'type': "Directory",
                'size':  null,
            },
            {
                display: "..",
                url: "../",
                icon: <Folder/>
            }
        ]
    ]
    describe('getDisplay', ()=>{
        test.each(testFolders)('types %s', (data: IFileNode, expected)=>{
            expect(getDisplay(data)).toEqual(expected.display)
      })
    })
    describe('getDisplay', ()=>{
        test.each(testFolders)('types %s', (data: IFileNode, expected)=>{
            expect(getUrl(data)).toEqual(expected.url)
        })
    })
    describe('getNodeIcon', ()=>{
        test.each(testFolders)('types %s', (data: IFileNode, expected)=>{
            expect(getNodeIcon(data)).toEqual(expected.icon)
        })
    })
})


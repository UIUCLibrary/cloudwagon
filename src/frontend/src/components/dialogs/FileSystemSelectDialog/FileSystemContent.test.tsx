import '@testing-library/jest-dom';
import {
  FileSystemContentRef,
  FolderContentBrowser
} from './FolderContentBrowser.tsx';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {IFile} from '../../widgets';
import {createRef} from 'react';

describe('FileSystemContent', ()=>{
  test('ommitting folderContent is 0 rows', ()=>{
    const ref: React.RefObject<FileSystemContentRef> = createRef()
    render(
        <FolderContentBrowser
            loading={false}
            ref={ref}
        />
    )
    expect(ref.current.rowCount).toBe(0)
  })
  test('simple item render', ()=>{
    render(
        <FolderContentBrowser
            folderContent={[]}
            loading={false}
        />
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
  })
  test('render files names', ()=>{
    const files: IFile[] = [
      {
        id: 1,
        size: null,
        name: "dummy",
        type: "Directory",
        path: "./dummy"
      }
    ]
    render(
        <FolderContentBrowser
            folderContent={files}
            loading={false}
        />
    )
    expect(
        within(
            screen.getByRole('row', {name: "dummy Directory"})
        ).getByRole('gridcell', {name: 'dummy'})
    ).toBeInTheDocument()
  })
  test('test item accepted callback', ()=>{
    const files: IFile[] = [
      {
        id: 1,
        size: null,
        name: "dummy",
        type: "Directory",
        path: "./dummy"
      }
    ]
    const handleItemAccepted = jest.fn()
    render(
        <FolderContentBrowser
            folderContent={files}
            loading={false}
            onItemAccepted={handleItemAccepted}
        />
    )
    const dummyRow = screen.getByRole('row', {name: "dummy Directory"})
    fireEvent.click(dummyRow)
    fireEvent.dblClick(dummyRow)
    expect(handleItemAccepted).toBeCalledWith(files[0])
  })
  test('test item sellected callback', ()=>{
    const files: IFile[] = [
      {
        id: 1,
        size: null,
        name: "dummy",
        type: "Directory",
        path: "./dummy"
      }
    ]
    const handleItemSelected = jest.fn()
    render(
        <FolderContentBrowser
            folderContent={files}
            loading={false}
            onItemSelected={handleItemSelected}
        />
    )
    const dummyRow = screen.getByRole('row', {name: "dummy Directory"})
    fireEvent.click(dummyRow)
    expect(handleItemSelected).toBeCalledWith(files[0])
  })
  test('select row', ()=>{
    const files: IFile[] = [
      {
        id: 0,
        size: null,
        name: "foo",
        type: "Directory",
        path: "./dummy"
      },
      {
        id: 1,
        size: null,
        name: "bar",
        type: "Directory",
        path: "./bar"
      }
    ]
    render(
        <FolderContentBrowser
            folderContent={files}
            // path={''}
            loading={false}
        />
    )
    fireEvent.click(screen.getByRole('row', {name: "bar Directory"}))
    expect(
          screen.getByRole('row', {selected: true})
    ).toHaveTextContent('bar')
  })
  test('row Count', ()=>{
    const files: IFile[] = [
      {
        id: 0,
        size: null,
        name: "foo",
        type: "Directory",
        path: "./dummy"
      },
      {
        id: 1,
        size: null,
        name: "bar",
        type: "Directory",
        path: "./bar"
      }
    ]
    const ref: React.RefObject<FileSystemContentRef> = createRef()
    render(
        <FolderContentBrowser
            folderContent={files}
            ref={ref}
            loading={false}
        />
    )
    fireEvent.click(screen.getByRole('row', {name: "bar Directory"}))
    expect(
          ref.current.rowCount
    ).toBe(2)
  })
  test('The ref points selectedItem item after row has been clicked', ()=>{
    const files: IFile[] = [
      {
        id: 0,
        size: null,
        name: "foo",
        type: "Directory",
        path: "./dummy"
      },
      {
        id: 1,
        size: null,
        name: "bar",
        type: "Directory",
        path: "./bar"
      }
    ]
    const contentRef: React.RefObject<FileSystemContentRef> = createRef()
    render(
        <FolderContentBrowser
            folderContent={files}
            ref={contentRef}
            loading={false}
        />
    )
    expect(contentRef.current.selectedItem).toBeNull()
    fireEvent.click(screen.getByRole('row', {name: "bar Directory"}))
    expect(contentRef.current.selectedItem).toBe(files[1])
  })
})
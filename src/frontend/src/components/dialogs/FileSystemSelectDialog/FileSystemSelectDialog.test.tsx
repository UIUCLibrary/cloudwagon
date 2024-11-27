import '@testing-library/jest-dom';
import {FileSystemSelectDialog, FileSystemSelectDialogRef} from './FileSystemSelectDialog'
import {fireEvent, render, screen} from "@testing-library/react";
import {createRef, RefObject} from "react";
import {IFile} from "../../widgets";

describe('FileSystemSelectDialog', ()=>{
    test('title', ()=>{
        render(
            <FileSystemSelectDialog
                title={'dummy title'}
                cwd={'/'}
                show={true}
            />
        )
        expect(screen.getByRole('heading')).toHaveTextContent('dummy title')
    })
    describe('ref', ()=>{

        test('selectedItem defaults to null if no cwd', ()=>{
            const dummyRef: RefObject<FileSystemSelectDialogRef> = createRef();
            render(
                <FileSystemSelectDialog
                    title={'dummy title'}
                    ref={dummyRef}
                    show={true}
                />
            )
            expect(dummyRef.current.selectedItem.path).toBeNull()
        })
        test('selectedItem defaults to current working directory', ()=>{
            const dummyRef: RefObject<FileSystemSelectDialogRef> = createRef();
            render(
                <FileSystemSelectDialog
                    title={'dummy title'}
                    cwd={'/'}
                    ref={dummyRef}
                    show={true}
                />
            )
            expect(dummyRef.current.selectedItem.path).toBe('/')
        })
        test('selectedItem selection', ()=>{
            const folderContent: IFile[] = [
                {
                    id: 0,
                    name: '123',
                    path: "/123",
                    type: "Directory",
                    size: null
                }
            ]
            const dummyRef: RefObject<FileSystemSelectDialogRef> = createRef();
            render(
                <FileSystemSelectDialog
                    title={'dummy title'}
                    folderContent={folderContent}
                    cwd={'/'}
                    ref={dummyRef}
                    show={true}
                />
            )
            fireEvent.click(screen.getByRole('gridcell', {name: "123"}))
            expect(dummyRef.current.selectedItem.name).toBe("123")
        })
    })
})
import '@testing-library/jest-dom';
import {itemIsSelectable, handleBrowserInvalidSelection} from './FolderContentBrowser'
describe('onlyCurrentAndParentsFolders', ()=>{
    test.each([
        [
            {
            size: null,
            name: ".",
            type: "Directory",
            path: '/'
            },
            true,
            null
        ],
        [
            {
                size: null,
                name: "someNestedFolder",
                type: "Directory",
                path: '/someNestedFolder'
            },
            true,
            null
        ],
        [
            {
                size: null,
                name: "someNestedFolder",
                type: "Directory",
                path: '/someNestedFolder'
            },
            false,
            () => {return false}
        ],
        [ // Selecting the current directory should still be valid
            {
                size: null,
                name: ".",
                type: "Directory",
                path: '/'
            },
            true,
            () => {return false}
        ]
        ])('%s is %s', (item, expectedResult: boolean, itemSelectionFilter?)=>{
        expect(itemIsSelectable(item, itemSelectionFilter)).toEqual(expectedResult)
    })
})

describe('handleBrowserInvalidSelection', ()=>{
    const row = {
        size: null,
        name: ".",
        type: "Directory",
        path: '/'
    }
    test('defaults does not throw an error', ()=>{
        expect(()=>handleBrowserInvalidSelection(row)).not.toThrowError()
    })
    test('calls callback if passed to function', ()=>{
        const handler = jest.fn();
        handleBrowserInvalidSelection(row, handler)
        expect(handler).toBeCalled()
    })
})
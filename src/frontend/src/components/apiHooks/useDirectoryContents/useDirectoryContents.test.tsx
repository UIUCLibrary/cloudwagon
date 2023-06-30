import {useDirectoryContents, axiosFetchFileContentsFunction} from "./useDirectoryContents";
import {renderHook, waitFor} from "@testing-library/react";
import {AxiosResponse} from "axios";
import {IAPIDirectoryContents} from "../../widgets";
describe('useDirectoryContents', ()=>{
    describe('not active', ()=>{
        test('when not active, content is null', ()=>{
            const {result} = renderHook(()=>useDirectoryContents('/', false))
            expect(result.current.contents).toBeNull()
        })
        test('when not active, fetchingFunction is not called', ()=>{
            const fetchFunction = jest.fn()
            renderHook(()=>useDirectoryContents('/', false, fetchFunction))
            expect(fetchFunction).not.toBeCalled()
        })
    })
    describe('fetching', ()=>{
        const mockFetchFunction = jest.fn(
            (path: string)=>Promise.resolve(
                {
                    path: path,
                    contents: [
                        {
                            size: null,
                            name: '.',
                            type: 'Directory',
                            path: '/'
                        }
                    ]
                }
            )
        )
        afterEach(()=>{
            jest.clearAllMocks();
        })
        test('fetching calls fetchingFunction', async ()=>{
            await waitFor(()=> {
                renderHook(() => useDirectoryContents('/', true, mockFetchFunction))
            })
            await waitFor(()=>expect(mockFetchFunction).toHaveBeenCalledTimes(1))
        })
        test('fetching calls fetchingFunction after refresh', async ()=>{
            await waitFor(()=> {
                const {result} = renderHook(() => useDirectoryContents('/', true, mockFetchFunction))
                result.current.refresh()
            })
            await waitFor(()=>expect(mockFetchFunction).toHaveBeenCalledTimes(2))
        })
        test('fetching test loading contents', async ()=>{
            const timedMockFetchFunction = async (path: string)=> {
                return new Promise<IAPIDirectoryContents>(resolve => {
                    resolve({
                            path: path,
                            contents: [
                                {
                                    size: null,
                                    name: '.',
                                    type: 'Directory',
                                    path: '/'
                                }
                            ]
                        })
                })
            }
            const {result} = renderHook(()=>useDirectoryContents('/', true, timedMockFetchFunction))
            expect(result.current.loading).toBe(true)
            await waitFor(()=>expect(result.current.loading).toBe(false))
        })
        test('fetching sets contents', async ()=>{
            const {result} = renderHook(()=>useDirectoryContents('/', true, mockFetchFunction))
            await waitFor(()=>expect(result.current.loading).toBe(false))
            expect(result.current.contents).toEqual([
                {
                    id: 0,
                    size: null,
                    name: '.',
                    type: 'Directory',
                    path: '/'
                }
            ])
        })
    })
    describe("errors",()=>{
        test('error message if running active without a path', ()=>{
            const fetchFunction = jest.fn(
                (path: string)=>Promise.resolve(
                    {
                        path: path,
                        contents: [
                            {
                                size: null,
                                name: '.',
                                type: 'Directory',
                                path: '/'
                            }
                        ]
                    }
                )
            )
            const {result} = renderHook(()=>useDirectoryContents(null, true, fetchFunction))
            expect(result.current.error).not.toBeNull()
        })
        test('error message for bad data', ()=>{
            const fetchFunction = jest.fn(
                ()=> {
                    throw Error('something bad happened')
                }
            )
            const {result} = renderHook(()=>useDirectoryContents('/', true, fetchFunction))
            expect(result.current.error).not.toBeNull()
            expect(result.current.error.message).toEqual('something bad happened')
        })
    })
})
describe('axiosFetchFileContentsFunction' ,()=>{
    it.each([
        {
            path: '/',
            contents: [
                {
                    foo: null,
                    bar: '.',
                    baz: 'bad data'
                }
            ]
        },
        {
            contents: []
        },
        {
            path: '/',
            contents: '[]'
        },
        {
            path: '/',
        }
    ])('Invalid data caught for %s', async (data) =>{
        const mockFunction = jest.fn(
            ()=>Promise.resolve<AxiosResponse>({
                data: data,
                status: 200,
                statusText: "ok",
                headers: {},
                config: {},
            })
        )
        await expect(axiosFetchFileContentsFunction('/', mockFunction)).rejects.not.toBeNull()
    })
    test('working', async ()=>{
        const mockFunction = jest.fn(
            (url: string)=>Promise.resolve<AxiosResponse>({
                data: {
                    path: url,
                    contents: [
                        {
                            size: null,
                            name: '.',
                            type: 'Directory',
                            path: '/'
                        }
                    ]
                },
                status: 200,
                statusText: "ok",
                headers: {},
                config: {},
            })
        )
        await expect(axiosFetchFileContentsFunction('/', mockFunction)).resolves.not.toBeNull()
    })
})
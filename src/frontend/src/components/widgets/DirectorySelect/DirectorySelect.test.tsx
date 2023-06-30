import {jest, test} from '@jest/globals';

import '@testing-library/jest-dom'
import axios from 'axios';
import {IAPIDirectoryContents,} from '../Widgets.types.tsx';
import {DirectorySelect} from './DirectorySelect.tsx';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('DirectorySelect', () => {
    beforeEach(() => {
        mockedAxios.get.mockImplementation((url: string): Promise<any> => {
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
    afterEach(() => {
        onLoaded.mockReset()
        onAccepted.mockReset()
        onRejected.mockReset()
    })
    const myHook = jest.fn<(path: string) => Promise<IAPIDirectoryContents>>().mockResolvedValue({
        path: '/',
        contents: [
            {name: "t2", path: `/t2`, type: "Directory", size: null}
        ]
    });
    const element = <DirectorySelect
        required={true}
        fetchingFunction={myHook}
        onRejected={onRejected}
        onAccepted={onAccepted}
        label="tester"
        parameters={{'selections': []}}
    />
    test('browse Button opens dialog', async () => {
        render(element)
        fireEvent.click(screen.getByRole('button', {name: /browse/}));
        await waitFor(() => {
            expect(screen.getByText('Select a Directory')).toBeInTheDocument()
        })
        fireEvent.click(screen.getByText('Cancel'))
        await waitFor(() => {
            expect(onRejected).toBeCalled();
        })
    })
    describe('callbacks', () => {
        test('Accept button calls onAccepted', async () => {
            render(element)
            fireEvent.click(screen.getByRole('button', {name: /browse/}));
            await waitFor(() => {
                expect(screen.getByText('t2')).toBeInTheDocument()
            })
            fireEvent.click(screen.getByText('t2'));
            expect(screen.getByLabelText('selected path')).toHaveTextContent("t2")
            fireEvent.click(screen.getByText('Accept'));
            await waitFor(() => expect(onAccepted).toBeCalled());
        })
        test('Cancel button calls onRejected', async () => {
            render(element)
            fireEvent.click(screen.getByRole('button', {name: /browse/}));
            await waitFor(()=>expect(screen.getByRole('dialog')).toBeVisible())
            await waitFor(() => expect(screen.getByText('t2')).toBeInTheDocument())
            fireEvent.click(screen.getByText('t2'));
            expect(screen.getByLabelText('selected path')).toHaveTextContent("t2")
            fireEvent.click(screen.getByText('Cancel'));
            await waitFor(() => expect(onRejected).toBeCalled());

        })
    })
    describe('open dialog is reset dialog after close', () => {
        test('resets the directory name', async () => {
            await waitFor(() => render(element))

            const browseButton = await screen.getByRole('button', {name: /browse/})
            fireEvent.click(browseButton);
            expect(screen.getByRole('dialog')).toBeVisible()
            await waitFor(() => expect(screen.getByText('t2')).toBeVisible());
            fireEvent.click(screen.getByText('t2'));
            expect(screen.getByLabelText('selected path')).toHaveTextContent("t2")
            fireEvent.click(screen.getByText('Cancel'));
            await waitFor(() => expect(onRejected).toBeCalled());
            await waitFor(() => fireEvent.click(browseButton))
            await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible())
            expect(screen.getByLabelText('selected path')).not.toHaveTextContent("t2")
        })

        test('current path does not change', async () => {
            render(element)
            const browseButton = screen.getByRole('button', {name: /browse/})
            await waitFor(() => fireEvent.click(browseButton));
            await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible())
            const workingPathDisplay = screen.getByLabelText('working path')
            expect(workingPathDisplay).toHaveTextContent("/")
            fireEvent.click(screen.getByText('Cancel'));
            await waitFor(() => expect(onRejected).toBeCalled());
            await waitFor(() => fireEvent.click(browseButton));
            await waitFor(() => expect(workingPathDisplay).toHaveTextContent("/"))
        })
    })
    test('cancel dialog reverts text', async () => {
        render(element)
        const textBox = screen.getByRole('textbox', {name: 'tester'})
        await waitFor(() => {
            fireEvent.change(textBox, {target: {value: '/t2'}})
            return expect(textBox).toHaveValue('/t2')
        })
        await waitFor(() => fireEvent.click(screen.getByRole('button', {name: /browse/})));
        await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible())
        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(textBox).toHaveValue('/t2')
    })
    test('existing text is passed to hook', async () => {
        const mockFetchingHook = jest.fn((path: string) => {
            const data = {
                '/': {
                    path: '/',
                    contents: [
                        {name: ".", path: `/`, type: "Directory", size: null},
                        {name: "t2", path: `/t2`, type: "Directory", size: null},
                        {name: "someFolder", path: `/someFolder`, type: "Directory", size: null},
                    ]
                },
                '/someFolder': {
                    path: '/someFolder',
                    contents: [
                        {name: "..", path: `/`, type: "Directory", size: null},
                        {name: ".", path: `/someFolder`, type: "Directory", size: null},
                        {name: "data", path: `/someFolder/data`, type: "Directory", size: null},
                    ]
                },
            }
            return Promise.resolve(data[path])
        })
        render (
            <DirectorySelect
                required={true}
                fetchingFunction={mockFetchingHook}
                onRejected={jest.fn()}
                onAccepted={jest.fn()}
                label="tester"
                parameters={{'selections': []}}
            />
        )
        await waitFor(()=>fireEvent.change(screen.getByRole('textbox', {name: 'tester'}), {target: {value: '/someFolder'}}))
        expect(screen.getByRole('textbox', {name: 'tester'})).toHaveValue('/someFolder')
        await waitFor(() => fireEvent.click(screen.getByRole('button', {name: /browse/})));
        await waitFor(() => expect(mockFetchingHook).toBeCalledWith('/someFolder'))
    })
    describe('hook calling', () => {
        test('hook not called if dialog box not opened', () => {
            const mockFetchingHook = jest.fn<(path: string) => Promise<IAPIDirectoryContents>>().mockResolvedValue({
                path: '/',
                contents: [
                    {name: "t2", path: `/t2`, type: "Directory", size: null}
                ]
            });
            render(
                <DirectorySelect
                    required={true}
                    fetchingFunction={mockFetchingHook}
                    onRejected={jest.fn()}
                    onAccepted={jest.fn()}
                    label="tester"
                    parameters={{'selections': []}}
                />
            )
            expect(mockFetchingHook).not.toBeCalled()
        })
        test('hook called if dialog box is opened',  async () => {
            const mockFetchingHook = jest.fn<(path: string) => Promise<IAPIDirectoryContents>>().mockResolvedValue({
                path: '/',
                contents: [
                    {name: "t2", path: `/t2`, type: "Directory", size: null}
                ]
            });
            render(
                <DirectorySelect
                    required={true}
                    fetchingFunction={mockFetchingHook}
                    onRejected={jest.fn()}
                    onAccepted={jest.fn()}
                    label="tester"
                    parameters={{'selections': []}}
                />
            )
            expect(mockFetchingHook).not.toBeCalled()
            await waitFor(()=>fireEvent.click(screen.getByRole('button', {name: /browse/})));
            await waitFor(()=>expect(mockFetchingHook).toBeCalled());
        })
    })
})
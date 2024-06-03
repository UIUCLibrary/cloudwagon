import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    waitForElementToBeRemoved
} from '@testing-library/react';

import SubmitJob from './SubmitJob.tsx';
import {GetWidget} from './GetWidget';
import {WidgetApi, Workflow, WorkflowDetails} from './SubmitJob.types'
import axios from 'axios';
import {useEffect, useState} from "react";

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SubmitJob', () => {
    beforeEach(() => {
        mockedAxios.get.mockImplementation((url) => {
            if (url === '/api/list_workflows') {
                return Promise.resolve(
                    {
                        data:
                            {
                                workflows: [
                                    {
                                        name: 'Dummy Workflow',
                                        id: 1
                                    },
                                ]
                            }
                    });
            }
            if (url === '/api/workflow?name=Dummy%20Workflow') {
                return Promise.resolve(
                    {
                        data: {
                            workflow: {
                                name: "Dummy Workflow",
                                description: "something goes here",
                                parameters: [
                                    {
                                        widget_type: "DirectorySelect",
                                        label: "input"
                                    },
                                    {
                                        widget_type: "ChoiceSelection",
                                        label: "Image File Type",
                                        placeholder_text: "Select an Image Format",
                                        selections: [
                                            "JPEG 2000",
                                            "TIFF"
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                );
            }
            return Promise.resolve();
        });
    });
    const useDummyWorkflowHook = ()=>{
        const [value, setValue] = useState<Workflow[] | null>(null)
        const [loading, setLoading] = useState(true)
        const doStuff = async ()=>{
            setValue([
                {id: 1, name:"Dummy Workflow"}
            ])
        }
        useEffect(() => {
            doStuff().then(
                ()=>{setLoading(false)}
            )
        }, []);

        return {loading: loading, data: value, error: null}
    }
    test('populate workflows', async () => {
        render(
            <>
                <SubmitJob
                    useWorkflowsListHook={useDummyWorkflowHook}
                    useWorkflowMetadataHook={()=>(
                        {loading: true, data: null, errors: null}
                    )}
                />
            </>
        );
        await waitFor(() => {
            return waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
        });
        fireEvent.mouseDown(await screen.findByRole('combobox'))
        expect(await screen.findByRole('option', {name: "Dummy Workflow"})).toBeInTheDocument()
    })
    test('select existing', async () => {
        render(
            <SubmitJob
                workflowName='Dummy Workflow'
                useWorkflowsListHook={useDummyWorkflowHook}
                useWorkflowMetadataHook={()=>(
                    {loading: true, data: null, errors: null}
                )}
            />
        );
        await waitFor(() => {
            return waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
        });
        expect(screen.getByText('Dummy Workflow')).toBeInTheDocument()
    })
    const testCases = [
        [true, null, 'description-skeleton', true],
        [true, null, 'settings-skeleton', true],
        [
            false,
            {
                description: "some description for Dummy Workflow",
                name: "Dummy Workflow",
                parameters: [
                    {widget_type: "BooleanSelect", label: "I'm a selection"}
                ]
            },
            'description-skeleton',
            false
        ],
        [
            false,
            {
                description: "some description for Dummy Workflow",
                name: "Dummy Workflow",
                parameters: [
                    {widget_type: "BooleanSelect", label: "I'm a selection"}
                ]
            },
            'settings-skeleton',
            false
        ],
    ]
    test.each(
        [
            [true, null, 'description-skeleton', true],
            [true, null, 'settings-skeleton', true],
            [
                false,
                {
                    description: "some description for Dummy Workflow",
                    name: "Dummy Workflow",
                    parameters: [
                        {widget_type: "BooleanSelect", label: "I'm a selection"}
                    ]
                },
                'description-skeleton',
                false
            ],
            [
                false,
                {
                    description: "some description for Dummy Workflow",
                    name: "Dummy Workflow",
                    parameters: [
                        {widget_type: "BooleanSelect", label: "I'm a selection"}
                    ]
                },
                'settings-skeleton',
                false
            ],
        ]
    )(
        'skeletons shown for the Settings when metadata is loading is %s',
        (loading: boolean, data: WorkflowDetails , testId: string, expected)=>{
        render(
            <SubmitJob
                workflowName='Dummy Workflow'
                useWorkflowsListHook={()=>({loading: false, data: [{id: 1, name: "Dummy Workflow"}], error: null})}
                useWorkflowMetadataHook={()=>(
                    {loading: loading, data: data, errors: null}
                )}
            />
        );
        fireEvent.mouseDown(screen.getByLabelText("Workflow"))
        fireEvent.click(screen.getByRole("option", {name: "Dummy Workflow"}))
        const expected_result = expect(screen.queryByTestId(testId))
        expected ? expected_result.toBeInTheDocument(): expected_result.not.toBeInTheDocument()
    })
})

describe('WorkflowParams', () => {
    it.each([
        [
            'Choice selection',
            {
                widget_type: 'ChoiceSelection',
                label: 'Choice selection',
                selections: ['1', '2']
            }
        ],
        [
            'Boolean',
            {
                widget_type: 'BooleanSelect',
                label: 'bool selection',
            }
        ],
        [
            'FileSelect',
            {
                widget_type: 'FileSelect',
                label: 'file selection',
            }
        ],
        // [
        //   'DirectorySelect',
        //   {
        //     widget_type: 'DirectorySelect',
        //     label: 'directory selection',
        //   }
        // ]
    ])('testing label matches %p', async (name: string, metadata: WidgetApi) => {
        mockedAxios.get.mockImplementation((url) => {
            if (url.startsWith('/api/files')) {
                return Promise.resolve(
                    {
                        data:
                            {
                                contents: [],
                                path: '/'
                            }
                    });
            }
            return Promise.resolve();
        });
        render(<GetWidget {...metadata}/>)
        await waitFor(() => {
            expect(screen.getByLabelText(metadata.label)).toBeInTheDocument()
        })
    })
})

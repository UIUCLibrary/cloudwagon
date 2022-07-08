import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved
} from '@testing-library/react';
import SubmitJob, {WorkflowParams, WidgetApi} from '../frontend/src/SubmitJob';
import axios from 'axios';

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
                      'Dummy Workflow',
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
  test('populate workflows', async () => {

    render(
        <SubmitJob/>
    );
    await waitFor(() => {
      return waitForElementToBeRemoved(() => screen.getByText('Loading...'));
    });

    fireEvent.mouseDown(screen.getAllByRole('button')[0])
    expect(screen.getByText('Dummy Workflow')).toBeInTheDocument()
  })
  test('select existing', async () => {
    render(
        <SubmitJob workflowName='Dummy Workflow'/>
    );
    await waitFor(() => {
      return waitForElementToBeRemoved(() => screen.getByText('Loading...'));
    });
    expect(screen.getByText('Dummy Workflow')).toBeInTheDocument()
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
    // [
    //   'FileSelect',
    //   {
    //     widget_type: 'FileSelect',
    //     label: 'file selection',
    //   }
    // ],
    // [
    //   'DirectorySelect',
    //   {
    //     widget_type: 'DirectorySelect',
    //     label: 'directory selection',
    //   }
    // ]
  ])('testing label matches', (name: string, metadata: WidgetApi) => {
    render(<WorkflowParams parameters={[metadata]}/>)
    expect(screen.getByLabelText(metadata.label)).toBeInTheDocument()
  })

})
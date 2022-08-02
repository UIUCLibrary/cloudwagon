import React from 'react';
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved
} from '@testing-library/react';
import App, {SpeedwagonApp} from '../frontend/src/App';
import axios from 'axios';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('App', ()=>{
  beforeEach(()=> {
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
  test('renders with a tablist', async () => {
    render(<App />);
    await waitFor(() => {
      return waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
    });
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
  // test('routing', async ()=>{
  //   render(<App />);
  //    await waitFor(() => {
  //     return waitForElementToBeRemoved(() => screen.getByText('Loading...'));
  //   });
  //   expect(screen.getByTestId('workflow-select-box')).toBeInTheDocument();
  // })
})

import '@testing-library/jest-dom'

import React from 'react';
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved
} from '@testing-library/react';
import App from '../App';
import axios from 'axios';
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
                      {
                        name:'Dummy Workflow',
                        id: 0,
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
                  id: 0,
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
  afterEach(()=>{
    mockedAxios.get.mockReset();
  })
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
// test('dummy', async () => {
//   render(
//       <BrowserRouter>
//         <Routes>
//           <Route path='/' element={<SpeedwagonApp tab="job"/>}/>
//         </Routes>
//       </BrowserRouter>
//   )
//   await waitFor(() => {
//       return waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
//   });
//   screen.getByLabelText('Workflow')
//   // expect(screen.getByRole('tabljist')).toBeInTheDocument();
// });

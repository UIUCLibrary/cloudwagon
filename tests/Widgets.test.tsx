import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved
} from '@testing-library/react';
import {SelectOption, DirectorySelect} from '../frontend/src/Widgets'
import axios from 'axios';
describe('SelectOption', ()=>{
  it('Label is written', function () {
    render(
      <SelectOption label="tester" parameters={{'selections': []}}/>
    )
    expect(screen.getByLabelText('tester')).toBeInTheDocument()
  });
})
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('DirectorySelect', ()=>{
  beforeEach(() => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/files' || url === '/api/files?path=/') {
        return Promise.resolve(
            {
              data:
                  {
                    contents: [
                      {
                        size: 123,
                        name: "something.txt",
                        type: "File"
                      }
                    ],
                    path: "/"
                  }
            });
      }
      return Promise.resolve();
    });
  });
  test('browse Button opens dialog',  ()=>{
    render(
        <DirectorySelect label="tester" parameters={{'selections': []}}/>
      )
    fireEvent.mouseDown(screen.getByLabelText('browse'))
    expect(screen.getByText('Select a Directory')).toBeInTheDocument()
  })
})
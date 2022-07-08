import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved
} from '@testing-library/react';
import SubmitJob from '../frontend/src/SubmitJob';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('s', () => {
  beforeEach(() => {

    mockedAxios.get.mockResolvedValue(
        {
          data:
              {
                workflows: [
                  'Dummy Workflow',
                ]
              }
        })
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
})

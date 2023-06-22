import '@testing-library/jest-dom'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved
} from '@testing-library/react';
import {NewDirectoryDialog} from './NewDirectoryDialog';

describe('NewDirectory', ()=>{
  test.each([
    ['s', 1],
    ['dummy', 1],
    ['', 0],
  ])("clicking okay with '%s' calls makeRequest %d times", async (directoryName, calledNumber)=>{
    const makeRequest = jest.fn()
    makeRequest.mockImplementation((name: string)=>{
      return Promise.resolve()
    })
    render(
        <NewDirectoryDialog open={true} onCreate={makeRequest} path={'/'}/>
    )
    fireEvent.change(screen.getByLabelText('Name'), {target: {value: directoryName}})
    fireEvent.click(screen.getByRole('button', {name: 'Ok'}));
    waitForElementToBeRemoved(screen.getByRole('dialog', {name: 'New Directory'}))
    await waitFor(()=> expect(makeRequest).toBeCalledTimes(calledNumber))
  })
})
import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import {
  SelectOption,
  DirectorySelect,
  CheckBoxOption
} from '../frontend/src/Widgets'
import axios from 'axios';
import {FormEvent} from 'react';
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
describe('CheckBoxOption', ()=>{
  test('default', ()=>{
    const onSubmit = (event: FormEvent<HTMLFormElement>)=>{
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement);
      let formProps = Object.fromEntries(formData);
      expect(formProps).toStrictEqual({foo: 'false'});
    }
    render(
      <>
        <form onSubmit={onSubmit}>
          <CheckBoxOption label={'foo'}/>
          <button type='submit'>Submit</button>
        </form>
      </>
      )
    fireEvent.click(screen.getByText('Submit'))
  })
  test('true', ()=>{
    const onSubmit = (event: FormEvent<HTMLFormElement>)=>{
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement);
      let formProps = Object.fromEntries(formData);
      expect(formProps).toStrictEqual({foo: 'true'});
    }
    render(
      <>
        <form onSubmit={onSubmit}>
          <CheckBoxOption label={'foo'}/>
          <button type='submit'>Submit</button>
        </form>
      </>
      )
    fireEvent.click(screen.getByLabelText('foo'));

    fireEvent.click(screen.getByText('Submit'))
  })
  test('false', ()=>{
    const onSubmit = (event: FormEvent<HTMLFormElement>)=>{
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement);
      let formProps = Object.fromEntries(formData);
      expect(formProps).toStrictEqual({foo: 'false'});
    }
    render(
      <>
        <form onSubmit={onSubmit}>
          <CheckBoxOption label={'foo'}/>
          <button type='submit'>Submit</button>
        </form>
      </>
      )
    fireEvent.click(screen.getByLabelText('foo'));
    fireEvent.click(screen.getByLabelText('foo'));
    fireEvent.click(screen.getByText('Submit'))
  })
})
import '@testing-library/jest-dom'
import {
  fireEvent,
  render,
  screen, waitFor,
} from '@testing-library/react';
import {
  SelectOption,
  DirectorySelect,
  CheckBoxOption,
  IFile, IAPIDirectoryContents,
} from '../Widgets'
import {FormEvent} from 'react';
jest.mock('axios');

describe('SelectOption', ()=>{
  it('Label is written', function () {
    render(
        <SelectOption label="tester" parameters={{'selections': []}}/>
    )
    expect(screen.getByLabelText('tester')).toBeInTheDocument()
  });
})

describe('DirectorySelect', ()=>{
  test('browse Button opens dialog', async ()=>{
    const onRejected = jest.fn();
    const dataHook = ():Promise<IAPIDirectoryContents> =>{
      return new Promise((resolve, reject) => {
        resolve({
              path: '/',
              contents: [] as IFile[]
            }
        );
      })
    }
    const onLoaded = jest.fn()
    render(
        <>
          <DirectorySelect
              onReady={onLoaded}
              getDataHook={dataHook}
              onRejected={onRejected}
              label="tester"
              parameters={{'selections': []}}
          />
        </>
    )
    await waitFor(()=>expect(onLoaded).toBeCalled());
    fireEvent.click(screen.getByRole('button', {name: /browse/}));
    await waitFor(()=>{
      expect(screen.getByText('Select a Directory')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Cancel'))
    await waitFor(()=>{
      expect(onRejected).toBeCalled();
    })
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
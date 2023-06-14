import {FormEvent} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {CheckBoxOption} from './CheckBoxOption';

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
            <CheckBoxOption required={true} label={'foo'}/>
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
            <CheckBoxOption required={true} label={'foo'}/>
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
            <CheckBoxOption required={true} label={'foo'}/>
            <button type='submit'>Submit</button>
          </form>
        </>
    )
    fireEvent.click(screen.getByLabelText('foo'));
    fireEvent.click(screen.getByLabelText('foo'));
    fireEvent.click(screen.getByText('Submit'))
  })
})

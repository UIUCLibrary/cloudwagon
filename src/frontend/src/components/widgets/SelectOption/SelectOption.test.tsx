import '@testing-library/jest-dom'
import {
  render,
  screen,
} from '@testing-library/react';
import {SelectOption} from './SelectOption';

describe('SelectOption', ()=>{
  it('Label is written', function () {
    render(
        <SelectOption required={true} label="tester" parameters={{'selections': []}}/>
    )
    expect(screen.getByLabelText('tester *')).toBeInTheDocument()
  });

  it('default value', function () {
    render(
        <SelectOption required={true} label="tester" parameters={{'defaultValue':'one', 'selections': ['one', 'two']}}/>
    )
    expect(screen.getByLabelText('tester *')).toHaveTextContent('one')
  });
  it('selections with no default value', function () {
    render(
        <SelectOption required={true} label="tester" parameters={{'selections': ['one']}}/>
    )
    expect(screen.getByLabelText('tester *')).not.toHaveTextContent('one')
  });
})

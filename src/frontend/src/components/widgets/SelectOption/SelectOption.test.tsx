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
})

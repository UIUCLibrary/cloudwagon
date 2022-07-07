import {render, screen} from '@testing-library/react';
import {SelectOption} from '../frontend/src/Widgets'
describe('SelectOption', ()=>{
  it('Label is written', function () {
    render(
      <SelectOption label="tester" parameters={{'selections': []}}/>
    )
    expect(screen.getByLabelText('tester')).toBeInTheDocument()
  });
})

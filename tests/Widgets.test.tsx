import {render} from '@testing-library/react';
import {SelectOption} from '../frontend/src/Widgets'
describe('SelectOption', ()=>{
  it('Label is written', function () {
    const {getByLabelText}  = render(
      <SelectOption label="tester" parameters={{'selections': []}}/>
    )
    expect(getByLabelText('tester')).toBeInTheDocument()
  });
})

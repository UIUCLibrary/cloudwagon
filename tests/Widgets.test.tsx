import {render} from '@testing-library/react';
import {SelectOption} from '../frontend/src/Widgets'
it('Label is written', function () {
  const {getByLabelText}  = render(
    <SelectOption label="tester" parameters={{'selections': []}}/>
  )
  expect(getByLabelText('tester'))

});
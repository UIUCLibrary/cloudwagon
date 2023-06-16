import {FC, useState} from 'react';
import {APIWidgetData} from '../Widgets.types.tsx';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';

export const CheckBoxOption: FC<APIWidgetData> = ({label}) => {
  const [value, setValue] = useState(false);
  const checkbox = <>
    <Checkbox
        checked={value}
        value={value}
        onChange={() => {
          setValue(!value)
        }}
    />
    <input type="hidden" defaultChecked={true} value={value.toString()}
           name={label}/>
  </>
  return (
      <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        <FormControlLabel
            name={label}
            control={checkbox}
            label={label}/>
      </FormControl>
  )
}

import {FC, useId} from 'react';
import {APIWidgetData, IChoiceSelection} from '../Widgets.types';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

export const SelectOption: FC<APIWidgetData> = ({label, parameters, required}) => {
  const id = useId();
  if (!parameters) {
    return (
        <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        </FormControl>
    )
  }
  const params = parameters as IChoiceSelection;
  const options = params.selections.map(
      (option, index) => {
        return (
            <MenuItem key={index} value={option}>
              {option}
            </MenuItem>
        )
      }
  );

  return (
      <FormControl required={required} fullWidth sx={{m: 1, minWidth: 120}}>
        <InputLabel
            id={id}>{label}</InputLabel>
        <Select
            labelId={id}
            name={label} label={label}>{options}</Select>
      </FormControl>
  )
}
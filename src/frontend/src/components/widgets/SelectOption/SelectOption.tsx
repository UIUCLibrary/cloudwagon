import {FC, useId, useState} from 'react';
import {APIWidgetData, IChoiceSelection} from '../Widgets.types';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Select, {SelectChangeEvent} from '@mui/material/Select';

export const SelectOption: FC<APIWidgetData> = ({label, parameters, required}) => {
  const [value, setValue] = useState(
      parameters.hasOwnProperty('defaultValue') ? parameters['defaultValue'] : ''
  );
  const id = useId();
  if (!parameters) {
    return (
        <FormControl fullWidth sx={{m: 1, minWidth: 120}}>
        </FormControl>
    )
  }
  const params = parameters as IChoiceSelection;
  const selections = params.hasOwnProperty('selections') ? params.selections : []
  const options = selections.map(
      (option, index) => {
        return (
            <MenuItem key={index} value={option}>
              {option}
            </MenuItem>
        )
      }
  );
  const handleChange = (event: SelectChangeEvent) =>{
    setValue(event.target.value)
  }
  const selectElement = (
      () => {
    if (selections.length == 0){
      return (
          <Select
              value=""
              labelId={id}
              name={label}
              label={label}>
            <MenuItem value="">
              <em>No Values available</em>
            </MenuItem>
          </Select>
      )
    }
    return (
        <Select
            labelId={id}
            value={value}
            name={label}
            onChange={handleChange}
            label={label}>{options}</Select>
    )
  })()
  // const selectElement = getSelectionElement()
  // const selectElement = selections.length > 0 ? (
  //     <Select
  //         labelId={id}
  //         value={value}
  //         name={label}
  //         onChange={handleChange}
  //         label={label}>{options}</Select>
  // ) : (
  //     <Select
  //         labelId={id}
  //         name={label}
  //         label={label}>
  //       <MenuItem value="">
  //         <em>No Values available</em>
  //       </MenuItem>
  //     </Select>
  // )
  return (
      <FormControl required={required} fullWidth sx={{m: 1, minWidth: 120}} >
        <InputLabel
            id={id}>{label}</InputLabel>
        {selectElement}
      </FormControl>
  )
}
import {FC} from 'react';
import {WidgetApi} from './SubmitJob.types.tsx';
import {APISelectDir} from './APISelectDir.tsx';
import {CheckBoxOption, FileSelect, SelectOption} from '../widgets';

export const GetWidget: FC<WidgetApi> = (parameter)=>{
  if(parameter.widget_type === 'DirectorySelect'){
    return <APISelectDir widgetParameter={parameter}/>
  }
  if(parameter.widget_type === 'FileSelect'){
    return (
        <FileSelect required={parameter.required} label={parameter.label} parameters={parameter}/>
    )
  }
  if(parameter.widget_type === 'BooleanSelect'){
    return (
        <CheckBoxOption required={parameter.required} label={parameter.label} parameters={parameter}/>
    )
  }
  if(parameter.widget_type === 'ChoiceSelection'){
    return (
        <SelectOption required={parameter.required} label={parameter.label} parameters={parameter}/>
    )
  }
  return <></>
}
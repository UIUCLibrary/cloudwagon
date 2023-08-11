import {WidgetApi} from './SubmitJob.types.tsx';
import {DirectorySelect, FileSelect} from '../../widgets';

export const APISelectDir = ({widgetParameter}: { widgetParameter: WidgetApi})=>{

  return (
      <DirectorySelect
          required={widgetParameter.required}
          label={widgetParameter.label}
          parameters={widgetParameter}/>
  )
}
export const APISelectFile = ({widgetParameter}: { widgetParameter: WidgetApi})=>{
  return (
      <FileSelect
          required={widgetParameter.required}
          label={widgetParameter.label}
          parameters={widgetParameter}/>
  )
}
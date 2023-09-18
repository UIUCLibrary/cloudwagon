import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import ListItemText from '@mui/material/ListItemText';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell'
import {PageProps} from '../Page.types.tsx'
import {PropsWithChildren} from 'react';
import LinearProgress from '@mui/material/LinearProgress';
const InfoItem = (props: PropsWithChildren<{metadataKey: string}>) =>{
 return (
     <TableRow>
        <TableCell style={{ verticalAlign: 'top' }}>{props.metadataKey}</TableCell>
        <TableCell align="left">{props.children}</TableCell>
     </TableRow>
 )
}
interface WorkflowInfo {
  id: number
  name: string
}
export interface SystemInfoData {
  web_version: string
  speedwagon_version: string
  workflows: WorkflowInfo[]
}
const buildInfoItems = (data: SystemInfoData | null)=>{
  if (!data){
    return <></>
  }
  const sorter = (a: WorkflowInfo, b: WorkflowInfo): number => {
    return a.name < b.name ? -1 : 1;
  }
  const workflows = data['workflows'];
  workflows.sort(sorter)
  const workflowsElements = workflows.map((workflow)=>{
    return (

        <ListItem key={workflow.id} sx = {{display: 'list-item'}} disablePadding>
          <ListItemText primary={workflow.name}/>
        </ListItem>
    )
  })
  return (
      <>
        <InfoItem metadataKey={"Site Version"}>{data['web_version']}</InfoItem>
        <InfoItem metadataKey={"Speedwagon Version Used"}>{data['speedwagon_version']}</InfoItem>
        <InfoItem metadataKey={"Installed Workflows"}>
          <List dense={true} sx={{ listStyleType: 'disc', pl: 2}} >
            {workflowsElements}
          </List>
        </InfoItem>
      </>
  )
}

export interface SystemInfoProps extends PageProps{
    useServerDataHook: ()=>{loading: boolean, data: SystemInfoData, error: unknown}
}
export default function SystemInfo({useServerDataHook}: SystemInfoProps){
    const serverData = useServerDataHook()
    const loadingWidget = <>
        <TableRow>
          <TableCell colSpan={2} style={{borderBottom:"none"}}>
            <LinearProgress />
          </TableCell>
        </TableRow>
      </>
      return (
          <>
            <TableContainer>
              <Table aria-label="installed workflows">
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serverData.loading? loadingWidget: buildInfoItems(serverData.data)}
                </TableBody>
              </Table>
            </TableContainer>
          </>
      )
}
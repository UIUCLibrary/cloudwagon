import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import axios from 'axios';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import ListItemText from '@mui/material/ListItemText';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell'

import {useEffect, useState, FC} from 'react';
import LinearProgress from '@mui/material/LinearProgress';
const InfoItem: FC<({metadataKey: string, children: any})> = (props) =>{
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
interface SystemInfoData {
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
const useServerData = (): [(SystemInfoData| null), boolean]=>{
  const [serverData, setServerData] = useState<SystemInfoData| null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(()=>{
    setLoading(true)
    axios.get('/api/info')
        .then((result)=>{
          setServerData(result.data)
        })
        .finally(()=>setLoading(false))
  }, [])
  return [serverData, loading]

}
export default function SystemInfo(){
  const [serverData, loading] = useServerData();
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
              {loading? loadingWidget: buildInfoItems(serverData)}
            </TableBody>
          </Table>
        </TableContainer>
      </>
  )
}
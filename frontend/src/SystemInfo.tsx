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
const InfoItem: FC<({metadataKey: string, children: any})> = (props) =>{
 return (
     <TableRow>
        <TableCell style={{ verticalAlign: 'top' }}>{props.metadataKey}</TableCell>
        <TableCell align="left">{props.children}</TableCell>
     </TableRow>
 )
}
const buildInfoItems = (data: {[key: string]: string | string[]} | null)=>{
  if (!data){
    return <></>
  }
  const workflows = data['workflows'] as string[];
  const workflowsElements = workflows.sort().map((workflowName)=>{
    return (
      <List dense={true} sx={{ listStyleType: 'disc', pl: 2}} >
        <ListItem sx = {{display: 'list-item'}} disablePadding>
          <ListItemText primary={workflowName}/>
        </ListItem>
      </List>
    )
  })
  return (
      <>
        <InfoItem metadataKey={"Site Version"}>{data['web_version']}</InfoItem>
        <InfoItem metadataKey={"Speedwagon Version Used"}>{data['speedwagon_version']}</InfoItem>
        <InfoItem metadataKey={"Installed Workflows"}>{workflowsElements}</InfoItem>
      </>
  )
}

export default function SystemInfo(){
  const [serverData, setServerData] = useState<{[key: string]: string} | null>(null)
  useEffect(()=>{
    axios.get('/api/info').then((result)=>{
      setServerData(result.data)
    })
  }, [])
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
              {buildInfoItems(serverData)}
            </TableBody>
          </Table>
        </TableContainer>
      </>
  )
}
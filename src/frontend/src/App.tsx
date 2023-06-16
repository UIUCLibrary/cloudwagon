import {useEffect, useState, SyntheticEvent} from 'react';
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import {SubmitJob, SystemInfo, FileManagement} from './components'
import {BrowserRouter, Route, Routes, useNavigate, useSearchParams} from 'react-router-dom';
import styled from '@mui/system/styled';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const StyledPaper = styled(Paper, {})({
  minHeight: '50vw',
  borderRadius: 10,
});

function TabPanel(props: TabPanelProps) {
  const {children, value, index, ...other} = props;

  return (
      <div
          role="tabpanel"
          hidden={value !== index}
          id={`simple-tabpanel-${index}`}
          aria-labelledby={`simple-tab-${index}`}
          {...other}
      >
        {value === index && (
            <Box sx={{p: 3}}>
              {children}
            </Box>
        )}
      </div>
  );
}

function App() {
  const [app, setApp] = useState(<LinearProgress />)
  useEffect(()=>{
    axios.get('/api/info').then(()=>{
      setApp (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SpeedwagonApp tab="job"/>}/>
              <Route path="/job" element={<SpeedwagonApp tab="job"/>}/>
              <Route path="/job:workflow" element={<SpeedwagonApp tab="job"/>}/>
              {/*</Route>*/}
              <Route path="/manageFiles" element={<SpeedwagonApp tab="manageFiles"/>}/>
              <Route path="/info" element={<SpeedwagonApp tab="info"/>}/>
              <Route path="*" element={<div>404</div>}/>
            </Routes>
          </BrowserRouter>
      )
    }).catch(()=>{
      setApp(<Alert severity="error">Unable to access Speedwagon server api.</Alert>)
    })
  }, [])
  return app
}
interface ISpeedwagonApp{
  tab: string
}
export function SpeedwagonApp({tab}: ISpeedwagonApp) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    navigate(`/${tabs[newValue]}`)
    setCurrentTabIndex(newValue);
  };
  const tabs: {[key: number]: string} = {
    0: "job",
    1: "manageFiles",
    2: "info",
  }
  let tabIndex: number | null = null;
  for(const i in Object.keys(tabs)){
    if (tabs[i] === tab){
      tabIndex = parseInt(i);
      break
    }
  }
  if(tabIndex !== null && currentTabIndex !== tabIndex){
    setCurrentTabIndex(tabIndex);
  }
  const workflowName = searchParams.get('workflow')
  const handleWorkflowChange = (workflow_name: string) =>{
    const encodeName = encodeURI(workflow_name)
    navigate(`/job?workflow=${encodeName}`)
  }
  return (
      <div className="App">
        <Box p={2}>
          <Container maxWidth={"md"}>
            <StyledPaper elevation={10}>
            {/*<Paper elevation={10} style={{minHeight: '50vw', borderRadius: 20}}>*/}
              <Box p={2}>
                <h1 style={{"textAlign": "center"}}>Speedwagon in the Cloud</h1>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                  <Tabs value={currentTabIndex} onChange={handleChange}
                        aria-label="basic tabs example" centered>
                    <Tab label="Job"/>
                    <Tab label="Manage Files"/>
                    <Tab label="Info"/>
                  </Tabs>
                </Box>
                <TabPanel value={currentTabIndex} index={0}>
                  <Container>
                    <SubmitJob
                        workflowName={workflowName}
                        onWorkflowChanged={handleWorkflowChange}
                    />
                  </Container>
                </TabPanel>
                <TabPanel value={currentTabIndex} index={1}>
                  <Container>
                    <FileManagement/>
                  </Container>
                </TabPanel>
                <TabPanel value={currentTabIndex} index={2}>
                  <Container>
                    <SystemInfo/>
                  </Container>
                </TabPanel>
              </Box>
            </StyledPaper>
          </Container>
        </Box>
      </div>
  );
}

export default App;

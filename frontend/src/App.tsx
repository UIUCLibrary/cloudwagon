import React from 'react';
import './App.css';
import {Box, Container, Paper} from "@mui/material";
import SubmitJob from './SubmitJob'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import FileManagement from "./FileManagement";
import {BrowserRouter, Route, Routes, useNavigate, useSearchParams} from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SpeedwagonApp tab="job"/>}/>
          <Route path="/job" element={<SpeedwagonApp tab="job"/>}/>
          <Route path="/job:workflow" element={<SpeedwagonApp tab="job"/>}/>
          {/*</Route>*/}
          <Route path="/manageFiles" element={<SpeedwagonApp tab="manageFiles"/>}/>
          <Route path="*" element={<div>404</div>}/>
        </Routes>
      </BrowserRouter>
  )
}
interface ISpeedwagonApp{
  tab: string
}
function SpeedwagonApp({tab}: ISpeedwagonApp) {
  let navigate = useNavigate();
  let [searchParams] = useSearchParams();
  const [currentTabIndex, setCurrentTabIndex] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    navigate(`/${tabs[newValue]}`)
    setCurrentTabIndex(newValue);
  };
  const tabs: {[key: number]: string} = {
    0: "job",
    1: "manageFiles",
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
  console.log("loading")
  const handleWorkflowChange = (workflow_name: string) =>{
    const encodeName = encodeURI(workflow_name)
    navigate(`/job?workflow=${encodeName}`)
  }
  return (
      <div className="App">
        <Box p={2}>
          <Container maxWidth={"md"}>
            <Paper elevation={10} style={{minHeight: '50vw', borderRadius: 20}}>
              <Box p={2}>
                <h1 style={{"textAlign": "center"}}>Speedwagon in the Cloud</h1>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                  <Tabs value={currentTabIndex} onChange={handleChange}
                        aria-label="basic tabs example" centered>
                    <Tab label="Job"/>
                    <Tab label="Manage Files"/>
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
              </Box>
            </Paper>
          </Container>
        </Box>
      </div>
  );
}

export default App;

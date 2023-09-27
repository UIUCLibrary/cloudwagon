import {ReactElement, SyntheticEvent, useCallback, useEffect, useState} from 'react';
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import {FileManagement, MessageStatusLevel, PageProps, SystemInfo, StatusMessage} from './components/pages'
import {SystemInfoData} from './components/pages/SystemInfo/SystemInfo.tsx'
import {useWorkflowMetadata, useWorkflowList, SubmitJob} from './components/pages/SubmitJob';
import {ManageJobs, JobStatus, useSingleJobStatus} from './components/pages/ManageJobs'
import {BrowserRouter, Route, Routes, useNavigate, useSearchParams} from 'react-router-dom';
import styled from '@mui/system/styled';
import axios from 'axios';
import {useSSE} from "./components/apiHooks/useSSE";
import {useAxios} from './components/apiHooks'
import SnackBar from "@mui/material/Snackbar";

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
              <Route path="/manageJobs" element={<SpeedwagonApp tab="manageJobs"/>}/>
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

interface SpeedcloudAppTab{
  label: string
  navigation: string
  pageWidget: ReactElement<PageProps>
}

const useServerDataHook = ()=>{
  return useAxios<SystemInfoData>('/api/info')
}
export function SpeedwagonApp({tab}: ISpeedwagonApp) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState<StatusMessage|null>(null);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    navigate(tabs[newValue].navigation)
    setCurrentTabIndex(newValue);
  };
  const handleWorkflowChange = (workflow_name: string) =>{
    const encodeName = encodeURI(workflow_name)
    navigate(`/job?workflow=${encodeName}`)
  }

  const useJobsStatus = ()=>{
    const hook = useSSE<JobStatus[]>('/api/jobsSSE');
    return {...hook, ...{data: hook.data ? hook.data : []}}
  }
  const handleNewMessage = useCallback((message: string, level: MessageStatusLevel)=>{
      setNotificationMessage({message: message, level: level || "info"})
      setNotificationVisible(true)
  }, [notificationMessage, notificationVisible])

  const handleNotificationClose = useCallback(()=>{
    setNotificationVisible(false);
    setNotificationMessage(null);
  }, [notificationMessage, notificationVisible])

  const tabs: SpeedcloudAppTab[] = [
    {
      label: 'New Job',
      navigation: '/job',
      pageWidget: (
          <SubmitJob
              onStatusMessage={handleNewMessage}
              workflowName={searchParams.get('workflow')}
              onWorkflowChanged={handleWorkflowChange}
              onJobSubmitted={(data)=>{
                navigate(`/manageJobs?jobId=${data['metadata']['id']}`)
              }}
              useWorkflowsListHook={useWorkflowList}
              useWorkflowMetadataHook={useWorkflowMetadata}
          />
      )
    },
    {
      label: 'Manage Jobs',
      navigation: '/manageJobs',
      pageWidget: <ManageJobs
            onStatusMessage={handleNewMessage}
            jobId={searchParams.get('jobId')}
            useAllJobsStatusHook={useJobsStatus}
            useSingleJobStatusHook={useSingleJobStatus}
        />
    },
    {
      label: 'Manage Files',
      navigation: '/manageFiles',
      pageWidget: <FileManagement/>
    },
    {
      label: 'Info',
      navigation: '/info',
      pageWidget: <SystemInfo useServerDataHook={useServerDataHook}/>
    }
  ]
  for(const i in Object.keys(tabs)){
    if (tabs[i].navigation === `/${tab}`){
      const index = parseInt(i)
      if(currentTabIndex !== index){
        setCurrentTabIndex(index);
      }
      break
    }
  }
  const tabItems = tabs.map((tab, index)=>{
      return {
        index: index,
        labelWidget: <Tab key={index} label={tab.label}/>,
        pageWidget: tab.pageWidget
      }
  })
  return (
      <div className="App">
        <Box p={2}>
          <Container maxWidth={"lg"}>
            <StyledPaper elevation={10}>
              <Box p={2}>
                <h1 style={{"textAlign": "center"}}>Speedwagon in the Cloud</h1>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                  <Tabs value={currentTabIndex} onChange={handleChange} aria-label="basic tabs example" centered>
                    {
                      tabItems.map((tab) => {
                        return tab.labelWidget
                      })
                    }
                  </Tabs>
                </Box>
                {tabItems.map((tab) => {
                  return (
                      <TabPanel value={currentTabIndex} index={tab.index} key={tab.index}>
                        <Container>
                          {tab.pageWidget}
                        </Container>
                      </TabPanel>
                  )
                })}
              </Box>
            </StyledPaper>
              <SnackBar open={notificationVisible} autoHideDuration={6000} onClose={handleNotificationClose}>
                <Alert severity={notificationMessage ? notificationMessage.level : undefined} sx={{ width: '100%' }}>
                  {notificationMessage ? notificationMessage.message: ''}
                </Alert>
              </SnackBar>
          </Container>
        </Box>
      </div>
  );
}

export default App;

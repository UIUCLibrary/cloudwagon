import React from 'react';
import './App.css';
import {Box, Container, Paper} from "@mui/material";
import SubmitJob from './SubmitJob'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import FileManagement from "./FileManagement";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function App() {
    const [value, setValue] = React.useState(0);
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const activeWindow = (
        <SubmitJob/>
    )

    return (
        <div className="App">
            <Box p={2}>
                <Container maxWidth={"md"}>
                    <Paper elevation={10} style={{minHeight: '50vw', borderRadius: 20}}>
                        <Box p={2}>
                            <h1>Speedwagon in the Cloud</h1>
                            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" centered>
                                    <Tab label="Job"/>
                                    <Tab label="Manage Files"/>
                                    {/*<Tab label="Settings"/>*/}
                                </Tabs>
                            </Box>
                            <TabPanel value={value} index={0}>
                                <Container>
                                    {activeWindow}
                                </Container>
                            </TabPanel>
                            <TabPanel value={value} index={1}>
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

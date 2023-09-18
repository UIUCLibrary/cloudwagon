import '@testing-library/jest-dom';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import App from './App.tsx'
import axios from 'axios';
import {useAxios} from './components/apiHooks/useAxios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('./components/apiHooks/useAxios')
const mockedUseAxios = useAxios as jest.Mocked<any>;

const loadedWorkflows = [
    {"name":"Generate MARC.XML Files","id":0},
]

const infoMetadata = {
    "web_version":"0.0.1",
    "speedwagon_version":"0.3.0b4",
    "workflows": loadedWorkflows
}



describe('SpeedwagonApp', ()=>{
    mockedAxios.get.mockImplementation((url)=>{
        if (url == '/api/info'){
            return Promise.resolve(infoMetadata)
        }
        if (url == '/api/list_workflows'){
            return Promise.resolve({workflows: [
                    {"name":"Generate MARC.XML Files","id":0},
                ]})
        }
        return Promise.reject()
    })
    mockedUseAxios.mockImplementation((url)=>{
        switch (url) {
            case "/api/list_workflows":
                return {loading: false, data: {workflows: loadedWorkflows}, error: null}
            case "/api/info":
                return {
                    loading: false,
                    data: infoMetadata,
                    error: null
                }
            default:
                return {loading: false, data: null, error: null}
        }
    })
    test('switching tabs', async ()=>{
        render(<App/>)
        await waitFor(()=>expect(screen.getByText('Speedwagon in the Cloud')).toBeInTheDocument())
        fireEvent.click(screen.getByText('Info'))
        await waitFor(()=>expect(screen.getByText('Site Version')).toBeInTheDocument())
    })
})
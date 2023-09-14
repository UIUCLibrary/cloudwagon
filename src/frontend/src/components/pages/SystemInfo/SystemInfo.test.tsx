import '@testing-library/jest-dom'
import {
    screen,
    render,
} from '@testing-library/react';
import SystemInfo from './SystemInfo.tsx'
describe('SystemInfo', ()=>{
    const usedCannedData = ()=>{
        return {
            loading: false,
            data: {
                web_version: "12345",
                speedwagon_version: "56789",
                workflows: []
            },
            error: null
        }
    }
    test('web version info', ()=>{
        render(
            <SystemInfo useServerDataHook={usedCannedData}/>
        )
        expect(screen.getByText("12345")).toBeInTheDocument()
    })
})
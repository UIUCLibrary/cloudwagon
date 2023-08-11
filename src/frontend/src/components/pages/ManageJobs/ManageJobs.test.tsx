import '@testing-library/jest-dom';
import {fireEvent, render, screen} from '@testing-library/react';
import ManageJobs, {JobStatus} from './ManageJobs.tsx'
import {UseSSEHookData} from "../../apiHooks/useSSE";
jest.mock('./useJobStatusSSE')
describe('ManageJobs', ()=>{
    const useCannedJobStatus = (url: string | null) =>{
        return {active: true, data: null, loading: false}
    }
    test('empty table', ()=>{
        const useEmptyData = (): UseSSEHookData<JobStatus[]>=>{
            return {
                data: [],
                loading: false,
                error: null,
                isOpen: false,
                stop: ()=>null,
                reset: ()=>null,
            }
        }

        render(<ManageJobs useAllJobsStatusHook={useEmptyData} useSingleJobStatusHook={useCannedJobStatus}/>)
        expect(screen.getByRole('table')).toBeInTheDocument()
    })

    test('clicking on more', ()=>{
        const useCannedData = (): UseSSEHookData<JobStatus[]>=>{
            return {
                data: [
                    {
                        job: {
                            workflow:{
                                name: "dummy",
                                id: "123123"
                            }
                        },
                        state: "running",
                        progress: 10.2,
                        order: 1,
                        job_id: "c538ca1b-563e-4cab-bb80-539029df558b",
                        time_submitted: "123.2",
                        highlight: false,
                        hasReport: true,
                        onRequestDetails: (jobId: string)=>null
                    }
                ],
                loading: false,
                error: null,
                isOpen: false,
                stop: ()=>null,
                reset: ()=>null,
            }
        }
        render(<ManageJobs useAllJobsStatusHook={useCannedData} useSingleJobStatusHook={useCannedJobStatus}/>)
        fireEvent.click(screen.getByRole('button', {name: "Details"}))
        expect(screen.getByRole('dialog')).toBeVisible()
    })
})


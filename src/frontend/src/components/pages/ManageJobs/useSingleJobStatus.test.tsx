import {renderHook} from "@testing-library/react";
import useSingleJobStatus from "./useSingleJobStatus.tsx";
import axios from "axios";

jest.mock('axios');
describe('useSingleJobStatus', ()=>{
    beforeEach(()=>{
        jest.resetAllMocks()
    })

    test('null job id returns empty logs', ()=>{
        const {result}= renderHook(()=>useSingleJobStatus(null))
        expect(result.current.data.logs).toEqual([])
    })

    test('null job id does not make any request', ()=>{
        renderHook(()=>useSingleJobStatus(null))
        expect(axios.get).not.toBeCalled()
    })
})
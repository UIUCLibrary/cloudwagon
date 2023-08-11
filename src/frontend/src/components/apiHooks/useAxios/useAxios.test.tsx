import {renderHook, waitFor} from "@testing-library/react";
import axios from "axios";
import {useAxios} from "./useAxios.tsx";
import {jest} from "@jest/globals";
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('useAxios', ()=>{
    beforeEach(()=>{
        jest.resetAllMocks()
    })
    test('gets data', async ()=> {
        mockedAxios.get.mockResolvedValue({ data: {some: "value"} })
        const {result} = renderHook(() => useAxios("someurl"));
        await waitFor(()=>expect(result.current.loading).toBeFalsy())
        expect(result.current.data).toEqual({some: "value"})
    });
})
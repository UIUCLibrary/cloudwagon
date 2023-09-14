import {useSSE} from './useSSE.tsx'
import {renderHook, waitFor, act} from "@testing-library/react";

describe('useSSE', ()=>{
    const messages:{[key: string]: ((_message: MessageEvent)=>void)[]} = {}
    let readyState = 2
    const dummySSE = jest.fn().mockImplementation(q => ({
        close: jest.fn(() => {
            readyState = 2
        }),
        readyState: readyState,
        addEventListener: jest.fn(
            (_event: string, _callback: (_message: MessageEvent) => void) => {
                if (_event in messages){
                    messages[_event].push(_callback)
                } else {
                    messages[_event] = [_callback]

                }

            },
        ),
    }))
    beforeEach(()=>{
        jest.clearAllMocks()
    })
    describe('useSSE', ()=>{
        interface Foo {
            name: string
        }
        test('onmessage renders to the data ', ()=>{
            let hook = null
            const {result} = renderHook(()=>useSSE<Foo>("someurl", (url=> {
                hook = dummySSE(url)
                return hook
            })))
            const data = {name: "fooBar"}

            // simulate a send message
            act(()=>messages['message'].map((fn)=>fn({data: JSON.stringify(data)} as MessageEvent)))
            expect(result.current.data).toEqual(data)
        })

        test('reset sets data to null ', ()=>{

            let hook = null
            const {result} = renderHook(()=>useSSE<Foo>("someurl", (url=> {
                hook = dummySSE(url)
                return hook
            })))
            const data = {name: "fooBar"}

            // simulate a send message
            act(()=>messages['message'].map((fn)=>fn({data: JSON.stringify(data)} as MessageEvent)))
            // reset
            act(()=>result.current.reset())
            expect(result.current.data).toBeNull()
        })
        test('stop closes', ()=>{

            let hook = null
            const {result} = renderHook(()=>useSSE<Foo>("someurl", (url=> {
                hook = dummySSE(url)
                return hook
            })))
            const data = {name: "fooBar"}

            // simulate a send message
            act(()=>messages['message'].map((fn)=>fn({data: JSON.stringify(data)} as MessageEvent)))
            // reset
            act(()=>result.current.stop())
            expect(result.current.isOpen).toBeFalsy()
        })
    })
})
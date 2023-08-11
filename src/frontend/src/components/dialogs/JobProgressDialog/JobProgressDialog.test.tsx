import '@testing-library/jest-dom';
import {fireEvent, render, screen} from '@testing-library/react';
import JobProgressDialog from './JobProgressDialog.tsx'

describe('JobProgressDialog', ()=>{
    test('log content', ()=>{
        render(<JobProgressDialog title={'dummy'} logs={'hello'} progress={0} show={true}/>)
        expect(screen.getByRole('textbox')).toHaveTextContent('hello')
    })
    test('empty log content', ()=>{
        render(<JobProgressDialog title={'dummy'} progress={0} show={true}/>)
        expect(screen.getByRole('textbox')).toHaveTextContent('')
    })
    test('progress value', ()=>{
        render(<JobProgressDialog title={'dummy'} progress={0} show={true}/>)
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    })
    test('progress value full', ()=>{
        render(<JobProgressDialog title={'dummy'} progress={100} show={true}/>)
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    })
    test('progress being null has no progress bar', ()=>{
        render(<JobProgressDialog title={'dummy'} progress={null} show={true}/>)
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
    test('title', ()=>{
        render(<JobProgressDialog title={'dummy'} progress={0} show={true}/>)
        expect(screen.getByRole('heading')).toHaveTextContent('dummy')
    })
    test('closing dialog runs onClose', ()=>{
        const handleClose = jest.fn()
        render(<JobProgressDialog title={'dummy'} progress={0} show={true} onClose={handleClose}/>)
        fireEvent.click(screen.getByRole('button', {name: 'close'}))
        expect(handleClose).toBeCalled()
    })
})
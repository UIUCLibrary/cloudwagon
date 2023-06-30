import '@testing-library/jest-dom'
import {FileSelectDialog} from './FileSelectDialog';
import {IAPIDirectoryContents} from '../../widgets';
import {render, screen, waitFor} from "@testing-library/react";

describe('FileSelectDialog', ()=>{
  test('d', async ()=>{
    const fetchingFunction = (path: string): Promise<IAPIDirectoryContents> =>{
      const data = {
        '/': {
          path: '/',
          contents: [
            {name: '.', path: '/', type: "Directory", size: null},
            {name: 'something.png', path: '/something.png', type: "File", size: 127016},
          ]
        }
      }
      return Promise.resolve(data[path])
    }
    render(<FileSelectDialog show={true} startingPath={'/'} fetchingFunction={fetchingFunction}/>)
    await waitFor(()=>expect(screen.getByRole('dialog')).toBeVisible())
    await waitFor(()=>expect(screen.getByText('Select a File')).toBeVisible())
    await waitFor(()=>expect(screen.getByRole('cell', {name: 'something.png'})).toBeVisible())
  })
})
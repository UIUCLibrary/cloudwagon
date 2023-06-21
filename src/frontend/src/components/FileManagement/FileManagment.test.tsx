import '@testing-library/jest-dom';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import FileManagementPage from './FileManagementPage';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import * as React from 'react';
import {IAPIRequest} from '../widgets/FileManager';
describe('FileManagementPage', ()=>{
  const dataGetter = async (path: string): Promise<IAPIRequest> =>{
    return Promise.resolve({
      "path":"/",
      "contents": [
        {
          "name": ".",
          "path":"/",
          "type": "Directory",
          "size": null
        },
      ]
    })
  }
  test('placeholder', async ()=>{
    render(
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<FileManagementPage contentGetter={dataGetter}/>}/>
          </Routes>
        </BrowserRouter>
    )
  })

  test('open add file dialog box', async ()=>{

    render(
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<FileManagementPage contentGetter={dataGetter}/>}/>
          </Routes>
        </BrowserRouter>
    )
    expect(screen.queryByRole('dialog', {name: 'Add Files'})).toBeNull()
    fireEvent.click(screen.getByRole('menuitem', {name: "Add Files"}));
    await waitFor(()=> {
      expect(screen.getByRole('dialog', {name: 'Add Files'})).toBeInTheDocument()
    });

  })

})

import '@testing-library/jest-dom';
import {FileManager, splitRoutes} from './FileManager';
import {IAPIRequest} from './FileManager.types';
import {render, screen, waitFor} from '@testing-library/react';
import * as React from 'react';

describe('splitRoutes', ()=>{
  it.each([
    [
      '/',
      [
        {
          display:'/',
          path:'/'
        }
      ]
    ],
    [
      '/sample',
      [
        {
          display:'/',
          path: '/'
        },
        {
          display: 'sample',
          path: '/sample'
        }
      ]
    ],
    [
      '/multiple/directories',
      [
        {
          display:'/',
          path: '/'
        },
        {
          display: 'multiple',
          path: '/multiple'
        },
        {
          display: 'directories',
          path: '/multiple/directories'
        }
      ]
    ],
  ])('%p == %o', (
      inputString: string,
      expected: {   display: string, path: string }[]
  ) =>{
    expect(splitRoutes(inputString)).toStrictEqual(expected)
  })
})
describe('FileManager', ()=>{
  test('renders', async ()=>{
    const dataGetter = async (): Promise<IAPIRequest> =>{
      return Promise.resolve({
        "path":"/",
        "contents": [
          {
            "name": ".",
            "path":"/",
            "type": "Directory",
            "size": null
          },
          {
            "name": "more",
            "path": "/more",
            "type": "Directory",
            "size": null
          },
        ]
      })
    }
    render(<FileManager path='/' resourceGetter={dataGetter}/>)
    await waitFor(()=>expect(screen.getByRole('link', {name: 'more/'})).toBeInTheDocument())
    expect(screen.getByRole('menuitem', {name: "Add Files"})).toBeInTheDocument()
  })
  test('data gathers', async ()=>{
    const dataGetter = async (): Promise<IAPIRequest> =>{
      return Promise.resolve({
        "path":"/",
        "contents": [
          {
            "name": ".",
            "path":"/",
            "type": "Directory",
            "size": null
          },
          {
            "name": "more",
            "path": "/more",
            "type": "Directory",
            "size": null
          },
          {
            "name": "something.png",
            "path": "/something.png",
            "type": "File",
            "size": 127016
          }
        ]
      })
    }
    await waitFor(()=> {
      render(<FileManager path='/' resourceGetter={dataGetter}/>)
    })
    await waitFor(()=>expect(screen.getByText("something.png")).toBeInTheDocument())
  })
})
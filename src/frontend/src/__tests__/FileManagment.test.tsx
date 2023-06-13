import {render} from '@testing-library/react';
import FileManagement, {splitRoutes} from '../FileManagement';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import * as React from 'react';
test('placeholder', ()=>{
  render(
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<FileManagement/>}/>
        </Routes>
      </BrowserRouter>
  )
})

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

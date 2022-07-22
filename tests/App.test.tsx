import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../frontend/src/App';
describe('App', ()=>{
  test('renders with a tablist', () => {
    render(<App />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
})

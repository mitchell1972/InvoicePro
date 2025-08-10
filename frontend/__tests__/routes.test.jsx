import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

// Mock components
jest.mock('../src/components/LoginPage', () => () => <div>Login Page</div>);
jest.mock('../src/components/Dashboard', () => () => <div>Dashboard</div>);

describe('App Routing', () => {
  test('redirects to login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  test('renders login page on /login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  test('renders dashboard when authenticated', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/dashboard/i)[0]).toBeInTheDocument();
    localStorage.clear();
  });
});



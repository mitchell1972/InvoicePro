import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NotFoundPage from '../components/NotFoundPage';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    token: null,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

function renderWithRouter(initialRoute) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('App Routing', () => {
  it('renders 404 page for unknown routes', () => {
    renderWithRouter('/some-unknown-page');
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
  });

  it('404 page provides navigation to dashboard', () => {
    renderWithRouter('/invalid-path');
    const link = screen.getByRole('link', { name: 'Go to Dashboard' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('displays 404 visual indicator', () => {
    renderWithRouter('/unknown');
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});

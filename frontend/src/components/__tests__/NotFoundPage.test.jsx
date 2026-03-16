import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import NotFoundPage from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 heading', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
  });

  it('displays descriptive text', () => {
    render(<NotFoundPage />);
    expect(screen.getByText(/doesn't exist or has been moved/)).toBeInTheDocument();
  });

  it('has link back to dashboard', () => {
    render(<NotFoundPage />);
    const link = screen.getByRole('link', { name: 'Go to Dashboard' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('displays 404 text', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { email: 'test@example.com' },
    logout: vi.fn(),
  }),
}));

import Navbar from '../Navbar';

describe('Navbar', () => {
  it('renders with main navigation landmark', () => {
    render(<Navbar />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
  });

  it('renders brand link to dashboard', () => {
    render(<Navbar />);
    const brand = screen.getByText('Invoice Pro');
    expect(brand.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('displays user email', () => {
    render(<Navbar />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('New Invoice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
  });

  it('has mobile menu toggle button', () => {
    render(<Navbar />);
    const toggle = screen.getByLabelText('Open navigation menu');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles mobile menu on click', () => {
    render(<Navbar />);
    const toggle = screen.getByLabelText('Open navigation menu');
    fireEvent.click(toggle);
    expect(screen.getByLabelText('Close navigation menu')).toBeInTheDocument();
    expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument();
  });

  it('closes mobile menu on Escape key', () => {
    render(<Navbar />);
    fireEvent.click(screen.getByLabelText('Open navigation menu'));
    expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument();
  });

  it('has sign out button', () => {
    render(<Navbar />);
    const signOutButtons = screen.getAllByText('Sign out');
    expect(signOutButtons.length).toBeGreaterThan(0);
  });
});

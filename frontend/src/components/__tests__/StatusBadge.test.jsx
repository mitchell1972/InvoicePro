import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="Draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders with correct styling for Paid status', () => {
    render(<StatusBadge status="Paid" />);
    const badge = screen.getByText('Paid');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders with correct styling for Overdue status', () => {
    render(<StatusBadge status="Overdue" />);
    const badge = screen.getByText('Overdue');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders with correct styling for Sent status', () => {
    render(<StatusBadge status="Sent" />);
    const badge = screen.getByText('Sent');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('includes a visual dot indicator', () => {
    const { container } = render(<StatusBadge status="Paid" />);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });

  it('defaults to Draft styling for unknown status', () => {
    render(<StatusBadge status="Unknown" />);
    const badge = screen.getByText('Unknown');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });
});

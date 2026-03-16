import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import SummaryCards from '../SummaryCards';
import { mockInvoices } from '../../test/test-utils';

describe('SummaryCards', () => {
  it('renders all four summary cards', () => {
    render(<SummaryCards invoices={mockInvoices} />);
    expect(screen.getByText('Total Outstanding')).toBeInTheDocument();
    expect(screen.getByText('Paid This Month')).toBeInTheDocument();
    expect(screen.getByText('Total Invoices')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('displays correct total invoices count', () => {
    render(<SummaryCards invoices={mockInvoices} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('has accessible list structure', () => {
    render(<SummaryCards invoices={mockInvoices} />);
    expect(screen.getByRole('list', { name: 'Invoice statistics' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('renders icons with aria-hidden', () => {
    const { container } = render(<SummaryCards invoices={mockInvoices} />);
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBe(4);
  });

  it('handles empty invoices array', () => {
    render(<SummaryCards invoices={[]} />);
    expect(screen.getByText('Total Invoices')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});

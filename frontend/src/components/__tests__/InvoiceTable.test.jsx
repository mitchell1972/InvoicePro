import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import InvoiceTable from '../InvoiceTable';
import { mockInvoices } from '../../test/test-utils';

describe('InvoiceTable', () => {
  const defaultProps = {
    invoices: mockInvoices,
    onStatusChange: vi.fn(),
    onDelete: vi.fn(),
    selectedInvoices: [],
    onSelectionChange: vi.fn(),
  };

  it('renders table with aria-label', () => {
    render(<InvoiceTable {...defaultProps} />);
    expect(screen.getByRole('table', { name: 'Invoices' })).toBeInTheDocument();
  });

  it('renders column headers with scope', () => {
    const { container } = render(<InvoiceTable {...defaultProps} />);
    const ths = container.querySelectorAll('th[scope="col"]');
    expect(ths.length).toBeGreaterThan(0);
  });

  it('renders invoice numbers as buttons', () => {
    render(<InvoiceTable {...defaultProps} />);
    expect(screen.getByLabelText('View invoice #0001')).toBeInTheDocument();
    expect(screen.getByLabelText('View invoice #0002')).toBeInTheDocument();
  });

  it('renders select all checkbox with aria-label', () => {
    render(<InvoiceTable {...defaultProps} />);
    expect(screen.getByLabelText('Select all invoices')).toBeInTheDocument();
  });

  it('renders per-row checkboxes with descriptive labels', () => {
    render(<InvoiceTable {...defaultProps} />);
    expect(screen.getByLabelText('Select invoice #0001 for John Doe')).toBeInTheDocument();
    expect(screen.getByLabelText('Select invoice #0002 for Jane Smith')).toBeInTheDocument();
  });

  it('shows empty state when no invoices', () => {
    render(<InvoiceTable {...defaultProps} invoices={[]} />);
    expect(screen.getByText('No invoices found')).toBeInTheDocument();
  });

  it('renders action buttons with accessible labels', () => {
    render(<InvoiceTable {...defaultProps} />);
    expect(screen.getByLabelText('Delete invoice #0001')).toBeInTheDocument();
    expect(screen.getByLabelText('View invoice #0001 for John Doe')).toBeInTheDocument();
  });

  it('shows Send button for Draft invoices', () => {
    render(<InvoiceTable {...defaultProps} />);
    expect(screen.getByLabelText('Send invoice #0001')).toBeInTheDocument();
  });

  it('shows Mark Paid button for Sent invoices', () => {
    render(<InvoiceTable {...defaultProps} />);
    expect(screen.getByLabelText('Mark invoice #0002 as paid')).toBeInTheDocument();
  });

  it('displays client names and companies', () => {
    render(<InvoiceTable {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });
});

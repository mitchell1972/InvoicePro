import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock AuthContext provider
const MockAuthProvider = ({ children }) => {
  return children;
};

function AllProviders({ children }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

function customRender(ui, options) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock data
export const mockInvoice = {
  id: 'inv_0001',
  number: '0001',
  client: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp'
  },
  items: [
    { description: 'Web Development', qty: 10, unitPrice: 100, taxPercent: 20 },
    { description: 'Design Services', qty: 5, unitPrice: 80, taxPercent: 20 }
  ],
  totals: { subtotal: 1400, tax: 280, total: 1680 },
  status: 'Draft',
  issueDate: '2026-03-01',
  dueDate: '2026-03-31',
  terms: 'Net 30',
  currency: 'GBP',
  notes: 'Thank you for your business',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z'
};

export const mockInvoices = [
  mockInvoice,
  {
    ...mockInvoice,
    id: 'inv_0002',
    number: '0002',
    client: { name: 'Jane Smith', email: 'jane@example.com', company: 'Smith Ltd' },
    status: 'Sent',
    totals: { subtotal: 500, tax: 100, total: 600 }
  },
  {
    ...mockInvoice,
    id: 'inv_0003',
    number: '0003',
    client: { name: 'Bob Wilson', email: 'bob@example.com', company: 'Wilson Inc' },
    status: 'Paid',
    totals: { subtotal: 2000, tax: 400, total: 2400 }
  }
];

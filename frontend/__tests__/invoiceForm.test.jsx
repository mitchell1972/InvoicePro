import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InvoiceForm from '../src/components/InvoiceForm';

const MockedInvoiceForm = () => (
  <BrowserRouter>
    <InvoiceForm />
  </BrowserRouter>
);

describe('InvoiceForm', () => {
  test('renders invoice form', () => {
    render(<MockedInvoiceForm />);
    expect(screen.getByText(/new invoice/i)).toBeInTheDocument();
    expect(screen.getByText(/client details/i)).toBeInTheDocument();
    expect(screen.getByText(/line items/i)).toBeInTheDocument();
  });

  test('can add and remove line items', () => {
    render(<MockedInvoiceForm />);
    const addButton = screen.getByText(/add line item/i);
    fireEvent.click(addButton);
    const descriptionInputs = screen.getAllByPlaceholderText(/description/i);
    expect(descriptionInputs).toHaveLength(2);
    const removeButtons = screen.getAllByText(/remove/i);
    fireEvent.click(removeButtons[0]);
    const updatedInputs = screen.getAllByPlaceholderText(/description/i);
    expect(updatedInputs).toHaveLength(1);
  });

  test('calculates totals correctly', () => {
    render(<MockedInvoiceForm />);
    const qtyInput = screen.getByPlaceholderText(/qty/i);
    const priceInput = screen.getByPlaceholderText(/price/i);
    fireEvent.change(qtyInput, { target: { value: '2' } });
    fireEvent.change(priceInput, { target: { value: '100' } });
    expect(screen.getByText(/\$200.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$40.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$240.00/)).toBeInTheDocument();
  });
});



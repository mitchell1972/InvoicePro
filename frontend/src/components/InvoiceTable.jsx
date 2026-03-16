import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, isOverdue } from '../utils/money';
import StatusBadge from './StatusBadge';

export default function InvoiceTable({ invoices, onStatusChange, onDelete, selectedInvoices = [], onSelectionChange }) {
  const navigate = useNavigate();

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(invoices);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectInvoice = (invoice, checked) => {
    if (checked) {
      onSelectionChange([...selectedInvoices, invoice]);
    } else {
      onSelectionChange(selectedInvoices.filter(inv => inv.id !== invoice.id));
    }
  };

  const isSelected = (invoiceId) => {
    return selectedInvoices.some(inv => inv.id === invoiceId);
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" aria-label="Invoices">
        <thead className="bg-gray-50">
          <tr>
            {onSelectionChange && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  aria-label="Select all invoices"
                />
              </th>
            )}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => {
            const overdue = invoice.status === 'Sent' && isOverdue(invoice.dueDate);
            return (
              <tr key={invoice.id} className="hover:bg-gray-50">
                {onSelectionChange && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice, e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      aria-label={`Select invoice #${invoice.number} for ${invoice.client.name}`}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="text-primary-600 hover:text-primary-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
                    aria-label={`View invoice #${invoice.number}`}
                  >
                    #{invoice.number}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{invoice.client.name}</div>
                    <div className="text-sm text-gray-500">{invoice.client.company}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.issueDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(invoice.dueDate)}
                  {overdue && <span className="ml-2 text-red-600 text-xs font-medium">(Overdue)</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(invoice.totals.total, invoice.currency)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={overdue ? 'Overdue' : invoice.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="text-primary-600 hover:text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
                      aria-label={`View invoice #${invoice.number} for ${invoice.client.name}`}
                    >
                      View
                    </button>
                    {invoice.status === 'Draft' && (
                      <button
                        onClick={() => onStatusChange(invoice.id, 'Sent')}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                        aria-label={`Send invoice #${invoice.number}`}
                      >
                        Send
                      </button>
                    )}
                    {invoice.status === 'Sent' && (
                      <button
                        onClick={() => onStatusChange(invoice.id, 'Paid')}
                        className="text-green-600 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-1"
                        aria-label={`Mark invoice #${invoice.number} as paid`}
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(invoice.id)}
                      className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
                      aria-label={`Delete invoice #${invoice.number}`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

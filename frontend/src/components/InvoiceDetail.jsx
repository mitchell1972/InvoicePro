import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatCurrency, formatDate } from '../utils/money';
import StatusBadge from './StatusBadge';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await apiClient.get(`/invoices/${id}`);
      setInvoice(data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      await apiClient.post('/invoices/send', { invoiceId: invoice.id, recipientEmail: invoice.client.email });
      await apiClient.put(`/invoices/${id}`, { status: 'Sent' });
      fetchInvoice();
      alert('Invoice sent successfully!');
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  const handleMarkPaid = async () => {
    try {
      await apiClient.put(`/invoices/${id}`, { status: 'Paid' });
      fetchInvoice();
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  const paymentLink = `${window.location.origin}/pay/${invoice.id}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.number}</h1>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex gap-2">
          {invoice.status === 'Draft' && (
            <button onClick={handleSend} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Send Invoice
            </button>
          )}
          {invoice.status === 'Sent' && (
            <button onClick={handleMarkPaid} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Mark as Paid
            </button>
          )}
          <button onClick={() => navigate(`/invoices/${id}/edit`)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Edit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
              <p className="font-semibold">{invoice.client.name}</p>
              <p className="text-gray-600">{invoice.client.email}</p>
              {invoice.client.company && <p className="text-gray-600">{invoice.client.company}</p>}
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Issue Date: <span className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</span></p>
                <p className="text-sm text-gray-500">Due Date: <span className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</span></p>
                <p className="text-sm text-gray-500">Terms: <span className="font-medium text-gray-900">{invoice.terms}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-700">Description</th>
                <th className="text-right py-2 text-sm font-medium text-gray-700">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-gray-700">Price</th>
                <th className="text-right py-2 text-sm font-medium text-gray-700">Tax</th>
                <th className="text-right py-2 text-sm font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 text-sm">{item.description}</td>
                  <td className="py-3 text-sm text-right">{item.qty}</td>
                  <td className="py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-sm text-right">{item.taxPercent}%</td>
                  <td className="py-3 text-sm text-right font-medium">{formatCurrency(item.qty * item.unitPrice * (1 + item.taxPercent / 100))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="space-y-2 text-right">
              <div className="flex justify-between gap-8">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{formatCurrency(invoice.totals.tax)}</span>
              </div>
              <div className="flex justify-between gap-8 text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>{formatCurrency(invoice.totals.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6 pt-6 border-top border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {invoice.status === 'Sent' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Link</h3>
              <div className="flex gap-2">
                <input type="text" value={paymentLink} readOnly className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm" />
                <button onClick={() => navigator.clipboard.writeText(paymentLink)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">Copy Link</button>
              </div>
            </div>
          )}

          {invoice.reminders && invoice.reminders.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Reminder History</h3>
              <div className="space-y-2">
                {invoice.reminders.map((reminder, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-yellow-800 capitalize">{reminder.type} Reminder</p>
                      <p className="text-xs text-yellow-600">{reminder.daysPastDue} days past due</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-yellow-600">{formatDate(reminder.sentAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



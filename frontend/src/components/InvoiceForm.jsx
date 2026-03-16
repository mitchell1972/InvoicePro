import React, { useState, useEffect, useId } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { calculateInvoiceTotals, formatCurrency } from '../utils/money';
import { validateInvoiceForm } from '../utils/validators';
import { saveFallbackInvoice, getFallbackInvoiceById } from '../utils/invoiceStorage';
import { sendInvoiceEmailJS, initEmailJS, isEmailJSConfigured } from '../utils/emailjs-service';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const formId = useId();

  const [formData, setFormData] = useState({
    client: { name: '', email: '', company: '' },
    items: [{ description: '', qty: 1, unitPrice: 0, taxPercent: 20 }],
    notes: '',
    terms: 'Net 30',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'GBP'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [bankingDetails, setBankingDetails] = useState(null);

  useEffect(() => {
    const settings = localStorage.getItem('invoiceSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setBankingDetails(parsed.banking);
    }
    if (isEdit) {
      fetchInvoice();
    }
    if (isEmailJSConfigured()) {
      initEmailJS();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await apiClient.get(`/invoices/${id}`);
      setFormData(data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    }
  };

  const handleSubmit = async (e, action = 'save') => {
    e.preventDefault();
    const validationErrors = validateInvoiceForm(formData);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setLoading(true);
    setErrors({});

    let invoice;
    let apiSucceeded = false;

    try {
      if (isEdit) {
        const { data } = await apiClient.put(`/invoices/${id}`, formData);
        invoice = data;
      } else {
        const { data } = await apiClient.post('/invoices', formData);
        invoice = data;
      }
      apiSucceeded = true;

      if (action === 'send') {
        const settings = localStorage.getItem('invoiceSettings');
        const settingsData = settings ? JSON.parse(settings) : {};
        const bankingDetails = settingsData.banking || null;
        const companyDetails = settingsData.company || { name: 'Your Company' };

        let emailSent = false;
        try {
          const emailResponse = await apiClient.post('/invoices/send', {
            invoiceId: invoice.id,
            recipientEmail: invoice.client.email,
            bankingDetails,
            companyDetails
          });
          emailSent = !!emailResponse.data?.success;
        } catch (emailError) {
          try {
            const gmailRes = await apiClient.post('/invoices/gmail-send', {
              invoiceId: invoice.id,
              recipientEmail: invoice.client.email,
              bankingDetails,
              companyDetails
            });
            emailSent = !!gmailRes.data?.success;
          } catch (gmailErr) {
            console.error('Gmail fallback failed:', gmailErr);
          }
        }

        if (emailSent) {
          await apiClient.put(`/invoices/${invoice.id}`, { status: 'Sent' });
          invoice.status = 'Sent';
          alert(`Invoice emailed to ${invoice.client.email}`);
        } else {
          invoice.status = 'Draft';
          alert('Email failed to send. The invoice was saved as Draft. You can try again later.');
        }
      }
    } catch (error) {
      console.error('Failed to save invoice to API:', error);
      if (!isEdit) {
        const timestamp = Date.now();
        const invoiceNumber = String(Math.floor(timestamp / 1000) % 10000).padStart(4, '0');
        invoice = {
          ...formData,
          id: `inv_${invoiceNumber}`,
          number: invoiceNumber,
          totals: totals,
          status: 'Draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        const existing = getFallbackInvoiceById(id);
        invoice = {
          ...existing,
          ...formData,
          totals: totals,
          status: action === 'send' ? 'Sent' : 'Draft',
          updatedAt: new Date().toISOString()
        };
      }
      saveFallbackInvoice(invoice);
    }

    if (invoice && apiSucceeded) {
      saveFallbackInvoice(invoice);
    }

    navigate('/dashboard');
    setLoading(false);
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', qty: 1, unitPrice: 0, taxPercent: 20 }]
    });
  };

  const removeLineItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateLineItem = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = field === 'description' ? value : Number(value);
    setFormData({ ...formData, items });
  };

  const totals = calculateInvoiceTotals(formData.items);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">{errors.general}</div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-6" aria-label={isEdit ? 'Edit invoice' : 'Create new invoice'}>
        <fieldset className="bg-white rounded-lg shadow p-6">
          <legend className="text-lg font-semibold mb-4">Client Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor={`${formId}-client-name`} className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                id={`${formId}-client-name`}
                type="text"
                value={formData.client.name}
                onChange={(e) => setFormData({ ...formData, client: { ...formData.client, name: e.target.value } })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.clientName ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={!!errors.clientName}
                aria-describedby={errors.clientName ? `${formId}-client-name-error` : undefined}
                required
              />
              {errors.clientName && <p id={`${formId}-client-name-error`} className="mt-1 text-sm text-red-600" role="alert">{errors.clientName}</p>}
            </div>
            <div>
              <label htmlFor={`${formId}-client-email`} className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                id={`${formId}-client-email`}
                type="email"
                value={formData.client.email}
                onChange={(e) => setFormData({ ...formData, client: { ...formData.client, email: e.target.value } })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.clientEmail ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={!!errors.clientEmail}
                aria-describedby={errors.clientEmail ? `${formId}-client-email-error` : undefined}
                required
              />
              {errors.clientEmail && <p id={`${formId}-client-email-error`} className="mt-1 text-sm text-red-600" role="alert">{errors.clientEmail}</p>}
            </div>
            <div>
              <label htmlFor={`${formId}-client-company`} className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                id={`${formId}-client-company`}
                type="text"
                value={formData.client.company}
                onChange={(e) => setFormData({ ...formData, client: { ...formData.client, company: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-lg shadow p-6">
          <legend className="text-lg font-semibold mb-4">Line Items</legend>
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label htmlFor={`${formId}-item-${index}-desc`} className="sr-only">Item {index + 1} description</label>
                  <input id={`${formId}-item-${index}-desc`} type="text" placeholder="Description" value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="w-20">
                  <label htmlFor={`${formId}-item-${index}-qty`} className="sr-only">Item {index + 1} quantity</label>
                  <input id={`${formId}-item-${index}-qty`} type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateLineItem(index, 'qty', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" min="1" />
                </div>
                <div className="w-32">
                  <label htmlFor={`${formId}-item-${index}-price`} className="sr-only">Item {index + 1} unit price</label>
                  <input id={`${formId}-item-${index}-price`} type="number" placeholder="Price" value={item.unitPrice} onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" min="0" step="0.01" />
                </div>
                <div className="w-20">
                  <label htmlFor={`${formId}-item-${index}-tax`} className="sr-only">Item {index + 1} tax percent</label>
                  <input id={`${formId}-item-${index}-tax`} type="number" placeholder="Tax %" value={item.taxPercent} onChange={(e) => updateLineItem(index, 'taxPercent', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" min="0" max="100" />
                </div>
                {formData.items.length > 1 && (
                  <button type="button" onClick={() => removeLineItem(index)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={`Remove line item ${index + 1}`}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addLineItem} className="mt-4 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
            Add Line Item
          </button>
        </fieldset>

        <div className="bg-white rounded-lg shadow p-6" aria-label="Invoice totals">
          <div className="flex justify-end">
            <dl className="space-y-2 text-right">
              <div className="flex justify-between gap-8">
                <dt className="text-gray-600">Subtotal:</dt>
                <dd className="font-medium">{formatCurrency(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-8">
                <dt className="text-gray-600">Tax:</dt>
                <dd className="font-medium">{formatCurrency(totals.tax)}</dd>
              </div>
              <div className="flex justify-between gap-8 text-lg font-bold">
                <dt>Total:</dt>
                <dd>{formatCurrency(totals.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <fieldset className="bg-white rounded-lg shadow p-6">
          <legend className="text-lg font-semibold mb-4">Payment Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-issue-date`} className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input id={`${formId}-issue-date`} type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label htmlFor={`${formId}-due-date`} className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input id={`${formId}-due-date`} type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label htmlFor={`${formId}-terms`} className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select id={`${formId}-terms`} value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on receipt">Due on receipt</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-currency`} className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select id={`${formId}-currency`} value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor={`${formId}-notes`} className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id={`${formId}-notes`} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Additional notes or payment instructions..." />
          </div>

          {bankingDetails && (
            <aside className="mt-6 pt-6 border-t border-gray-200" aria-label="Bank transfer details">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Bank Transfer Details (Read-Only)</h3>
              <p className="text-sm text-gray-500 mb-3">
                These details are managed in{' '}
                <Link to="/settings" className="text-primary-600 hover:underline">Settings</Link> and will be included in the invoice email.
              </p>
              {bankingDetails.country === 'GB' && bankingDetails.uk?.bankName && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-gray-600">Bank Name:</dt><dd className="font-medium text-gray-900">{bankingDetails.uk.bankName}</dd></div>
                    <div><dt className="text-gray-600">Account Name:</dt><dd className="font-medium text-gray-900">{bankingDetails.uk.accountName}</dd></div>
                    <div><dt className="text-gray-600">Sort Code:</dt><dd className="font-medium text-gray-900 font-mono">{bankingDetails.uk.sortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3')}</dd></div>
                    <div><dt className="text-gray-600">Account Number:</dt><dd className="font-medium text-gray-900 font-mono">{bankingDetails.uk.accountNumber}</dd></div>
                  </dl>
                </div>
              )}
              {bankingDetails.country === 'US' && bankingDetails.us?.bankName && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-gray-600">Bank Name:</dt><dd className="font-medium text-gray-900">{bankingDetails.us.bankName}</dd></div>
                    <div><dt className="text-gray-600">Account Name:</dt><dd className="font-medium text-gray-900">{bankingDetails.us.accountName}</dd></div>
                    <div><dt className="text-gray-600">Routing Number (ABA):</dt><dd className="font-medium text-gray-900 font-mono">{bankingDetails.us.routingNumber}</dd></div>
                    <div><dt className="text-gray-600">Account Number:</dt><dd className="font-medium text-gray-900 font-mono">{bankingDetails.us.accountNumber}</dd></div>
                  </dl>
                </div>
              )}
              {(!bankingDetails.country || (bankingDetails.country === 'GB' && !bankingDetails.uk?.bankName) || (bankingDetails.country === 'US' && !bankingDetails.us?.bankName)) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" role="status">
                  <p className="text-sm text-yellow-800">No banking details configured.</p>
                </div>
              )}
            </aside>
          )}
        </fieldset>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, 'send')} disabled={loading} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            {loading ? 'Sending...' : 'Save & Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

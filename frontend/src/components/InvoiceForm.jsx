import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import { calculateInvoiceTotals, formatCurrency } from '../utils/money';
import { validateInvoiceForm } from '../utils/validators';
import { saveFallbackInvoice, getFallbackInvoiceById } from '../utils/invoiceStorage';
import { sendInvoiceEmailJS, initEmailJS, isEmailJSConfigured } from '../utils/emailjs-service';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

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
    // Load banking details from settings
    const settings = localStorage.getItem('invoiceSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setBankingDetails(parsed.banking);
    }

    if (isEdit) {
      fetchInvoice();
    }
    // Initialize EmailJS
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
      // Try API first
      if (isEdit) {
        const { data } = await apiClient.put(`/invoices/${id}`, formData);
        invoice = data;
      } else {
        const { data } = await apiClient.post('/invoices', formData);
        invoice = data;
      }
      apiSucceeded = true;

      if (action === 'send') {
        // Get banking details and company details from localStorage
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
          console.error('Primary email send failed, attempting Gmail fallback:', emailError);
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
          alert(`✅ Invoice emailed to ${invoice.client.email}`);
        } else {
          // Keep as Draft if email didn't send
          invoice.status = 'Draft';
          alert('❌ Email failed to send. The invoice was saved as Draft. You can try again later.');
        }
      }
    } catch (error) {
      console.error('Failed to save invoice to API:', error);
      
      // When API fails, create invoice locally with fallback storage
      console.log('Saving invoice to fallback storage...');
      
      // Generate invoice ID if new
      if (!isEdit) {
        const timestamp = Date.now();
        const invoiceNumber = String(Math.floor(timestamp / 1000) % 10000).padStart(4, '0');
        invoice = {
          ...formData,
          id: `inv_${invoiceNumber}`,
          number: invoiceNumber,
          totals: totals,
          // If sending failed due to API down, keep as Draft
          status: 'Draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        // For edits, get existing invoice and update it
        const existing = getFallbackInvoiceById(id);
        invoice = {
          ...existing,
          ...formData,
          totals: totals,
          status: action === 'send' ? 'Sent' : 'Draft',
          updatedAt: new Date().toISOString()
        };
      }
      
      // Save to fallback storage
      saveFallbackInvoice(invoice);
      console.log('Invoice saved to fallback storage:', invoice);
    }
    
    // Always save to fallback storage as backup
    if (invoice && apiSucceeded) {
      saveFallbackInvoice(invoice);
    }
    
    // Navigate to dashboard to show the saved invoice in the list
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errors.general}</div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Client Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.client.name}
                onChange={(e) => setFormData({ ...formData, client: { ...formData.client, name: e.target.value } })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.clientName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.clientName && <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.client.email}
                onChange={(e) => setFormData({ ...formData, client: { ...formData.client, email: e.target.value } })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.clientEmail ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.clientEmail && <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={formData.client.company}
                onChange={(e) => setFormData({ ...formData, client: { ...formData.client, company: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Line Items</h2>
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={(e) => updateLineItem(index, 'qty', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="1"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Tax %"
                  value={item.taxPercent}
                  onChange={(e) => updateLineItem(index, 'taxPercent', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  max="100"
                />
                {formData.items.length > 1 && (
                  <button type="button" onClick={() => removeLineItem(index)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addLineItem} className="mt-4 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
            Add Line Item
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-end">
            <div className="space-y-2 text-right">
              <div className="flex justify-between gap-8">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between gap-8 text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on receipt">Due on receipt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Additional notes or payment instructions..."
            />
          </div>

          {bankingDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Bank Transfer Details (Read-Only)</h3>
              <p className="text-sm text-gray-500 mb-3">
                These details are managed in{' '}
                <a href="/settings" className="text-primary-600 hover:underline">Settings</a> and will be included in the invoice email.
              </p>
              
              {bankingDetails.country === 'GB' && bankingDetails.uk?.bankName && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Bank Name:</span>
                      <p className="font-medium text-gray-900">{bankingDetails.uk.bankName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Account Name:</span>
                      <p className="font-medium text-gray-900">{bankingDetails.uk.accountName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Sort Code:</span>
                      <p className="font-medium text-gray-900 font-mono">
                        {bankingDetails.uk.sortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Account Number:</span>
                      <p className="font-medium text-gray-900 font-mono">{bankingDetails.uk.accountNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {bankingDetails.country === 'US' && bankingDetails.us?.bankName && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Bank Name:</span>
                      <p className="font-medium text-gray-900">{bankingDetails.us.bankName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Account Name:</span>
                      <p className="font-medium text-gray-900">{bankingDetails.us.accountName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Routing Number (ABA):</span>
                      <p className="font-medium text-gray-900 font-mono">{bankingDetails.us.routingNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Account Number:</span>
                      <p className="font-medium text-gray-900 font-mono">{bankingDetails.us.accountNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {(!bankingDetails.country || (bankingDetails.country === 'GB' && !bankingDetails.uk?.bankName) || (bankingDetails.country === 'US' && !bankingDetails.us?.bankName)) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    No banking details configured.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400">
            Save as Draft
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, 'send')} disabled={loading} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-primary-400">
            Save & Send
          </button>
        </div>
      </form>
    </div>
  );
}

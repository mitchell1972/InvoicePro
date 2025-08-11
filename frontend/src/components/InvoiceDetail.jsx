import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatCurrency, formatDate } from '../utils/money';
import StatusBadge from './StatusBadge';
import EmailPreview from './EmailPreview';
import { getFallbackInvoiceById, saveFallbackInvoice } from '../utils/invoiceStorage';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankingDetails, setBankingDetails] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    fetchInvoice();
    loadBankingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadBankingDetails = () => {
    const settings = localStorage.getItem('invoiceSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setBankingDetails(parsed.banking);
    }
  };

  const fetchInvoice = async () => {
    try {
      const { data } = await apiClient.get(`/invoices/${id}`);
      setInvoice(data);
    } catch (error) {
      console.error('Failed to fetch invoice from API:', error);
      
      // Try fallback localStorage data when API fails
      console.log('Attempting to load invoice from fallback storage...');
      const fallbackInvoice = getFallbackInvoiceById(id);
      
      if (fallbackInvoice) {
        console.log('Invoice found in fallback storage:', fallbackInvoice);
        setInvoice(fallbackInvoice);
      } else {
        console.log('Invoice not found in fallback storage either');
        // If invoice not found, it might be due to serverless cold start
        // Show more helpful error message
        if (error.response?.status === 404) {
          console.log('Invoice not found - this may be due to serverless cold start or the invoice was not saved properly');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      // Get banking details and company details from localStorage
      const settings = localStorage.getItem('invoiceSettings');
      const settingsData = settings ? JSON.parse(settings) : {};
      const bankingDetails = settingsData.banking || null;
      const companyDetails = settingsData.company || { name: 'Your Company' };
      
      const response = await apiClient.post('/invoices/send', { 
        invoiceId: invoice.id, 
        recipientEmail: invoice.client.email,
        bankingDetails,
        companyDetails
      });
      
      await apiClient.put(`/invoices/${id}`, { status: 'Sent' });
      
      // Also update fallback storage to keep in sync
      saveFallbackInvoice({ 
        ...invoice, 
        status: 'Sent', 
        updatedAt: new Date().toISOString() 
      });
      
      fetchInvoice();
      
      if (response.data.success) {
        alert(`✅ Invoice sent successfully!\n\n📧 Sent to: ${invoice.client.email}\n📅 Sent at: ${new Date(response.data.sentAt).toLocaleString()}\n📋 Email ID: ${response.data.emailId}`);
      } else {
        alert('Invoice sent successfully!');
      }
      
      // Log email details for debugging
      console.log('Email sent successfully:', {
        invoiceId: invoice.id,
        recipientEmail: invoice.client.email,
        emailId: response.data.emailId,
        sentAt: response.data.sentAt
      });
      
    } catch (error) {
      console.error('Failed to send invoice:', error);
      console.error('Error response:', error.response?.data);
      
      // Extract error message properly
      let errorMessage = 'Unknown error occurred';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (typeof errorData.error === 'object' && errorData.error !== null) {
          // Handle object error (this is causing the [object Object] issue)
          errorMessage = errorData.error.message || JSON.stringify(errorData.error);
        } else if (errorData.details) {
          errorMessage = errorData.details;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // More specific error messages
      if (error.response?.status === 403) {
        alert('❌ Email sending failed: Testing mode restriction.\n\nIn development mode, emails can only be sent to the verified owner email address.\n\nTo send to any email address, you need to:\n1. Set up a verified domain in Resend\n2. Update the FROM_EMAIL to use your domain');
      } else if (error.response?.status === 404) {
        alert('❌ Invoice not found. Please refresh and try again.');
      } else if (error.response?.status === 500 && errorMessage.includes('RESEND_API_KEY')) {
        alert('❌ Email service not configured.\n\nTo send emails, you need to:\n1. Sign up for a free Resend account at https://resend.com\n2. Get your API key from the Resend dashboard\n3. Add RESEND_API_KEY to your environment variables in Vercel\n\nSee RESEND_SETUP.md for detailed instructions.');
      } else {
        alert(`❌ Failed to send invoice.\n\nError: ${errorMessage}\n\nPlease check your email settings and try again.`);
      }
    }
  };

  const handlePreviewEmail = () => {
    setShowEmailPreview(true);
  };

  const handleMarkPaid = async () => {
    try {
      await apiClient.put(`/invoices/${id}`, { status: 'Paid' });
      
      // Also update fallback storage to keep in sync
      saveFallbackInvoice({ 
        ...invoice, 
        status: 'Paid', 
        updatedAt: new Date().toISOString() 
      });
      
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
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Invoice Not Found</h2>
          <p className="text-red-600 mb-4">
            The invoice with ID "{id}" could not be found.
          </p>
          <p className="text-sm text-red-600 mb-4">
            This may occur due to:
            <br />• Serverless function cold start (data reset)
            <br />• Invoice was not saved properly
            <br />• Invalid invoice ID
          </p>
          <div className="flex justify-center gap-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
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
            <>
              <button onClick={handlePreviewEmail} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Preview Email
              </button>
              <button onClick={handleSend} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Send Invoice
              </button>
            </>
          )}
          {invoice.status === 'Sent' && (
            <>
              <button onClick={handlePreviewEmail} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Preview Email
              </button>
              <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Resend Invoice
              </button>
              <button onClick={handleMarkPaid} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Mark as Paid
              </button>
            </>
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

          {bankingDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Bank Transfer Details</h3>
              
              {bankingDetails.country === 'GB' && bankingDetails.uk && bankingDetails.uk.bankName && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">UK Bank Transfer</h4>
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
                  <p className="text-xs text-gray-600 mt-3">
                    Please use <strong>#{invoice.number}</strong> as the payment reference.
                  </p>
                </div>
              )}

              {bankingDetails.country === 'US' && bankingDetails.us && bankingDetails.us.bankName && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">US Bank Transfer (ACH)</h4>
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
                  <p className="text-xs text-gray-600 mt-3">
                    Please use <strong>#{invoice.number}</strong> as the payment reference.
                  </p>
                </div>
              )}

              {!bankingDetails.country || (bankingDetails.country === 'GB' && !bankingDetails.uk?.bankName) || (bankingDetails.country === 'US' && !bankingDetails.us?.bankName) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Banking details not configured. Set up your bank transfer details in{' '}
                    <button 
                      onClick={() => navigate('/settings')}
                      className="font-medium underline hover:text-yellow-900"
                    >
                      Settings
                    </button>{' '}
                    to include them in invoice emails.
                  </p>
                </div>
              )}
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

      {showEmailPreview && (
        <EmailPreview
          invoice={invoice}
          onClose={() => setShowEmailPreview(false)}
          onSend={handleSend}
        />
      )}
    </div>
  );
}



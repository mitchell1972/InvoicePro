import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatDate } from '../utils/money';
import apiClient from '../api/client';

export default function EmailPreview({ invoice, onClose, onSend }) {
  const [bankingDetails, setBankingDetails] = useState(null);
  const [emailContent, setEmailContent] = useState('');
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    // Save previous focus for restoration
    previousFocusRef.current = document.activeElement;
    loadBankingDetails();
    generateEmailContent();

    // Focus the dialog
    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    // Trap focus and handle Escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [invoice]);

  const loadBankingDetails = () => {
    const settings = localStorage.getItem('invoiceSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setBankingDetails(parsed.banking);
    }
  };

  const generateEmailContent = async () => {
    if (!invoice) return;

    try {
      const settings = localStorage.getItem('invoiceSettings');
      const settingsData = settings ? JSON.parse(settings) : {};
      const bankingDetails = settingsData.banking || null;
      const companyDetails = settingsData.company || { name: 'Your Company' };

      const response = await apiClient.post('/invoices/email-service', {
        action: 'preview_invoice',
        invoiceId: invoice.id,
        bankingDetails,
        companyDetails
      });

      if (response.data.success) {
        setEmailContent(response.data.emailContent);
      } else {
        const fallbackContent = `Subject: Invoice #${invoice.number} - ${formatCurrency(invoice.totals.total)}

Dear ${invoice.client.name},

Thank you for your business! Please find your invoice details below:

Invoice Number: #${invoice.number}
Issue Date: ${formatDate(invoice.issueDate)}
Due Date: ${formatDate(invoice.dueDate)}
Total Amount: ${formatCurrency(invoice.totals.total)}

Payment Link: ${window.location.origin}/pay/${invoice.id}

If you have any questions, please contact us.

Best regards,
${companyDetails?.name || 'Your Company'}`;

        setEmailContent(fallbackContent);
      }
    } catch (error) {
      console.error('Failed to generate email preview:', error);
      setEmailContent(`Subject: Invoice #${invoice.number}\n\nDear ${invoice.client.name},\n\nPlease find invoice #${invoice.number} for ${formatCurrency(invoice.totals.total)}.\n\nThank you!`);
    }
  };

  const handleSend = async () => {
    try {
      await onSend();
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="email-preview-title">
      <div ref={dialogRef} tabIndex={-1} className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden outline-none">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 id="email-preview-title" className="text-xl font-semibold text-gray-900">Email Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="Close email preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <dl className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <dt className="text-sm text-gray-600">To:</dt>
              <dd className="text-sm font-medium text-gray-900">{invoice.client.email}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">From:</dt>
              <dd className="text-sm font-medium text-gray-900">Your Invoice System</dd>
            </div>
          </dl>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono leading-relaxed">
              {emailContent}
            </pre>
          </div>

          {!bankingDetails?.country ||
           (bankingDetails.country === 'GB' && !bankingDetails.uk?.bankName) ||
           (bankingDetails.country === 'US' && !bankingDetails.us?.bankName) ? (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4" role="alert">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Banking Details Missing</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Configure your banking details in Settings to include bank transfer options in this email.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(emailContent)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Copy Email
            </button>
            <button
              onClick={handleSend}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Send Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

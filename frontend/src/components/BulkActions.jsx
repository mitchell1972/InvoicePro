import React, { useState } from 'react';
import apiClient from '../api/client';

export default function BulkActions({ selectedInvoices, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleBulkSend = async () => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices to send');
      return;
    }

    const draftInvoices = selectedInvoices.filter(invoice => invoice.status === 'Draft');
    
    if (draftInvoices.length === 0) {
      alert('No draft invoices selected');
      return;
    }

    if (!confirm(`Send ${draftInvoices.length} invoice(s) to customers?`)) {
      return;
    }

    setIsProcessing(true);
    const sendResults = [];

    // Get banking details from localStorage
    const settings = localStorage.getItem('invoiceSettings');
    const bankingDetails = settings ? JSON.parse(settings).banking : null;

    try {
      for (const invoice of draftInvoices) {
        try {
          // Send invoice
          await apiClient.post('/invoices/send', {
            invoiceId: invoice.id,
            recipientEmail: invoice.client.email,
            bankingDetails
          });

          // Update status
          await apiClient.put(`/invoices/${invoice.id}`, { status: 'Sent' });

          sendResults.push({
            invoice: invoice.number,
            client: invoice.client.name,
            email: invoice.client.email,
            status: 'success'
          });
        } catch (error) {
          console.error(`Failed to send invoice ${invoice.number}:`, error);
          sendResults.push({
            invoice: invoice.number,
            client: invoice.client.name,
            email: invoice.client.email,
            status: 'error',
            error: error.message
          });
        }
      }

      setResults(sendResults);
      onSuccess();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices to mark as paid');
      return;
    }

    const sentInvoices = selectedInvoices.filter(invoice => invoice.status === 'Sent');
    
    if (sentInvoices.length === 0) {
      alert('No sent invoices selected');
      return;
    }

    if (!confirm(`Mark ${sentInvoices.length} invoice(s) as paid?`)) {
      return;
    }

    setIsProcessing(true);

    try {
      for (const invoice of sentInvoices) {
        await apiClient.put(`/invoices/${invoice.id}`, { status: 'Paid' });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to update invoices:', error);
      alert('Failed to update some invoices');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeResults = () => {
    setResults(null);
  };

  if (selectedInvoices.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-800 font-medium">{selectedInvoices.length} invoice(s) selected</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleBulkSend}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isProcessing ? 'Sending...' : 'Send Selected'}
            </button>
            <button
              onClick={handleBulkMarkPaid}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isProcessing ? 'Processing...' : 'Mark as Paid'}
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Bulk Send Results</h2>
              <button
                onClick={closeResults}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Invoice #{result.invoice}</p>
                        <p className="text-sm text-gray-600">{result.client} ({result.email})</p>
                      </div>
                      <div className="flex items-center">
                        {result.status === 'success' ? (
                          <>
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-green-800 text-sm font-medium">Sent</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-800 text-sm font-medium">Failed</span>
                          </>
                        )}
                      </div>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-2">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total processed:</span>
                  <span className="font-medium text-gray-900">{results.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Successful:</span>
                  <span className="font-medium text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeResults}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
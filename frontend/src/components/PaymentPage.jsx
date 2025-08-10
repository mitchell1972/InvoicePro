import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import apiClient from '../api/client';
import { formatCurrency, formatDate } from '../utils/money';

export default function PaymentPage() {
  const { id } = useParams();
  const stripe = useStripe();
  const elements = useElements();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await apiClient.get(`/invoices/${id}`);
      setInvoice(data);
    } catch (error) {
      setError('Invoice not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { data } = await apiClient.post('/payments/create-intent', {
        amount: invoice.totals.total,
        currency: invoice.currency.toLowerCase(),
        invoiceId: invoice.id
      });

      if (data.demoMode) {
        setSuccess(true);
        await apiClient.put(`/invoices/${id}`, { status: 'Paid' });
        return;
      }

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) }
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess(true);
        await apiClient.put(`/invoices/${id}`, { status: 'Paid' });
      }
    } catch (error) {
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">This invoice may have been deleted or doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (invoice.status === 'Paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Paid</h2>
          <p className="text-gray-600">This invoice has already been paid. Thank you!</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Thank you for your payment. A receipt has been sent to your email.</p>
          <div className="text-sm text-gray-500">Invoice #{invoice.number} • {formatCurrency(invoice.totals.total, invoice.currency)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-primary-600 text-white p-6">
            <h1 className="text-2xl font-bold">Invoice Payment</h1>
            <p className="mt-1 opacity-90">Invoice #{invoice.number}</p>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Billed To</h3>
                <p className="font-semibold">{invoice.client.name}</p>
                <p className="text-gray-600 text-sm">{invoice.client.company}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Due</h3>
                <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold mb-3">Invoice Details</h3>
            <div className="space-y-2">
              {invoice.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.description} (x{item.qty})</span>
                  <span className="font-medium">{formatCurrency(item.qty * item.unitPrice * (1 + item.taxPercent / 100), invoice.currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(invoice.totals.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(invoice.totals.tax, invoice.currency)}</span>
              </div>
              <div className="flex justify-between mt-3 text-lg font-bold">
                <span>Total Due</span>
                <span>{formatCurrency(invoice.totals.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <h3 className="font-semibold mb-4">Payment Information</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
              <div className="p-3 border border-gray-300 rounded-lg">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': { color: '#aab7c4' }
                      },
                      invalid: { color: '#9e2146' }
                    }
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <button type="submit" disabled={!stripe || processing} className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              {processing ? 'Processing...' : `Pay ${formatCurrency(invoice.totals.total, invoice.currency)}`}
            </button>

            <p className="mt-4 text-xs text-center text-gray-500">Powered by Stripe. Your payment information is secure and encrypted.</p>
          </form>
        </div>
      </div>
    </div>
  );
}



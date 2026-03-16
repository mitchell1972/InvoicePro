import React, { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import SummaryCards from './SummaryCards';
import InvoiceTable from './InvoiceTable';
import SubscriptionStatus from './SubscriptionStatus';
import BulkActions from './BulkActions';
import StorageWarning from './StorageWarning';
import { getFallbackInvoices, getFallbackInvoiceById, saveFallbackInvoice, deleteFallbackInvoice, initializeFallbackStorage } from '../utils/invoiceStorage';

export default function Dashboard() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const searchId = useId();
  const filterId = useId();

  useEffect(() => {
    initializeFallbackStorage();
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterStatus]);

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (filterStatus) params.status = filterStatus;
      const { data } = await apiClient.get('/invoices', { params });

      const fallbackInvoices = getFallbackInvoices();
      const apiInvoiceIds = new Set(data.map(inv => inv.id));
      const missingFromApi = fallbackInvoices.filter(inv => !apiInvoiceIds.has(inv.id));
      const combinedInvoices = [...data, ...missingFromApi];

      let filteredInvoices = combinedInvoices;
      if (searchQuery) {
        filteredInvoices = filteredInvoices.filter(inv =>
          inv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.number.includes(searchQuery)
        );
      }
      if (filterStatus) {
        filteredInvoices = filteredInvoices.filter(inv => inv.status === filterStatus);
      }

      setInvoices(filteredInvoices);
      setSelectedInvoices([]);
    } catch (error) {
      let fallbackInvoices = getFallbackInvoices();

      if (searchQuery) {
        fallbackInvoices = fallbackInvoices.filter(inv =>
          inv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.number.includes(searchQuery)
        );
      }
      if (filterStatus) {
        fallbackInvoices = fallbackInvoices.filter(inv => inv.status === filterStatus);
      }

      setInvoices(fallbackInvoices);
      setSelectedInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiClient.put(`/invoices/${id}`, { status: newStatus });

      const fallbackInvoice = getFallbackInvoiceById(id);
      if (fallbackInvoice) {
        saveFallbackInvoice({
          ...fallbackInvoice,
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      }

      fetchInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await apiClient.delete(`/invoices/${id}`);
        deleteFallbackInvoice(id);
        fetchInvoices();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" role="status">
        <div className="text-gray-500">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading invoices...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StorageWarning />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={() => navigate('/invoices/new')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          New Invoice
        </button>
      </div>

      <SubscriptionStatus />

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">Invoice Summary</h2>
        <SummaryCards invoices={invoices} />
      </section>

      <BulkActions
        selectedInvoices={selectedInvoices}
        onSuccess={fetchInvoices}
      />

      <section className="bg-white rounded-lg shadow" aria-labelledby="invoices-heading">
        <div className="p-6 border-b border-gray-200">
          <h2 id="invoices-heading" className="sr-only">Invoice List</h2>
          <div role="search" aria-label="Search invoices" className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor={searchId} className="sr-only">Search by client or invoice number</label>
              <input
                id={searchId}
                type="text"
                placeholder="Search by client or invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor={filterId} className="sr-only">Filter by status</label>
              <select
                id={filterId}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true">
          <p className="sr-only">
            {invoices.length === 0
              ? 'No invoices found'
              : `Showing ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <InvoiceTable
          invoices={invoices}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          selectedInvoices={selectedInvoices}
          onSelectionChange={setSelectedInvoices}
        />
      </section>
    </div>
  );
}

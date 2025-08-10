import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import SummaryCards from './SummaryCards';
import InvoiceTable from './InvoiceTable';

export default function Dashboard() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterStatus]);

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (filterStatus) params.status = filterStatus;
      const { data } = await apiClient.get('/invoices', { params });
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiClient.put(`/invoices/${id}`, { status: newStatus });
      fetchInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await apiClient.delete(`/invoices/${id}`);
        fetchInvoices();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={() => navigate('/invoices/new')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          New Invoice
        </button>
      </div>

      <SummaryCards invoices={invoices} />

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by client or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <InvoiceTable invoices={invoices} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      </div>
    </div>
  );
}



import React from 'react';
import { formatCurrency } from '../utils/money';

export default function SummaryCards({ invoices }) {
  const stats = {
    totalOutstanding: invoices
      .filter((inv) => inv.status === 'Sent' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + inv.totals.total, 0),
    paidThisMonth: invoices
      .filter((inv) => {
        if (inv.status !== 'Paid') return false;
        const paidDate = new Date(inv.updatedAt);
        const now = new Date();
        return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, inv) => sum + inv.totals.total, 0),
    totalInvoices: invoices.length,
    overdueCount: invoices.filter((inv) => {
      const overdue = new Date(inv.dueDate) < new Date();
      return inv.status === 'Sent' && overdue;
    }).length
  };

  const cards = [
    {
      title: 'Total Outstanding',
      value: formatCurrency(stats.totalOutstanding),
      color: 'bg-blue-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Paid This Month',
      value: formatCurrency(stats.paidThisMonth),
      color: 'bg-green-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      color: 'bg-purple-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Overdue',
      value: stats.overdueCount,
      color: stats.overdueCount > 0 ? 'bg-red-500' : 'bg-gray-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className={`${card.color} text-white p-2 rounded-lg`}>{card.icon}</div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          <p className="text-sm text-gray-500">{card.title}</p>
        </div>
      ))}
    </div>
  );
}



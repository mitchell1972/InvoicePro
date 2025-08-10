import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    Draft: 'bg-gray-100 text-gray-800',
    Sent: 'bg-blue-100 text-blue-800',
    Paid: 'bg-green-100 text-green-800',
    Overdue: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
}



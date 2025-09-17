export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export function calculateLineTotal(item) {
  return item.qty * item.unitPrice;
}

export function calculateTax(item) {
  return calculateLineTotal(item) * (item.taxPercent / 100);
}

export function calculateInvoiceTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const tax = items.reduce((sum, item) => sum + calculateTax(item), 0);
  return {
    subtotal,
    tax,
    total: subtotal + tax
  };
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function isOverdue(dueDate) {
  return new Date(dueDate) < new Date() && dueDate;
}



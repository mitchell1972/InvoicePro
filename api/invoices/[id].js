import { getInvoices, setInvoices, calculateTotals } from '../_data/invoices.js';

export default function handler(req, res) {
  const { id } = req.query || {};
  const invoices = getInvoices();
  const invoiceIndex = invoices.findIndex((inv) => inv.id === id);

  if (invoiceIndex === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(invoices[invoiceIndex]);
  }

  if (req.method === 'PUT') {
    const updates = req.body || {};

    if (updates.items) {
      updates.totals = calculateTotals(updates.items);
    }

    const updated = {
      ...invoices[invoiceIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const next = [...invoices];
    next[invoiceIndex] = updated;
    setInvoices(next);
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const next = invoices.filter((inv) => inv.id !== id);
    const deleted = invoices[invoiceIndex];
    setInvoices(next);
    return res.status(200).json({ success: true, deleted });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



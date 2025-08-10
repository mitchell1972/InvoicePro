import { getInvoices, setInvoices, calculateTotals } from '../_data/invoices.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { q, status, sort = 'createdAt', order = 'desc' } = req.query || {};
    const invoices = [...getInvoices()];

    let filtered = invoices;

    if (q) {
      filtered = filtered.filter((inv) =>
        inv.client.name.toLowerCase().includes(q.toLowerCase()) ||
        inv.client.company.toLowerCase().includes(q.toLowerCase()) ||
        inv.number.includes(q)
      );
    }

    if (status) {
      filtered = filtered.filter((inv) => inv.status === status);
    }

    filtered.sort((a, b) => {
      const aVal = sort === 'total' ? a.totals.total : a[sort];
      const bVal = sort === 'total' ? b.totals.total : b[sort];
      return order === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    return res.status(200).json(filtered);
  }

  if (req.method === 'POST') {
    const { client, items, notes, terms, issueDate, dueDate, currency = 'GBP' } = req.body || {};

    if (!client || !items || items.length === 0) {
      return res.status(400).json({ error: 'Client and items are required' });
    }

    const invoices = getInvoices();
    const totals = calculateTotals(items);
    const number = String(invoices.length + 1).padStart(4, '0');

    const newInvoice = {
      id: 'inv_' + number,
      number,
      client,
      items,
      currency,
      notes,
      terms,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      dueDate:
        dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totals,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInvoices([...invoices, newInvoice]);
    return res.status(201).json(newInvoice);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



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
    
    // Generate unique invoice number by finding the highest existing number + 1
    const existingNumbers = invoices.map(inv => parseInt(inv.number, 10)).filter(n => !isNaN(n));
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const number = String(nextNumber).padStart(4, '0');
    const id = 'inv_' + number;

    // Ensure ID is unique (fallback protection)
    let uniqueId = id;
    let counter = 1;
    while (invoices.some(inv => inv.id === uniqueId)) {
      uniqueId = `inv_${number}_${counter}`;
      counter++;
    }

    const newInvoice = {
      id: uniqueId,
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

    console.log(`[DEBUG] Creating new invoice with ID: "${uniqueId}" and number: "${number}"`);
    
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    
    console.log(`[DEBUG] Invoice created successfully. Total invoices: ${updatedInvoices.length}`);
    console.log(`[DEBUG] All invoice IDs:`, updatedInvoices.map(inv => inv.id));
    
    return res.status(201).json(newInvoice);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



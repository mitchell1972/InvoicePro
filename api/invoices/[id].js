import { getInvoices, setInvoices, calculateTotals } from '../_data/invoices.js';

export default async function handler(req, res) {
  const { id } = req.query || {};
  const invoices = await getInvoices();
  
  // Debug logging
  console.log(`[DEBUG] Looking for invoice ID: "${id}"`);
  console.log(`[DEBUG] Available invoice IDs:`, invoices.map(inv => inv.id));
  
  const invoiceIndex = invoices.findIndex((inv) => inv.id === id);

  if (invoiceIndex === -1) {
    console.log(`[DEBUG] Invoice not found - ID "${id}" not in available IDs`);
    return res.status(404).json({ 
      error: 'Invoice not found',
      requestedId: id,
      availableIds: invoices.map(inv => inv.id)
    });
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
    await setInvoices(next);
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const next = invoices.filter((inv) => inv.id !== id);
    const deleted = invoices[invoiceIndex];
    await setInvoices(next);
    return res.status(200).json({ success: true, deleted });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



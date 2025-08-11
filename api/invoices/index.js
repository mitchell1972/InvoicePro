import { getInvoices, setInvoices, calculateTotals } from '../_data/invoices.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('[DEBUG] Received GET request for invoices');
      const { q, status, sort = 'createdAt', order = 'desc' } = req.query || {};
      
      const invoices = [...(await getInvoices())];
      console.log(`[DEBUG] Loaded ${invoices.length} invoices for GET request`);

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

      console.log(`[DEBUG] Returning ${filtered.length} filtered invoices`);
      return res.status(200).json(filtered);
      
    } catch (error) {
      console.error('[ERROR] Failed to get invoices:', error);
      return res.status(500).json({ 
        error: 'Failed to retrieve invoices', 
        details: error.message 
      });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('[DEBUG] Received POST request to create invoice');
      console.log('[DEBUG] Request body:', JSON.stringify(req.body, null, 2));

      const { client, items, notes, terms, issueDate, dueDate, currency = 'GBP' } = req.body || {};

      if (!client || !items || items.length === 0) {
        console.log('[DEBUG] Validation failed: missing client or items');
        return res.status(400).json({ error: 'Client and items are required' });
      }

      console.log('[DEBUG] Loading existing invoices...');
      // Force a fresh load from storage to avoid cache issues
      const invoices = await getInvoices(true); // Force refresh to get latest data
      console.log(`[DEBUG] Loaded ${invoices.length} existing invoices from storage`);

      const totals = calculateTotals(items);
      console.log('[DEBUG] Calculated totals:', totals);
      
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
        notes: notes || '',
        terms: terms || 'Net 30',
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
      
      console.log('[DEBUG] Saving invoices to storage...');
      try {
        await setInvoices(updatedInvoices);
        console.log(`[DEBUG] Invoice created successfully. Total invoices: ${updatedInvoices.length}`);
        console.log(`[DEBUG] New invoice:`, JSON.stringify(newInvoice, null, 2));
        
        return res.status(201).json(newInvoice);
      } catch (saveError) {
        console.error('[DEBUG] Failed to save invoice to storage:', saveError);
        return res.status(500).json({
          error: 'Failed to save invoice',
          details: saveError.message,
          invoice: newInvoice // Return the invoice data even if save failed
        });
      }
      
    } catch (error) {
      console.error('[ERROR] Failed to create invoice:', error);
      console.error('[ERROR] Stack trace:', error.stack);
      return res.status(500).json({ 
        error: 'Failed to create invoice', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



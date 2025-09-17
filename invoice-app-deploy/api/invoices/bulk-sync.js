import { getInvoices, setInvoices } from '../_data/invoices.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('[BULK-SYNC] Received bulk sync request');
      const { invoices: clientInvoices } = req.body || {};
      
      if (!Array.isArray(clientInvoices)) {
        return res.status(400).json({ error: 'Invalid invoices data' });
      }
      
      console.log(`[BULK-SYNC] Client has ${clientInvoices.length} invoices`);
      
      // Get current server invoices
      const serverInvoices = await getInvoices();
      console.log(`[BULK-SYNC] Server has ${serverInvoices.length} invoices`);
      
      // Merge: prioritize client invoices for any conflicts, keep server defaults
      const mergedInvoices = [...serverInvoices];
      
      for (const clientInvoice of clientInvoices) {
        const existingIndex = mergedInvoices.findIndex(inv => inv.id === clientInvoice.id);
        if (existingIndex >= 0) {
          // Update existing
          mergedInvoices[existingIndex] = {
            ...clientInvoice,
            updatedAt: new Date().toISOString()
          };
        } else {
          // Add new
          mergedInvoices.push({
            ...clientInvoice,
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // Save merged invoices
      await setInvoices(mergedInvoices);
      console.log(`[BULK-SYNC] Merged and saved ${mergedInvoices.length} invoices`);
      
      return res.status(200).json({
        success: true,
        message: `Synced ${mergedInvoices.length} invoices`,
        count: mergedInvoices.length
      });
      
    } catch (error) {
      console.error('[BULK-SYNC] Error:', error);
      return res.status(500).json({
        error: 'Bulk sync failed',
        details: error.message
      });
    }
  }
  
  if (req.method === 'GET') {
    // Return current server state for client to sync
    try {
      const invoices = await getInvoices();
      return res.status(200).json({
        invoices: invoices,
        count: invoices.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[BULK-SYNC] Error getting invoices:', error);
      return res.status(500).json({
        error: 'Failed to get invoices',
        details: error.message
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
import { getInvoices, setInvoices } from './_data/invoices.js';

export default async function handler(req, res) {
  try {
    console.log('[TEST] Starting storage test...');
    
    // Test 1: Read invoices
    const invoices = await getInvoices();
    console.log(`[TEST] Loaded ${invoices.length} invoices`);
    
    // Test 2: Create test invoice
    const testInvoice = {
      id: 'inv_test_' + Date.now(),
      number: '9999',
      client: { name: 'Test Client', email: 'test@example.com', company: 'Test Corp' },
      items: [{ description: 'Test Item', qty: 1, unitPrice: 100, taxPercent: 20 }],
      totals: { subtotal: 100, tax: 20, total: 120 },
      status: 'Draft',
      currency: 'GBP',
      notes: 'Test invoice',
      terms: 'Net 30',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Test 3: Save with test invoice
    const newInvoices = [...invoices, testInvoice];
    await setInvoices(newInvoices);
    console.log(`[TEST] Saved ${newInvoices.length} invoices`);
    
    // Test 4: Read back to verify
    const verifyInvoices = await getInvoices();
    const found = verifyInvoices.find(inv => inv.id === testInvoice.id);
    
    // Test 5: Clean up
    const cleanedInvoices = verifyInvoices.filter(inv => inv.id !== testInvoice.id);
    await setInvoices(cleanedInvoices);
    
    return res.status(200).json({
      success: true,
      message: 'Storage test completed successfully',
      results: {
        initialCount: invoices.length,
        afterSave: newInvoices.length,
        afterVerify: verifyInvoices.length,
        testInvoiceFound: !!found,
        finalCount: cleanedInvoices.length
      },
      testInvoice: found ? {
        id: found.id,
        client: found.client.name,
        total: found.totals.total
      } : null
    });
    
  } catch (error) {
    console.error('[TEST] Storage test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
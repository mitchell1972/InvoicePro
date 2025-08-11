import { getInvoices, setInvoices } from './_data/invoices.js';

export default async function handler(req, res) {
  try {
    console.log('[TEST-BLOB] Testing storage configuration...');
    
    // Check environment
    const config = {
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      storageType: 'unknown'
    };
    
    if (config.hasBlobToken && config.isVercel) {
      config.storageType = 'vercel-blob';
    } else if (config.isVercel) {
      config.storageType = 'in-memory (temporary)';
    } else {
      config.storageType = 'file-system';
    }
    
    // Test read operation
    console.log('[TEST-BLOB] Testing read operation...');
    const invoices = await getInvoices();
    
    // Test write operation
    console.log('[TEST-BLOB] Testing write operation...');
    const testInvoice = {
      id: 'test_blob_' + Date.now(),
      number: '9999',
      client: {
        name: 'Test Client',
        email: 'test@blob.com',
        company: 'Blob Test Inc'
      },
      items: [
        { description: 'Test Service', qty: 1, unitPrice: 100, taxPercent: 20 }
      ],
      currency: 'GBP',
      notes: 'This is a test invoice for blob storage',
      terms: 'Net 30',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totals: { subtotal: 100, tax: 20, total: 120 },
      status: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add test invoice
    const updatedInvoices = [...invoices, testInvoice];
    await setInvoices(updatedInvoices);
    
    // Verify it was saved
    const verifyInvoices = await getInvoices();
    const found = verifyInvoices.find(inv => inv.id === testInvoice.id);
    
    // Clean up test invoice
    if (found) {
      const cleaned = verifyInvoices.filter(inv => inv.id !== testInvoice.id);
      await setInvoices(cleaned);
    }
    
    return res.status(200).json({
      success: true,
      environment: config,
      storageTest: {
        totalInvoices: invoices.length,
        writeTest: found ? 'PASSED' : 'FAILED',
        readTest: invoices.length > 0 ? 'PASSED' : 'WARNING: No invoices found'
      },
      message: config.storageType === 'vercel-blob' 
        ? '✅ Blob storage is configured and working!' 
        : config.isVercel 
          ? '⚠️ Running on Vercel without Blob storage. Data will be lost on cold starts. See /BLOB_STORAGE_SETUP.md'
          : '✅ Local file storage is working!',
      setupInstructions: config.isVercel && !config.hasBlobToken 
        ? 'To enable persistent storage on Vercel: 1) Go to Vercel Dashboard, 2) Select Storage tab, 3) Create a Blob store'
        : null
    });
    
  } catch (error) {
    console.error('[TEST-BLOB] Storage test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

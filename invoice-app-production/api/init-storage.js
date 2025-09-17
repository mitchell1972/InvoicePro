import { getInvoices, setInvoices } from './_data/invoices.js';
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const isVercel = !!process.env.VERCEL;
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    
    // Load current invoices (will get defaults if empty)
    const invoices = await getInvoices();
    
    if (isVercel && hasBlobToken) {
      // Force save to Blob storage
      const blob = await put('invoices-data.json', JSON.stringify(invoices), {
        access: 'public',
        contentType: 'application/json'
      });
      
      return res.status(200).json({
        success: true,
        environment: 'vercel-with-blob',
        message: 'Blob storage initialized with invoice data',
        invoiceCount: invoices.length,
        invoiceIds: invoices.map(inv => inv.id),
        blobUrl: blob.url
      });
    } else if (isVercel) {
      return res.status(200).json({
        success: false,
        environment: 'vercel-no-blob',
        message: 'Running on Vercel but Blob storage not configured',
        invoiceCount: invoices.length,
        invoiceIds: invoices.map(inv => inv.id),
        warning: 'Data is temporary and will be lost on cold starts'
      });
    } else {
      // Local development
      await setInvoices(invoices);
      
      return res.status(200).json({
        success: true,
        environment: 'local',
        message: 'Local file storage initialized',
        invoiceCount: invoices.length,
        invoiceIds: invoices.map(inv => inv.id)
      });
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

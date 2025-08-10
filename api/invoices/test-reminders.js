import { getInvoices, setInvoices } from '../_data/invoices.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const invoices = getInvoices();
    
    // Add an overdue invoice for testing
    const testInvoice = {
      id: 'inv_test_overdue',
      number: 'TEST001',
      client: {
        name: 'Test Client',
        email: 'test@example.com',
        company: 'Test Company'
      },
      items: [
        { description: 'Test Service', qty: 1, unitPrice: 1000, taxPercent: 20 }
      ],
      currency: 'GBP',
      notes: 'Test overdue invoice',
      terms: 'Net 30',
      issueDate: '2025-01-01',
      dueDate: '2025-01-31', // This is overdue
      totals: { subtotal: 1000, tax: 200, total: 1200 },
      status: 'Sent',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z',
      reminders: [] // No reminders sent yet
    };

    // Check if test invoice already exists
    const existingTestIndex = invoices.findIndex(inv => inv.id === testInvoice.id);
    
    if (existingTestIndex >= 0) {
      // Update existing test invoice
      invoices[existingTestIndex] = testInvoice;
    } else {
      // Add new test invoice
      invoices.push(testInvoice);
    }

    setInvoices(invoices);

    // Now test the reminder logic
    const reminderResponse = await fetch(`${req.headers.host}/api/invoices/remind-overdue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret-key'}`,
        'Content-Type': 'application/json'
      }
    });

    const reminderResult = await reminderResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Test overdue invoice created and reminder system tested',
      testInvoice: testInvoice,
      reminderResult: reminderResult
    });

  } catch (error) {
    console.error('Error testing reminders:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
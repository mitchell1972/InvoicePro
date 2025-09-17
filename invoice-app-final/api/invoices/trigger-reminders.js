import { getInvoices, setInvoices } from '../_data/invoices.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple authentication check for manual triggers
  const { adminKey } = req.body;
  
  if (adminKey !== 'admin123') {
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  try {
    const invoices = getInvoices();
    const now = new Date();
    const reminders = [];

    const updatedInvoices = invoices.map(invoice => {
      // Only process sent invoices that are overdue
      if (invoice.status !== 'Sent') {
        return invoice;
      }

      const dueDate = new Date(invoice.dueDate);
      const daysSinceOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

      // Skip if not overdue
      if (daysSinceOverdue <= 0) {
        return invoice;
      }

      // Initialize reminders if not present
      if (!invoice.reminders) {
        invoice.reminders = [];
      }

      let shouldSendReminder = false;
      let reminderType = '';

      // Determine which reminder to send based on days overdue
      if (daysSinceOverdue >= 1 && invoice.reminders.length === 0) {
        shouldSendReminder = true;
        reminderType = 'first';
      } else if (daysSinceOverdue >= 7 && invoice.reminders.length === 1) {
        shouldSendReminder = true;
        reminderType = 'second';
      } else if (daysSinceOverdue >= 15 && invoice.reminders.length === 2) {
        shouldSendReminder = true;
        reminderType = 'third';
      } else if (daysSinceOverdue >= 30 && invoice.reminders.length === 3) {
        shouldSendReminder = true;
        reminderType = 'final';
      }

      // Send reminder if needed
      if (shouldSendReminder) {
        const reminder = {
          type: reminderType,
          sentAt: now.toISOString(),
          daysPastDue: daysSinceOverdue
        };

        invoice.reminders.push(reminder);
        invoice.updatedAt = now.toISOString();

        reminders.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          clientEmail: invoice.client.email,
          clientName: invoice.client.name,
          type: reminderType,
          daysPastDue: daysSinceOverdue,
          amount: invoice.totals.total,
          currency: invoice.currency
        });

        console.log(`[MANUAL REMINDER] Sending ${reminderType} reminder for invoice ${invoice.id} to ${invoice.client.email} (${daysSinceOverdue} days overdue)`);
      }

      return invoice;
    });

    // Save updated invoices
    setInvoices(updatedInvoices);

    return res.status(200).json({
      success: true,
      message: `Manually triggered reminder check - processed ${invoices.length} invoices`,
      remindersSent: reminders.length,
      reminders: reminders,
      processedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Error manually triggering reminders:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
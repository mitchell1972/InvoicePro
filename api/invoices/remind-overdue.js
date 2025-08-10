import { getInvoices, setInvoices } from '../_data/invoices.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check - in production, use proper authentication
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET || 'dev-secret-key';
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
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

      const lastReminder = invoice.reminders.length > 0 
        ? new Date(invoice.reminders[invoice.reminders.length - 1].sentAt)
        : null;

      let shouldSendReminder = false;
      let reminderType = '';

      // Reminder schedule:
      // 1st reminder: 1 day after due date
      // 2nd reminder: 7 days after due date  
      // 3rd reminder: 15 days after due date
      // Final reminder: 30 days after due date
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

        // Log the reminder (in production, send actual email)
        console.log(`[REMINDER] Sending ${reminderType} reminder for invoice ${invoice.id} to ${invoice.client.email} (${daysSinceOverdue} days overdue)`);

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

        // Simulate email sending
        sendReminderEmail(invoice, reminder);
      }

      return invoice;
    });

    // Save updated invoices
    setInvoices(updatedInvoices);

    return res.status(200).json({
      success: true,
      message: `Processed ${invoices.length} invoices`,
      remindersSent: reminders.length,
      reminders: reminders,
      processedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Error processing overdue reminders:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

function sendReminderEmail(invoice, reminder) {
  const messages = {
    first: `Your invoice #${invoice.number} is now overdue. Please submit payment at your earliest convenience.`,
    second: `Second reminder: Invoice #${invoice.number} is ${reminder.daysPastDue} days overdue. Please contact us if you need assistance.`,
    third: `Third reminder: Invoice #${invoice.number} is ${reminder.daysPastDue} days overdue. Immediate payment is required.`,
    final: `Final notice: Invoice #${invoice.number} is ${reminder.daysPastDue} days overdue. Further action may be taken if payment is not received.`
  };

  // Simulate email sending (replace with actual email service)
  setTimeout(() => {
    console.log(`[EMAIL] ${reminder.type.toUpperCase()} REMINDER sent to ${invoice.client.email}`);
    console.log(`Subject: ${reminder.type === 'final' ? 'Final Notice' : 'Payment Reminder'} - Invoice #${invoice.number}`);
    console.log(`Message: ${messages[reminder.type]}`);
    console.log(`Payment Link: ${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoice.id}`);
  }, 100);
}
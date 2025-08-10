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

        // Simulate email sending (in production, get banking details from user settings)
        const bankingDetails = req.body.bankingDetails || null;
        sendReminderEmail(invoice, reminder, bankingDetails);
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

function sendReminderEmail(invoice, reminder, bankingDetails) {
  const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoice.id}`;
  
  const urgencyLevels = {
    first: 'Payment Reminder',
    second: 'Second Payment Reminder',
    third: 'Urgent Payment Required',
    final: 'Final Notice - Immediate Action Required'
  };

  const messages = {
    first: `Your invoice is now overdue. Please submit payment at your earliest convenience.`,
    second: `This is a second reminder that your invoice is ${reminder.daysPastDue} days overdue. Please contact us if you need assistance.`,
    third: `This is an urgent reminder that your invoice is ${reminder.daysPastDue} days overdue. Immediate payment is required.`,
    final: `This is a final notice that your invoice is ${reminder.daysPastDue} days overdue. Further action may be taken if payment is not received immediately.`
  };

  // Generate banking details section
  let bankingSection = '';
  if (bankingDetails && bankingDetails.country) {
    if (bankingDetails.country === 'GB' && bankingDetails.uk) {
      const uk = bankingDetails.uk;
      if (uk.bankName && uk.accountName && uk.sortCode && uk.accountNumber) {
        bankingSection = `
BANK TRANSFER DETAILS (UK):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${uk.bankName}
Account Name: ${uk.accountName}
Sort Code: ${uk.sortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3')}
Account Number: ${uk.accountNumber}

Please use invoice #${invoice.number} as the payment reference.
`;
      }
    } else if (bankingDetails.country === 'US' && bankingDetails.us) {
      const us = bankingDetails.us;
      if (us.bankName && us.accountName && us.routingNumber && us.accountNumber) {
        bankingSection = `
BANK TRANSFER DETAILS (US):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${us.bankName}
Account Name: ${us.accountName}
Routing Number (ABA): ${us.routingNumber}
Account Number: ${us.accountNumber}

Please use invoice #${invoice.number} as the payment reference.
`;
      }
    }
  }

  const emailContent = `
Subject: ${urgencyLevels[reminder.type]} - Invoice #${invoice.number} (${reminder.daysPastDue} days overdue)

Dear ${invoice.client.name},

${messages[reminder.type]}

OVERDUE INVOICE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: #${invoice.number}
Original Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Days Overdue: ${reminder.daysPastDue} days
Amount Due: ${invoice.totals.total.toLocaleString('en-GB', { style: 'currency', currency: invoice.currency || 'GBP' })}

PAYMENT OPTIONS:
━━━━━━━━━━━━━━━━━
💳 Online Payment: ${paymentLink}
${bankingSection}
${reminder.type === 'final' ? `
⚠️  URGENT: If payment is not received within 48 hours, this matter may be referred for further action.
` : ''}
If you have already made payment, please disregard this reminder. If you have any questions or need to arrange a payment plan, please contact us immediately.

Best regards,
Your Invoice Team
`;

  // Simulate email sending (replace with actual email service)
  setTimeout(() => {
    console.log(`[EMAIL] ${reminder.type.toUpperCase()} REMINDER sent to ${invoice.client.email}`);
    console.log(`[EMAIL] Subject: ${urgencyLevels[reminder.type]} - Invoice #${invoice.number}`);
    console.log(`[EMAIL] Content:`, emailContent.trim());
  }, 100);
}
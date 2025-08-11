import { getInvoices, setInvoices } from '../_data/invoices.js';
import resend from '../lib/resend-client.js';

export default async function handler(req, res) {
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
    const invoices = await getInvoices();
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

        // Send actual email using Resend
        const bankingDetails = req.body.bankingDetails || null;
        await sendReminderEmail(invoice, reminder, bankingDetails);
      }

      return invoice;
    });

    // Save updated invoices
    await setInvoices(updatedInvoices);

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

async function sendReminderEmail(invoice, reminder, bankingDetails) {
  const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoice.id}`;
  const fromEmail = process.env.FROM_EMAIL || 'invoices@yourdomain.com';
  const companyName = process.env.COMPANY_NAME || 'Your Company';
  
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

  const emailSubject = `${urgencyLevels[reminder.type]} - Invoice #${invoice.number} (${reminder.daysPastDue} days overdue)`;
  
  const emailContent = `Dear ${invoice.client.name},

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
${companyName}`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${companyName} <${fromEmail}>`,
      to: [invoice.client.email],
      subject: emailSubject,
      html: formatEmailAsHtml(emailContent),
      text: emailContent
    });

    if (error) {
      console.error(`[EMAIL] Failed to send ${reminder.type} reminder to ${invoice.client.email}:`, error);
      return false;
    }

    console.log(`[EMAIL] ${reminder.type.toUpperCase()} REMINDER sent to ${invoice.client.email} via Resend. ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Error sending ${reminder.type} reminder:`, error);
    return false;
  }
}

function formatEmailAsHtml(textContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .email-container {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .urgent-banner {
      background-color: #fff3cd;
      border-left: 4px solid #f39c12;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .final-notice-banner {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <pre style="font-family: inherit; white-space: pre-wrap; margin: 0;">${textContent}</pre>
  </div>
</body>
</html>`;
}
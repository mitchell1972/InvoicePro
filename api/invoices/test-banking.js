import { getInvoices } from '../_data/invoices.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId, bankingDetails, testType = 'invoice' } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID required' });
  }

  const invoices = getInvoices();
  const invoice = invoices.find(inv => inv.id === invoiceId);

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  let emailContent = '';

  if (testType === 'invoice') {
    // Test invoice email with banking details
    emailContent = generateInvoiceEmail(invoice, bankingDetails);
  } else if (testType === 'reminder') {
    // Test reminder email with banking details
    const mockReminder = {
      type: 'first',
      sentAt: new Date().toISOString(),
      daysPastDue: 3
    };
    emailContent = generateReminderEmail(invoice, mockReminder, bankingDetails);
  }

  return res.status(200).json({
    success: true,
    message: `Test ${testType} email generated`,
    invoice: {
      id: invoice.id,
      number: invoice.number,
      client: invoice.client
    },
    bankingDetails,
    emailContent
  });
}

function generateInvoiceEmail(invoice, bankingDetails) {
  const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoice.id}`;
  
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
Subject: Invoice #${invoice.number} - ${invoice.totals.total.toLocaleString('en-GB', { style: 'currency', currency: invoice.currency || 'GBP' })}

Dear ${invoice.client.name},

Thank you for your business! Please find your invoice details below:

INVOICE DETAILS:
━━━━━━━━━━━━━━━━
Invoice Number: #${invoice.number}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Amount Due: ${invoice.totals.total.toLocaleString('en-GB', { style: 'currency', currency: invoice.currency || 'GBP' })}

PAYMENT OPTIONS:
━━━━━━━━━━━━━━━━━
💳 Online Payment: ${paymentLink}
${bankingSection}
NOTES:
${invoice.notes || 'Thank you for your business!'}

Payment Terms: ${invoice.terms || 'Net 30'}

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
Your Invoice Team
`;

  return emailContent.trim();
}

function generateReminderEmail(invoice, reminder, bankingDetails) {
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

  return emailContent.trim();
}
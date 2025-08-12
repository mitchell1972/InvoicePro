import { getInvoices } from '../_data/invoices.js';
import resend from '../lib/resend-client.js';

// Email service for handling all invoice-related emails
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, ...params } = req.body;

  try {
    switch (action) {
      case 'send_invoice':
        return await sendInvoiceEmail(req, res, params);
      
      case 'send_reminder':
        return await sendReminderEmail(req, res, params);
      
      case 'preview_invoice':
        return await previewInvoiceEmail(req, res, params);
      
      case 'preview_reminder':
        return await previewReminderEmail(req, res, params);
      
      case 'validate_email':
        return validateEmailAddress(req, res, params);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Email service error:', error);
    return res.status(500).json({ 
      error: 'Email service failed',
      details: error.message 
    });
  }
}

async function sendInvoiceEmail(req, res, params) {
  const { invoiceId, recipientEmail, bankingDetails, companyDetails } = params;

  if (!invoiceId || !recipientEmail) {
    return res.status(400).json({ 
      error: 'Invoice ID and recipient email are required' 
    });
  }

  const invoices = await getInvoices();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Create a temporary invoice object for email generation
  // This ensures the recipient's email is correctly displayed in the email body
  const emailInvoice = {
    ...invoice,
    client: {
      ...invoice.client,
      email: recipientEmail // Override with the actual recipient's email
    }
  };

  const emailContent = generateInvoiceEmailContent(emailInvoice, bankingDetails, companyDetails);
  const emailSubject = `Invoice #${invoice.number} - ${formatCurrency(invoice.totals.total)}`;
  const fromEmail = process.env.FROM_EMAIL || 'invoices@yourdomain.com';
  const companyName = companyDetails?.name || 'Your Company';
  
  try {
    const { data, error } = await resend.emails.send({
      from: `${companyName} <${fromEmail}>`,
      to: [recipientEmail],
      subject: emailSubject,
      html: formatEmailAsHtml(emailContent),
      text: emailContent
    });

    if (error) {
      console.error('[EMAIL SERVICE] Resend error:', error);
      return res.status(500).json({
        error: 'Failed to send email',
        details: typeof error === 'object' ? (error.message || JSON.stringify(error)) : error
      });
    }

    console.log(`[EMAIL SERVICE] Invoice ${invoiceId} sent successfully via Resend. ID: ${data.id}`);

    return res.status(200).json({
      success: true,
      message: `Invoice sent to ${recipientEmail}`,
      sentAt: new Date().toISOString(),
      emailSubject,
      emailId: data.id,
      paymentLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoiceId}`,
      emailPreview: emailContent.substring(0, 500) + '...'
    });
  } catch (error) {
    console.error('[EMAIL SERVICE] Failed to send email:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
}

async function sendReminderEmail(req, res, params) {
  const { invoiceId, recipientEmail, reminderType, daysPastDue, bankingDetails, companyDetails } = params;

  if (!invoiceId || !recipientEmail || !reminderType) {
    return res.status(400).json({ 
      error: 'Invoice ID, recipient email, and reminder type are required' 
    });
  }

  const invoices = await getInvoices();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const reminder = {
    type: reminderType,
    daysPastDue: daysPastDue || 0,
    sentAt: new Date().toISOString()
  };

  // Create a temporary invoice object for email generation
  const emailInvoice = {
    ...invoice,
    client: {
      ...invoice.client,
      email: recipientEmail
    }
  };

  const emailContent = generateReminderEmailContent(emailInvoice, reminder, bankingDetails, companyDetails);
  const urgencyLevels = {
    first: 'Payment Reminder',
    second: '2nd Payment Reminder',
    third: '🚨 URGENT Payment Required',
    final: '⚠️ FINAL NOTICE - Immediate Action Required'
  };
  const emailSubject = `${urgencyLevels[reminder.type]} - Invoice #${invoice.number} (${reminder.daysPastDue} days overdue)`;
  const fromEmail = process.env.FROM_EMAIL || 'invoices@yourdomain.com';
  const companyName = companyDetails?.name || 'Your Company';
  
  try {
    const { data, error } = await resend.emails.send({
      from: `${companyName} <${fromEmail}>`,
      to: [recipientEmail],
      subject: emailSubject,
      html: formatEmailAsHtml(emailContent),
      text: emailContent
    });

    if (error) {
      console.error('[EMAIL SERVICE] Resend reminder error:', error);
      return res.status(500).json({
        error: 'Failed to send reminder email',
        details: error.message
      });
    }

    console.log(`[EMAIL SERVICE] ${reminderType} reminder sent successfully via Resend. ID: ${data.id}`);

    return res.status(200).json({
      success: true,
      message: `${reminderType} reminder sent to ${recipientEmail}`,
      sentAt: new Date().toISOString(),
      reminderType,
      daysPastDue: reminder.daysPastDue,
      emailId: data.id
    });
  } catch (error) {
    console.error('[EMAIL SERVICE] Failed to send reminder email:', error);
    return res.status(500).json({
      error: 'Failed to send reminder email',
      details: error.message
    });
  }
}

async function previewInvoiceEmail(req, res, params) {
  const { invoiceId, bankingDetails, companyDetails } = params;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  const invoices = await getInvoices();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const emailContent = generateInvoiceEmailContent(invoice, bankingDetails, companyDetails);

  return res.status(200).json({
    success: true,
    invoice: {
      id: invoice.id,
      number: invoice.number,
      client: invoice.client
    },
    emailSubject: `Invoice #${invoice.number} - ${formatCurrency(invoice.totals.total)}`,
    emailContent,
    paymentLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoiceId}`
  });
}

async function previewReminderEmail(req, res, params) {
  const { invoiceId, reminderType, daysPastDue = 1, bankingDetails, companyDetails } = params;

  if (!invoiceId || !reminderType) {
    return res.status(400).json({ 
      error: 'Invoice ID and reminder type are required' 
    });
  }

  const invoices = await getInvoices();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const reminder = {
    type: reminderType,
    daysPastDue,
    sentAt: new Date().toISOString()
  };

  const emailContent = generateReminderEmailContent(invoice, reminder, bankingDetails, companyDetails);

  return res.status(200).json({
    success: true,
    invoice: {
      id: invoice.id,
      number: invoice.number,
      client: invoice.client
    },
    reminderType,
    daysPastDue,
    emailContent
  });
}

function validateEmailAddress(req, res, params) {
  const { email } = params;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  return res.status(200).json({
    success: true,
    email,
    isValid,
    message: isValid ? 'Email address is valid' : 'Email address is invalid'
  });
}

function generateInvoiceEmailContent(invoice, bankingDetails, companyDetails) {
  const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoice.id}`;
  const companyName = companyDetails?.name || 'Your Company';
  
  // Debug logging
  console.log('[EMAIL SERVICE] Banking details received:', JSON.stringify(bankingDetails, null, 2));
  
  let bankingSection = '';
  if (bankingDetails && bankingDetails.country) {
    if (bankingDetails.country === 'GB' && bankingDetails.uk && bankingDetails.uk.bankName && bankingDetails.uk.bankName.trim() !== '') {
      const uk = bankingDetails.uk;
      bankingSection = `
🏦 BANK TRANSFER (UK):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${uk.bankName}
Account Name: ${uk.accountName}
Sort Code: ${uk.sortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3')}
Account Number: ${uk.accountNumber}

Please use invoice #${invoice.number} as your payment reference.
`;
    } else if (bankingDetails.country === 'US' && bankingDetails.us && bankingDetails.us.bankName && bankingDetails.us.bankName.trim() !== '') {
      const us = bankingDetails.us;
      bankingSection = `
🏦 BANK TRANSFER (US):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${us.bankName}
Account Name: ${us.accountName}
Routing Number (ABA): ${us.routingNumber}
Account Number: ${us.accountNumber}

Please use invoice #${invoice.number} as your payment reference.
`;
    }
  }
  
  console.log('[EMAIL SERVICE] Banking section generated:', bankingSection ? 'YES' : 'NO');

  const itemsList = invoice.items.map(item => 
    `• ${item.description} - ${item.qty} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.qty * item.unitPrice * (1 + item.taxPercent / 100))}`
  ).join('\n');

  return `Subject: Invoice #${invoice.number} - ${formatCurrency(invoice.totals.total)} - ${companyName}

Dear ${invoice.client.name},

Thank you for your business! Please find your invoice details below:

📋 INVOICE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: #${invoice.number}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
From: ${companyName}
${companyDetails?.address ? `Address: ${companyDetails.address}, ${companyDetails.city || ''} ${companyDetails.postcode || ''}` : ''}

📦 ITEMS & SERVICES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${itemsList}

💰 SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ${formatCurrency(invoice.totals.subtotal)}
Tax: ${formatCurrency(invoice.totals.tax)}
────────────────────────────────────────────────────
TOTAL DUE: ${formatCurrency(invoice.totals.total)}

💳 PAYMENT OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Pay Online (Credit/Debit Card): ${paymentLink}
${bankingSection}
${invoice.notes ? `📝 NOTES:\n${invoice.notes}\n\n` : ''}⏰ Payment Terms: ${invoice.terms || 'Net 30'}

Questions about this invoice? Reply to this email or contact us directly.

Best regards,
${companyName}

---
This invoice was generated by your automated invoice system.`;
}

function generateReminderEmailContent(invoice, reminder, bankingDetails, companyDetails) {
  const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoice.id}`;
  const companyName = companyDetails?.name || 'Your Company';
  
  const urgencyLevels = {
    first: 'Payment Reminder',
    second: '2nd Payment Reminder',
    third: '🚨 URGENT Payment Required',
    final: '⚠️ FINAL NOTICE - Immediate Action Required'
  };

  const messages = {
    first: `Your invoice payment is now overdue. Please submit payment at your earliest convenience.`,
    second: `This is a second reminder that your invoice payment is ${reminder.daysPastDue} days overdue. Please contact us if you need assistance with payment arrangements.`,
    third: `This is an urgent reminder that your invoice payment is ${reminder.daysPastDue} days overdue. Immediate payment is required to avoid further action.`,
    final: `This is a FINAL NOTICE that your invoice payment is ${reminder.daysPastDue} days overdue. If payment is not received within 48 hours, this matter may be referred for collection action.`
  };

  let bankingSection = '';
  if (bankingDetails && bankingDetails.country) {
    if (bankingDetails.country === 'GB' && bankingDetails.uk && bankingDetails.uk.bankName && bankingDetails.uk.bankName.trim() !== '') {
      const uk = bankingDetails.uk;
      bankingSection = `
🏦 BANK TRANSFER (UK):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${uk.bankName}
Account Name: ${uk.accountName}
Sort Code: ${uk.sortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3')}
Account Number: ${uk.accountNumber}

Please use invoice #${invoice.number} as your payment reference.
`;
    } else if (bankingDetails.country === 'US' && bankingDetails.us && bankingDetails.us.bankName && bankingDetails.us.bankName.trim() !== '') {
      const us = bankingDetails.us;
      bankingSection = `
🏦 BANK TRANSFER (US):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${us.bankName}
Account Name: ${us.accountName}
Routing Number (ABA): ${us.routingNumber}
Account Number: ${us.accountNumber}

Please use invoice #${invoice.number} as your payment reference.
`;
    }
  }

  return `Subject: ${urgencyLevels[reminder.type]} - Invoice #${invoice.number} (${reminder.daysPastDue} days overdue) - ${companyName}

Dear ${invoice.client.name},

${messages[reminder.type]}

⏰ OVERDUE INVOICE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: #${invoice.number}
Original Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Days Overdue: ${reminder.daysPastDue} days
Amount Due: ${formatCurrency(invoice.totals.total)}

💳 PAYMENT OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Pay Online Now: ${paymentLink}
${bankingSection}
${reminder.type === 'final' ? `
⚠️  URGENT NOTICE: If payment is not received within 48 hours, this matter may be referred for collection action, which may affect your credit rating.
` : ''}
If you have already made payment, please disregard this reminder. If you need to arrange a payment plan or have any questions, please contact us immediately.

Thank you for your prompt attention to this matter.

Best regards,
${companyName}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount / 100);
}

function formatEmailAsHtml(textContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice</title>
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
    .header {
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #495057;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    .section-title::before {
      content: '';
      width: 20px;
      height: 2px;
      background-color: #007bff;
      margin-right: 10px;
    }
    .total-amount {
      font-size: 24px;
      font-weight: bold;
      color: #007bff;
      margin: 20px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-left: 4px solid #007bff;
    }
    .banking-details {
      background-color: #e8f5e8;
      border: 1px solid #c3e6c3;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .payment-link {
      background-color: #007bff;
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      color: #6c757d;
      font-size: 12px;
    }
    .urgent {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-left: 4px solid #f39c12;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .final-notice {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
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

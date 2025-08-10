import { getInvoices } from '../_data/invoices.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId, recipientEmail, bankingDetails } = req.body || {};

  if (!invoiceId || !recipientEmail) {
    return res
      .status(400)
      .json({ error: 'Invoice ID and recipient email are required' });
  }

  // Get invoice details
  const invoices = getInvoices();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Generate email content with banking details
  const emailContent = generateInvoiceEmail(invoice, bankingDetails);

  // Simulate email sending
  console.log(`[EMAIL] Sending invoice ${invoiceId} to ${recipientEmail}`);
  console.log(`[EMAIL] Email content:`, emailContent);

  setTimeout(() => {
    console.log(`[EMAIL] Invoice ${invoiceId} sent successfully`);
  }, 1000);

  return res.status(200).json({
    success: true,
    message: `Invoice sent to ${recipientEmail}`,
    sentAt: new Date().toISOString(),
    paymentLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoiceId}`,
    emailContent: emailContent // For testing purposes
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



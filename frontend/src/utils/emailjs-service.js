import emailjs from '@emailjs/browser';

// EmailJS Configuration
// You need to get these from https://www.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_invoice_app'; // Replace with your service ID
const EMAILJS_TEMPLATE_ID = 'template_invoice'; // Replace with your template ID  
const EMAILJS_PUBLIC_KEY = 'your_emailjs_public_key'; // Replace with your public key

// Initialize EmailJS
export const initEmailJS = () => {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('[EmailJS] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[EmailJS] Failed to initialize:', error);
    return false;
  }
};

// Send invoice email via EmailJS
export const sendInvoiceEmailJS = async (invoice, recipientEmail, companyDetails = {}, bankingDetails = null) => {
  try {
    console.log('[EmailJS] Preparing to send invoice email...');
    
    // Generate payment link
    const paymentLink = `${window.location.origin}/pay/${invoice.id}`;
    
    // Format invoice items
    const itemsList = invoice.items.map(item => 
      `${item.description} - ${item.qty} x £${(item.unitPrice/100).toFixed(2)} = £${(item.qty * item.unitPrice * (1 + item.taxPercent / 100)/100).toFixed(2)}`
    ).join('\n');

    // Format banking section
    let bankingSection = '';
    if (bankingDetails && bankingDetails.country) {
      if (bankingDetails.country === 'GB' && bankingDetails.uk && bankingDetails.uk.bankName) {
        const uk = bankingDetails.uk;
        bankingSection = `
BANK TRANSFER (UK):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${uk.bankName}
Account Name: ${uk.accountName}
Sort Code: ${uk.sortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3')}
Account Number: ${uk.accountNumber}

Please use invoice #${invoice.number} as your payment reference.
`;
      } else if (bankingDetails.country === 'US' && bankingDetails.us && bankingDetails.us.bankName) {
        const us = bankingDetails.us;
        bankingSection = `
BANK TRANSFER (US):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${us.bankName}
Account Name: ${us.accountName}
Routing Number (ABA): ${us.routingNumber}
Account Number: ${us.accountNumber}

Please use invoice #${invoice.number} as your payment reference.
`;
      }
    }

    // Template parameters for EmailJS
    const templateParams = {
      // Recipient info
      to_email: recipientEmail,
      to_name: invoice.client.name,
      
      // Invoice details
      invoice_number: invoice.number,
      invoice_total: `£${(invoice.totals.total/100).toFixed(2)}`,
      invoice_subtotal: `£${(invoice.totals.subtotal/100).toFixed(2)}`,
      invoice_tax: `£${(invoice.totals.tax/100).toFixed(2)}`,
      issue_date: new Date(invoice.issueDate).toLocaleDateString('en-GB'),
      due_date: new Date(invoice.dueDate).toLocaleDateString('en-GB'),
      payment_terms: invoice.terms,
      
      // Company details
      company_name: companyDetails?.name || 'Your Company',
      company_address: companyDetails?.address || '',
      company_city: companyDetails?.city || '',
      company_postcode: companyDetails?.postcode || '',
      
      // Invoice items
      items_list: itemsList,
      
      // Payment info
      payment_link: paymentLink,
      banking_details: bankingSection,
      
      // Notes
      notes: invoice.notes || '',
      
      // Email subject
      subject: `Invoice #${invoice.number} - £${(invoice.totals.total/100).toFixed(2)}`,
      
      // Full email content for fallback
      email_content: generateFullEmailContent(invoice, companyDetails, bankingDetails, paymentLink)
    };

    console.log('[EmailJS] Sending email with template params:', {
      to_email: templateParams.to_email,
      invoice_number: templateParams.invoice_number,
      invoice_total: templateParams.invoice_total
    });

    // Send email via EmailJS
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('[EmailJS] Email sent successfully:', result);

    return {
      success: true,
      message: `Invoice sent to ${recipientEmail} via EmailJS`,
      emailId: result.text, // EmailJS response ID
      sentAt: new Date().toISOString(),
      service: 'EmailJS'
    };

  } catch (error) {
    console.error('[EmailJS] Failed to send email:', error);
    throw new Error(`EmailJS send failed: ${error.message || error.text || 'Unknown error'}`);
  }
};

// Generate full email content for template
function generateFullEmailContent(invoice, companyDetails, bankingDetails, paymentLink) {
  const itemsList = invoice.items.map(item => 
    `• ${item.description} - ${item.qty} x £${(item.unitPrice/100).toFixed(2)} = £${(item.qty * item.unitPrice * (1 + item.taxPercent / 100)/100).toFixed(2)}`
  ).join('\n');

  let bankingSection = '';
  if (bankingDetails && bankingDetails.country) {
    if (bankingDetails.country === 'GB' && bankingDetails.uk && bankingDetails.uk.bankName) {
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
    }
  }

  return `Dear ${invoice.client.name},

Thank you for your business! Please find your invoice details below:

📋 INVOICE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: #${invoice.number}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('en-GB')}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}
From: ${companyDetails?.name || 'Your Company'}
${companyDetails?.address ? `Address: ${companyDetails.address}, ${companyDetails.city || ''} ${companyDetails.postcode || ''}` : ''}

📦 ITEMS & SERVICES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${itemsList}

💰 SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: £${(invoice.totals.subtotal/100).toFixed(2)}
Tax: £${(invoice.totals.tax/100).toFixed(2)}
────────────────────────────────────────────────────
TOTAL DUE: £${(invoice.totals.total/100).toFixed(2)}

💳 PAYMENT OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Pay Online (Credit/Debit Card): ${paymentLink}
${bankingSection}
${invoice.notes ? `📝 NOTES:\n${invoice.notes}\n\n` : ''}⏰ Payment Terms: ${invoice.terms || 'Net 30'}

Questions about this invoice? Reply to this email or contact us directly.

Best regards,
${companyDetails?.name || 'Your Company'}

---
This invoice was sent via EmailJS - Professional Invoice System`;
}

// Check if EmailJS is configured
export const isEmailJSConfigured = () => {
  return EMAILJS_PUBLIC_KEY !== 'your_emailjs_public_key' && 
         EMAILJS_SERVICE_ID !== 'service_invoice_app' &&
         EMAILJS_TEMPLATE_ID !== 'template_invoice';
};

// Preview email content
export const previewEmailJSContent = (invoice, companyDetails, bankingDetails) => {
  const paymentLink = `${window.location.origin}/pay/${invoice.id}`;
  return generateFullEmailContent(invoice, companyDetails, bankingDetails, paymentLink);
};
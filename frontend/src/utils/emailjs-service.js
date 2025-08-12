// EmailJS Service - Browser-based email sending (no server required!)

// ================================================
// CONFIGURATION - UPDATE THESE WITH YOUR VALUES
// ================================================
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_gh4oqg3',     // Your Gmail service
  TEMPLATE_ID: 'template_2yro5ul',   // Your invoice template  
  PUBLIC_KEY: '9olw9DixFqoBU12qo'    // Your public API key
};

// To get these values:
// 1. Sign up at https://www.emailjs.com (FREE)
// 2. Add email service (Gmail/Outlook/etc) in dashboard
// 3. Create email template 
// 4. Copy the IDs from your EmailJS dashboard

let emailjsInitialized = false;

/**
 * Check if EmailJS is configured
 */
export function isEmailJSConfigured() {
  // Check if the values have been updated from defaults
  return EMAILJS_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID' &&
         EMAILJS_CONFIG.TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
         EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
}

/**
 * Initialize EmailJS (call once on app load)
 */
export async function initEmailJS() {
  if (emailjsInitialized) return true;
  
  if (!isEmailJSConfigured()) {
    console.warn('[EmailJS] Not configured. Please update EMAILJS_CONFIG with your values.');
    return false;
  }
  
  try {
    const emailjs = (await import('@emailjs/browser')).default;
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    emailjsInitialized = true;
    console.log('[EmailJS] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[EmailJS] Failed to initialize:', error);
    return false;
  }
}

/**
 * Send invoice via EmailJS
 */
export async function sendInvoiceEmailJS(invoice, recipientEmail, companyDetails, bankingDetails) {
  if (!isEmailJSConfigured()) {
    throw new Error('EmailJS not configured. Please update the configuration values.');
  }
  
  if (!emailjsInitialized) {
    await initEmailJS();
  }
  
  try {
    const emailjs = (await import('@emailjs/browser')).default;
    
    // Format items for email
    const itemsHtml = invoice.items.map(item => {
      const lineTotal = item.qty * item.unitPrice;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">£${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">£${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
    
    const itemsText = invoice.items.map(item => {
      const lineTotal = item.qty * item.unitPrice;
      return `• ${item.description} - ${item.qty} x £${item.unitPrice.toFixed(2)} = £${lineTotal.toFixed(2)}`;
    }).join('\n');
    
    // Prepare banking details if provided
    const bankingHtml = bankingDetails ? `
      <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
        <strong>Payment Details:</strong><br>
        ${bankingDetails.bankName ? `Bank: ${bankingDetails.bankName}<br>` : ''}
        ${bankingDetails.accountName ? `Account Name: ${bankingDetails.accountName}<br>` : ''}
        ${bankingDetails.accountNumber ? `Account Number: ${bankingDetails.accountNumber}<br>` : ''}
        ${bankingDetails.sortCode ? `Sort Code: ${bankingDetails.sortCode}<br>` : ''}
      </div>
    ` : '';
    
    // Prepare template parameters
    const templateParams = {
      // Recipient
      to_email: recipientEmail,
      to_name: invoice.client.name,
      
      // Sender
      from_name: companyDetails?.name || 'Invoice System',
      from_email: 'noreply@invoice.app', // This will be replaced by your email service
      
      // Invoice details
      invoice_number: invoice.number,
      invoice_id: invoice.id,
      
      // Client info
      client_name: invoice.client.name,
      client_email: invoice.client.email,
      client_company: invoice.client.company || '',
      client_phone: invoice.client.phone || '',
      client_address: invoice.client.address || '',
      
      // Dates
      issue_date: new Date(invoice.issueDate).toLocaleDateString('en-GB'),
      due_date: new Date(invoice.dueDate).toLocaleDateString('en-GB'),
      
      // Financial
      currency: invoice.currency || 'GBP',
      subtotal: `£${invoice.totals.subtotal.toFixed(2)}`,
      tax: `£${invoice.totals.tax.toFixed(2)}`,
      total: `£${invoice.totals.total.toFixed(2)}`,
      
      // Items
      items_html: itemsHtml,
      items_text: itemsText,
      
      // Banking
      banking_html: bankingHtml,
      
      // Other
      notes: invoice.notes || '',
      terms: invoice.terms || 'Payment due within 30 days',
      payment_link: `${window.location.origin}/pay/${invoice.id}`,
      
      // Company details
      company_name: companyDetails?.name || 'Your Company',
      company_email: companyDetails?.email || '',
      company_phone: companyDetails?.phone || '',
      company_address: companyDetails?.address || '',
      
      // Full HTML content for template
      email_content_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Invoice #${invoice.number}</h1>
          </div>
          
          <div style="padding: 30px; background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div>
                <h3 style="color: #667eea;">Bill To:</h3>
                <p>${invoice.client.name}<br>
                ${invoice.client.company || ''}<br>
                ${invoice.client.email}</p>
              </div>
              <div style="text-align: right;">
                <p><strong>Invoice Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString('en-GB')}<br>
                <strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px; text-align: left;">Description</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px;">
              <p>Subtotal: £${invoice.totals.subtotal.toFixed(2)}<br>
              Tax: £${invoice.totals.tax.toFixed(2)}<br>
              <strong style="font-size: 1.2em; color: #667eea;">Total: £${invoice.totals.total.toFixed(2)}</strong></p>
            </div>
            
            ${bankingHtml}
            
            <a href="${window.location.origin}/pay/${invoice.id}" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Pay Online</a>
          </div>
        </div>
      `
    };
    
    console.log('[EmailJS] Sending email with params:', {
      service: EMAILJS_CONFIG.SERVICE_ID,
      template: EMAILJS_CONFIG.TEMPLATE_ID,
      to: recipientEmail
    });
    
    // Send email via EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );
    
    console.log('[EmailJS] Email sent successfully:', response);
    
    return {
      success: true,
      message: `Email sent to ${recipientEmail}`,
      emailId: response.text,
      service: 'EmailJS',
      sentAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('[EmailJS] Failed to send:', error);
    
    // Check if it's a configuration error
    if (error.text?.includes('service_id') || error.text?.includes('template_id') || error.text?.includes('public_key')) {
      throw new Error('EmailJS configuration error. Please check your Service ID, Template ID, and Public Key.');
    }
    
    throw new Error(`EmailJS error: ${error.text || error.message || 'Failed to send email'}`);
  }
}

/**
 * Send reminder email via EmailJS
 */
export async function sendReminderEmailJS(invoice, recipientEmail, reminderType = 'standard') {
  // Similar to sendInvoiceEmailJS but with reminder-specific content
  const reminderMessages = {
    friendly: `This is a friendly reminder that invoice #${invoice.number} is due soon.`,
    overdue: `Invoice #${invoice.number} is now overdue. Please arrange payment at your earliest convenience.`,
    final: `This is a final notice for invoice #${invoice.number}. Immediate payment is required.`
  };
  
  const message = reminderMessages[reminderType] || reminderMessages.friendly;
  
  // Reuse the send function with reminder context
  return sendInvoiceEmailJS(
    { ...invoice, notes: message },
    recipientEmail
  );
}
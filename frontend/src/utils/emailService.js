// Simple Email Service - Choose between EmailJS or API
// This provides a fallback email option that works directly from the browser

// Option 1: EmailJS Configuration (Browser-based)
const EMAILJS_CONFIG = {
  SERVICE_ID: 'YOUR_SERVICE_ID',  // Get from EmailJS dashboard
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID', // Get from EmailJS dashboard  
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY'    // Get from EmailJS dashboard
};

// Option 2: Use existing API (current implementation)
const useAPI = true; // Set to false to use EmailJS instead

/**
 * Initialize EmailJS (call this once when app loads)
 */
export async function initializeEmailService() {
  if (!useAPI && typeof window !== 'undefined') {
    try {
      const emailjs = await import('@emailjs/browser');
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      console.log('EmailJS initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      return false;
    }
  }
  return true;
}

/**
 * Send invoice email using either API or EmailJS
 */
export async function sendInvoiceEmail(invoice, recipientEmail) {
  // Option 1: Use existing API
  if (useAPI) {
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          recipientEmail: recipientEmail || invoice.client.email
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API email failed:', error);
      throw error;
    }
  }
  
  // Option 2: Use EmailJS (browser-based)
  try {
    const emailjs = await import('@emailjs/browser');
    
    // Prepare email parameters
    const templateParams = {
      to_email: recipientEmail || invoice.client.email,
      to_name: invoice.client.name,
      from_name: 'Invoice System',
      invoice_number: invoice.number,
      invoice_id: invoice.id,
      
      // Client details
      client_name: invoice.client.name,
      client_company: invoice.client.company || '',
      client_email: invoice.client.email,
      
      // Invoice details
      issue_date: new Date(invoice.issueDate).toLocaleDateString(),
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      
      // Financial details
      subtotal: `$${invoice.totals.subtotal.toFixed(2)}`,
      tax: `$${invoice.totals.tax.toFixed(2)}`,
      total_amount: `$${invoice.totals.total.toFixed(2)}`,
      
      // Items list as HTML
      items_html: invoice.items.map(item => 
        `<tr>
          <td>${item.description}</td>
          <td>${item.qty}</td>
          <td>$${item.unitPrice.toFixed(2)}</td>
          <td>$${(item.qty * item.unitPrice).toFixed(2)}</td>
        </tr>`
      ).join(''),
      
      // Items list as plain text
      items_text: invoice.items.map(item => 
        `• ${item.description} - ${item.qty} x $${item.unitPrice.toFixed(2)} = $${(item.qty * item.unitPrice).toFixed(2)}`
      ).join('\n'),
      
      // Payment link
      payment_link: `${window.location.origin}/pay/${invoice.id}`,
      
      // Notes and terms
      notes: invoice.notes || 'Thank you for your business!',
      terms: invoice.terms || 'Payment due within 30 days'
    };
    
    // Send email via EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );
    
    console.log('EmailJS sent successfully:', response);
    
    return {
      success: true,
      message: `Email sent to ${templateParams.to_email}`,
      emailId: response.text,
      service: 'EmailJS'
    };
    
  } catch (error) {
    console.error('EmailJS failed:', error);
    throw new Error(`EmailJS error: ${error.text || error.message || 'Unknown error'}`);
  }
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured() {
  if (useAPI) {
    // Assume API is configured if we're using it
    return true;
  } else {
    // Check if EmailJS credentials are set
    return EMAILJS_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID' &&
           EMAILJS_CONFIG.TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
           EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
  }
}

/**
 * Get email service status
 */
export function getEmailServiceStatus() {
  if (useAPI) {
    return {
      service: 'API (Resend)',
      configured: true,
      message: 'Using server-side email via Resend'
    };
  } else if (isEmailServiceConfigured()) {
    return {
      service: 'EmailJS',
      configured: true,
      message: 'Using browser-based email via EmailJS'
    };
  } else {
    return {
      service: 'None',
      configured: false,
      message: 'Email service not configured. Please set up EmailJS or enable API.'
    };
  }
}

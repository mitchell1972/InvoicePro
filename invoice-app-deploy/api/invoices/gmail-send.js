import nodemailer from 'nodemailer';
import { getInvoices, setInvoices } from '../_data/invoices.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId, recipientEmail } = req.body;

  if (!invoiceId || !recipientEmail) {
    return res.status(400).json({ 
      error: 'Invoice ID and recipient email are required' 
    });
  }

  // Check if Gmail is configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[Gmail] Not configured. Environment variables missing.');
    return res.status(500).json({ 
      error: 'Gmail not configured',
      details: 'Please add GMAIL_USER and GMAIL_APP_PASSWORD to Vercel environment variables.',
      setup: 'See GMAIL_SMTP_SETUP.md for instructions'
    });
  }

  try {
    // Get invoice data
    const invoices = await getInvoices(true); // Force refresh
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (!invoice) {
      console.log(`[Gmail] Invoice ${invoiceId} not found`);
      return res.status(404).json({ 
        error: 'Invoice not found',
        invoiceId,
        availableIds: invoices.map(inv => inv.id)
      });
    }

    console.log(`[Gmail] Preparing to send invoice ${invoiceId} to ${recipientEmail}`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Verify transporter
    await transporter.verify();
    console.log('[Gmail] Transporter verified successfully');

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333; 
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .invoice-header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px; 
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .invoice-header h1 {
            margin: 0;
            font-size: 28px;
          }
          .invoice-number {
            font-size: 20px;
            margin-top: 10px;
            opacity: 0.95;
          }
          .invoice-body {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 0 0 10px 10px;
          }
          .invoice-details { 
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
          }
          .detail-section {
            flex: 1;
          }
          .detail-section h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0; 
          }
          .items-table th, .items-table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #e0e0e0;
          }
          .items-table th { 
            background: #f8f9fa;
            font-weight: 600;
            color: #667eea;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table td {
            color: #555;
          }
          .total-section { 
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .total-row.final {
            font-size: 1.3em;
            font-weight: bold;
            color: #667eea;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
          }
          .payment-button { 
            display: inline-block; 
            padding: 15px 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 50px; 
            margin: 30px 0;
            font-weight: 600;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 14px;
          }
          .notes-section {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>💼 Invoice</h1>
          <div class="invoice-number">#${invoice.number}</div>
        </div>

        <div class="invoice-body">
          <div class="invoice-details">
            <div class="detail-section">
              <h3>Bill To</h3>
              <p style="margin: 0;">
                <strong>${invoice.client.name}</strong><br>
                ${invoice.client.company ? `${invoice.client.company}<br>` : ''}
                ${invoice.client.email}<br>
                ${invoice.client.phone || ''}
              </p>
            </div>
            <div class="detail-section" style="text-align: right;">
              <h3>Invoice Details</h3>
              <p style="margin: 0;">
                <strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString('en-GB')}<br>
                <strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}<br>
                <strong>Status:</strong> <span style="color: #28a745;">Sent</span>
              </p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Tax</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => {
                const lineTotal = item.qty * item.unitPrice;
                const tax = (lineTotal * (item.taxPercent || 0)) / 100;
                return `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.qty}</td>
                    <td style="text-align: right;">£${item.unitPrice.toFixed(2)}</td>
                    <td style="text-align: right;">${item.taxPercent || 0}%</td>
                    <td style="text-align: right;">£${lineTotal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>£${invoice.totals.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span>£${invoice.totals.tax.toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>Total Due:</span>
              <span>£${invoice.totals.total.toFixed(2)}</span>
            </div>
          </div>

          ${invoice.notes ? `
            <div class="notes-section">
              <strong>Notes:</strong><br>
              ${invoice.notes}
            </div>
          ` : ''}

          ${invoice.terms ? `
            <p><strong>Payment Terms:</strong> ${invoice.terms}</p>
          ` : ''}

          <a href="https://app.invoic.org/pay/${invoice.id}" class="payment-button">
            💳 Pay Invoice Online
          </a>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p style="font-size: 12px; color: #bbb;">
              This invoice was sent from Invoice App<br>
              Questions? Reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create plain text version
    const emailText = `
INVOICE #${invoice.number}
════════════════════════════════════════

BILL TO:
${invoice.client.name}
${invoice.client.company || ''}
${invoice.client.email}
${invoice.client.phone || ''}

INVOICE DETAILS:
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('en-GB')}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}

ITEMS:
────────────────────────────────────────
${invoice.items.map(item => {
  const lineTotal = item.qty * item.unitPrice;
  return `• ${item.description}
  Qty: ${item.qty} × £${item.unitPrice.toFixed(2)} = £${lineTotal.toFixed(2)}
  Tax: ${item.taxPercent || 0}%`;
}).join('\n\n')}

────────────────────────────────────────
Subtotal: £${invoice.totals.subtotal.toFixed(2)}
Tax: £${invoice.totals.tax.toFixed(2)}
────────────────────────────────────────
TOTAL DUE: £${invoice.totals.total.toFixed(2)}
════════════════════════════════════════

${invoice.notes ? `Notes: ${invoice.notes}\n` : ''}
${invoice.terms ? `Payment Terms: ${invoice.terms}\n` : ''}

Pay online: https://app.invoic.org/pay/${invoice.id}

Thank you for your business!
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Invoice System" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      replyTo: process.env.GMAIL_USER,
      subject: `Invoice #${invoice.number} - £${invoice.totals.total.toFixed(2)} - ${invoice.client.company || invoice.client.name}`,
      text: emailText,
      html: emailHtml
    });

    console.log(`[Gmail] Email sent successfully. Message ID: ${info.messageId}`);

    // Update invoice status to 'Sent'
    const updatedInvoices = invoices.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, status: 'Sent', sentAt: new Date().toISOString() }
        : inv
    );
    
    try {
      await setInvoices(updatedInvoices);
      console.log(`[Gmail] Invoice ${invoiceId} status updated to Sent`);
    } catch (saveError) {
      console.error('[Gmail] Failed to update invoice status:', saveError);
      // Continue anyway - email was sent successfully
    }

    return res.status(200).json({
      success: true,
      message: `Invoice sent to ${recipientEmail}`,
      messageId: info.messageId,
      service: 'Gmail SMTP',
      sentAt: new Date().toISOString(),
      emailSubject: `Invoice #${invoice.number} - £${invoice.totals.total.toFixed(2)}`,
      paymentLink: `https://app.invoic.org/pay/${invoice.id}`
    });

  } catch (error) {
    console.error('[Gmail] Send error:', error);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        error: 'Gmail authentication failed',
        details: 'Invalid Gmail credentials. Please check GMAIL_USER and GMAIL_APP_PASSWORD.',
        help: 'Make sure you are using an App Password, not your regular Gmail password. See GMAIL_SMTP_SETUP.md'
      });
    }
    
    if (error.code === 'ECONNECTION') {
      return res.status(500).json({
        error: 'Could not connect to Gmail',
        details: 'Network error or Gmail service is unavailable',
        help: 'Please try again in a few moments'
      });
    }
    
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
      code: error.code
    });
  }
}

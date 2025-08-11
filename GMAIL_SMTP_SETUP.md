# Gmail SMTP Setup (Free Alternative to Resend)

## Why Gmail SMTP?
- **Completely FREE** - No limits on emails
- **Reliable** - Uses Google's infrastructure
- **Simple** - Works with Nodemailer
- **No domain verification** - Uses your Gmail account

## Setup Steps (5 minutes)

### 1. Enable 2-Step Verification in Gmail
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled

### 2. Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Invoice App" as the name
4. Click "Generate"
5. **Copy the 16-character password** (spaces don't matter)

### 3. Add to Vercel Environment Variables
Add these to your Vercel dashboard:
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-password
```

### 4. Create Gmail Email Service
Create `api/invoices/gmail-send.js`:

```javascript
import nodemailer from 'nodemailer';
import { getInvoices } from '../_data/invoices.js';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

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
    return res.status(500).json({ 
      error: 'Gmail not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to environment variables.' 
    });
  }

  // Get invoice data
  const invoices = await getInvoices();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Create email HTML
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .invoice-header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .invoice-details { margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        .items-table th { background: #f4f4f4; }
        .total-section { text-align: right; margin-top: 20px; font-size: 1.2em; }
        .payment-button { 
          display: inline-block; 
          padding: 12px 30px; 
          background: #007bff; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h2>Invoice #${invoice.number}</h2>
        <p>Date: ${new Date(invoice.issueDate).toLocaleDateString()}</p>
        <p>Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      </div>

      <div class="invoice-details">
        <h3>Bill To:</h3>
        <p>
          <strong>${invoice.client.name}</strong><br>
          ${invoice.client.company || ''}<br>
          ${invoice.client.email}
        </p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.qty}</td>
              <td>£${item.unitPrice.toFixed(2)}</td>
              <td>£${(item.qty * item.unitPrice).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <p>Subtotal: £${invoice.totals.subtotal.toFixed(2)}</p>
        <p>Tax: £${invoice.totals.tax.toFixed(2)}</p>
        <p><strong>Total: £${invoice.totals.total.toFixed(2)}</strong></p>
      </div>

      ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
      ${invoice.terms ? `<p><strong>Terms:</strong> ${invoice.terms}</p>` : ''}

      <a href="https://app.invoic.org/pay/${invoice.id}" class="payment-button">
        Pay Invoice Online
      </a>

      <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
        Thank you for your business!
      </p>
    </body>
    </html>
  `;

  // Create plain text version
  const emailText = `
Invoice #${invoice.number}

Bill To: ${invoice.client.name}
${invoice.client.company || ''}
${invoice.client.email}

Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

Items:
${invoice.items.map(item => 
  `• ${item.description} - ${item.qty} x £${item.unitPrice.toFixed(2)} = £${(item.qty * item.unitPrice).toFixed(2)}`
).join('\n')}

Subtotal: £${invoice.totals.subtotal.toFixed(2)}
Tax: £${invoice.totals.tax.toFixed(2)}
Total: £${invoice.totals.total.toFixed(2)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}
${invoice.terms ? `Terms: ${invoice.terms}` : ''}

Pay online: https://app.invoic.org/pay/${invoice.id}

Thank you for your business!
  `;

  try {
    // Send email
    const info = await transporter.sendMail({
      from: `"Invoice System" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: `Invoice #${invoice.number} - £${invoice.totals.total.toFixed(2)}`,
      text: emailText,
      html: emailHtml
    });

    console.log('Email sent:', info.messageId);

    // Update invoice status
    invoice.status = 'Sent';
    const invoices = await getInvoices();
    const index = invoices.findIndex(inv => inv.id === invoiceId);
    invoices[index] = invoice;
    await setInvoices(invoices);

    return res.status(200).json({
      success: true,
      message: `Invoice sent to ${recipientEmail}`,
      messageId: info.messageId,
      service: 'Gmail SMTP'
    });

  } catch (error) {
    console.error('Gmail send error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
}
```

### 5. Install Nodemailer
```bash
npm install nodemailer
```

### 6. Update Frontend to Use Gmail Service
In your InvoiceDetail component, change the API endpoint:
```javascript
// Change from:
const response = await fetch('/api/invoices/send', ...)

// To:
const response = await fetch('/api/invoices/gmail-send', ...)
```

## That's It! 
Your emails will now send through Gmail for free with no limits.

## Benefits Over Resend
- ✅ **Completely FREE** - No paid tiers
- ✅ **No API limits** - Send unlimited emails
- ✅ **No domain verification** needed
- ✅ **Works immediately** - No waiting for approval
- ✅ **Reliable** - Google's infrastructure

## Security Note
The app password is specific to this application and can be revoked anytime from your Google account settings.

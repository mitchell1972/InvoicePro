# EmailJS Setup Guide (Alternative to Resend)

## Why EmailJS?
- **No server-side code needed** - Works directly from browser
- **Free tier**: 200 emails/month
- **Super simple setup** - 5 minutes
- **No domain verification required**

## Setup Steps

### 1. Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for free account
3. You'll get 200 free emails per month

### 2. Create Email Service
1. In EmailJS dashboard, click "Email Services"
2. Click "Add New Service"
3. Choose "Gmail" (or your preferred provider)
4. Connect your Gmail account
5. Note your **Service ID** (e.g., "service_abc123")

### 3. Create Email Template
1. Click "Email Templates"
2. Click "Create New Template"
3. Set up template:
   - Subject: `Invoice {{invoice_number}} - {{company_name}}`
   - To: `{{to_email}}`
   - From Name: `{{from_name}}`
   - Content:
   ```
   Dear {{client_name}},

   Please find attached invoice #{{invoice_number}} for {{total_amount}}.

   Invoice Details:
   - Issue Date: {{issue_date}}
   - Due Date: {{due_date}}
   - Amount: {{total_amount}}

   Items:
   {{items_list}}

   Thank you for your business!

   {{company_name}}
   ```
4. Note your **Template ID** (e.g., "template_xyz789")

### 4. Get Your Public Key
1. Go to "Account" -> "API Keys"
2. Copy your **Public Key**

### 5. Install EmailJS in Frontend
```bash
cd frontend
npm install @emailjs/browser
```

### 6. Add to Your React Component
```javascript
import emailjs from '@emailjs/browser';

// Initialize (do this once in your app)
emailjs.init("YOUR_PUBLIC_KEY");

// Send email
const sendInvoiceEmail = async (invoice) => {
  try {
    const templateParams = {
      to_email: invoice.client.email,
      from_name: 'Your Company',
      client_name: invoice.client.name,
      invoice_number: invoice.number,
      total_amount: `£${invoice.totals.total}`,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      items_list: invoice.items.map(item => 
        `• ${item.description} - ${item.qty} x £${item.unitPrice}`
      ).join('\n'),
      company_name: 'Your Company'
    };

    const response = await emailjs.send(
      'YOUR_SERVICE_ID',
      'YOUR_TEMPLATE_ID',
      templateParams
    );

    console.log('Email sent successfully!', response);
    return { success: true };
  } catch (error) {
    console.error('Email failed:', error);
    return { success: false, error };
  }
};
```

## Advantages Over Resend
1. ✅ No server-side configuration
2. ✅ No API keys in environment variables
3. ✅ Works even if Vercel functions fail
4. ✅ No domain verification needed
5. ✅ Instant setup

## Limitations
- 200 emails/month on free tier
- Can't attach PDF files (but can include payment links)
- Emails sent from your connected email account

## Alternative: Gmail SMTP (Free, Unlimited)
If you prefer server-side, you can use Gmail SMTP with Nodemailer:
- Unlimited emails
- Uses your Gmail account
- Requires app-specific password

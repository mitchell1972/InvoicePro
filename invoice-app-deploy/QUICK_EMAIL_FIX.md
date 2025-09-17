# Quick Fix for Email Sending

## Option 1: Disable EmailJS (Immediate Fix)

If you don't want to use EmailJS, simply edit this line in `/frontend/src/components/InvoiceDetail.jsx`:

```javascript
// Change this line:
const useEmailJS = isEmailJSConfigured();

// To this:
const useEmailJS = false; // Disable EmailJS
```

This will use Gmail SMTP or Resend instead.

## Option 2: Configure EmailJS (5 minutes)

1. **Get your EmailJS credentials:**
   - Go to https://dashboard.emailjs.com
   - Sign in to your account
   - You need 3 values:
     - Service ID (from Email Services section)
     - Template ID (from Email Templates section)  
     - Public Key (from Account → API Keys)

2. **Update the configuration:**
   
   Edit `/frontend/src/utils/emailjs-service.js` lines 5-9:
   
   ```javascript
   const EMAILJS_CONFIG = {
     SERVICE_ID: 'service_abc123',    // ← Replace with your Service ID
     TEMPLATE_ID: 'template_xyz789',  // ← Replace with your Template ID
     PUBLIC_KEY: 'AbCdEfGhIjKl'       // ← Replace with your Public Key
   };
   ```

3. **Create an EmailJS Template:**
   
   In EmailJS dashboard → Email Templates → Create New Template:
   
   **Subject:** Invoice #{{invoice_number}} - {{total}}
   
   **Content:**
   ```
   Dear {{client_name}},
   
   Please find your invoice #{{invoice_number}} attached.
   
   Amount Due: {{total}}
   Due Date: {{due_date}}
   
   {{email_content_html}}
   
   Thank you for your business!
   ```

## Option 3: Use Gmail SMTP (Already Setup)

Your app is already configured to use Gmail SMTP as a fallback. To use it:

1. Create a Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Generate a password for "Mail"
   
2. Add to Vercel Environment Variables:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-password
   ```

3. The app will automatically use Gmail if EmailJS isn't configured.

## Current Email Priority:
1. EmailJS (if configured)
2. Gmail SMTP (if GMAIL_USER is set)
3. Resend API (if RESEND_API_KEY is set)

## Testing
After making changes, try sending an invoice again. The app will tell you which service it's using in the browser console.

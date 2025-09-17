# Resend Email Setup Guide

## 1. Create Resend Account
1. Visit [resend.com](https://resend.com) and create an account
2. Verify your email address

## 2. Get API Key
1. Go to your Resend Dashboard
2. Navigate to "API Keys"
3. Click "Create API Key"
4. Copy the API key (starts with `re_`)

## 3. Domain Setup (Recommended)
1. In Resend Dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to your domain provider
5. Verify the domain

## 4. Environment Variables
Create a `.env` file in your project root with:

```bash
# Required for email sending
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=invoices@yourdomain.com
COMPANY_NAME=Your Company Name

# Optional but recommended
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
CRON_SECRET=your_secure_random_string
```

### Without Custom Domain
If you haven't set up a custom domain, use:
```bash
FROM_EMAIL=onboarding@resend.dev
```

## 5. Testing Email Setup
You can test email sending with:

```bash
curl -X POST http://localhost:3000/api/invoices/email-service \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send_invoice",
    "invoiceId": "your_invoice_id",
    "recipientEmail": "test@example.com"
  }'
```

## 6. Production Deployment
For Vercel deployment:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all the required environment variables
4. Redeploy your application

## 7. Features Now Available
✅ **Professional Email Templates** - HTML and text versions  
✅ **Automatic Invoice Sending** - On creation and manual send  
✅ **Overdue Reminders** - 4-stage escalation system  
✅ **Banking Details Integration** - UK and US bank details in emails  
✅ **Bulk Email Sending** - Send multiple invoices at once  
✅ **Email Status Tracking** - Know when emails are sent successfully  

## 8. Troubleshooting

### Email not sending?
1. Check your API key is correct
2. Verify the FROM_EMAIL domain is verified in Resend
3. Check the console/logs for error messages

### Domain verification failed?
1. Ensure DNS records are added correctly
2. Wait up to 72 hours for DNS propagation
3. Check with your DNS provider

### Rate limits?
- Resend free plan: 100 emails/day, 3,000 emails/month
- Paid plans have higher limits
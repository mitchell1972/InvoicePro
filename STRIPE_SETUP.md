# Stripe Setup Guide

## Overview
This application uses Stripe for payment processing. You need to configure your Stripe API keys to enable payment functionality.

## Required Keys

### 1. Stripe Publishable Key (Frontend)
- Used in the frontend for creating payment forms
- Safe to expose in client-side code
- Starts with `pk_test_` (test mode) or `pk_live_` (production)

### 2. Stripe Secret Key (Backend)
- Used in API endpoints for creating payment intents
- Must be kept secret and never exposed to client-side code
- Starts with `sk_test_` (test mode) or `sk_live_` (production)

### 3. Stripe Webhook Secret (Optional)
- Used to verify webhook events from Stripe
- Starts with `whsec_`

## Setup Instructions

### Step 1: Get Your Stripe Keys
1. Sign up for a Stripe account at https://stripe.com
2. Go to your Stripe Dashboard
3. Navigate to "Developers" → "API keys"
4. Copy your "Publishable key" and "Secret key"

### Step 2: Configure Local Development

Edit `frontend/.env.local`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key_here
```

### Step 3: Configure Production (Vercel)

In your Vercel project settings, add these environment variables:
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_SECRET_KEY`: Your Stripe secret key (for API endpoints)
- `STRIPE_WEBHOOK_SECRET`: Your webhook secret (if using webhooks)

### Step 4: Test Mode vs Production

**Test Mode (Development):**
- Use keys that start with `pk_test_` and `sk_test_`
- Use test card numbers: 4242 4242 4242 4242
- No real money will be charged

**Production Mode:**
- Use keys that start with `pk_live_` and `sk_live_`
- Real payments will be processed
- Make sure to test thoroughly before going live

## Troubleshooting

### Error: "Invalid API Key provided"
This error occurs when:
1. The Stripe key is not set or is invalid
2. The key is a placeholder/demo value
3. The key format is incorrect

**Solution:**
1. Verify your key starts with `pk_test_` or `pk_live_`
2. Make sure there are no extra spaces or characters
3. Check that the key is properly set in your environment variables

### Payment form not showing
If the payment form doesn't appear:
1. Check the browser console for errors
2. Verify the Stripe publishable key is properly configured
3. Make sure the key is not a placeholder value

### API errors during payment
If payments fail at the API level:
1. Check that `STRIPE_SECRET_KEY` is properly configured in Vercel
2. Verify the secret key matches the publishable key (both test or both live)
3. Check the API logs in Vercel for specific error messages

## Security Notes

1. **Never commit real API keys to version control**
2. **Use test keys during development**
3. **Keep secret keys confidential**
4. **Rotate keys if they're ever exposed**
5. **Use different keys for development and production**

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com)

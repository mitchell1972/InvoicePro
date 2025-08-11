import { Resend } from 'resend';

// Check if API key is configured
if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'undefined') {
  console.warn('[RESEND] API key not configured. Email sending will fail.');
  console.warn('[RESEND] To enable email sending:');
  console.warn('[RESEND] 1. Sign up at https://resend.com');
  console.warn('[RESEND] 2. Get your API key from the dashboard');
  console.warn('[RESEND] 3. Add RESEND_API_KEY to your environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_development');

export default resend;
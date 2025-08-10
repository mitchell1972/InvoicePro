export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency = 'gbp', invoiceId } = req.body || {};

  if (!amount || !invoiceId) {
    return res.status(400).json({ error: 'Amount and invoice ID are required' });
  }

  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_demo') {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: { invoiceId }
      });
      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Stripe error:', error);
      return res.status(500).json({ error: 'Payment processing error' });
    }
  }

  return res.status(200).json({
    clientSecret: 'demo_secret_' + Math.random().toString(36).substr(2, 20),
    demoMode: true,
    amount,
    currency,
    invoiceId
  });
}



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  if (webhookSecret && sig) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  } else {
    event = req.body;
  }

  console.log('[WEBHOOK] Stripe event:', event.type);

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('[WEBHOOK] Payment succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('[WEBHOOK] Payment failed:', event.data.object.id);
      break;
    default:
      console.log('[WEBHOOK] Unhandled event type:', event.type);
  }

  res.status(200).json({ received: true });
}



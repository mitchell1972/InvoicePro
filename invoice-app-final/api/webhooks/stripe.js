import { getUsers, setUsers } from '../_data/users.js';

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

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        console.log('[WEBHOOK] Payment intent succeeded:', event.data.object.id);
        break;
        
      case 'payment_intent.payment_failed':
        console.log('[WEBHOOK] Payment intent failed:', event.data.object.id);
        break;
        
      default:
        console.log('[WEBHOOK] Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('[WEBHOOK] Error processing event:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.status(200).json({ received: true });
}

async function handleSubscriptionCreated(subscription) {
  console.log('[WEBHOOK] Subscription created:', subscription.id);
  await updateUserSubscription(subscription.customer, {
    status: subscription.status,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
  });
}

async function handleSubscriptionUpdated(subscription) {
  console.log('[WEBHOOK] Subscription updated:', subscription.id);
  await updateUserSubscription(subscription.customer, {
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
  });
}

async function handleSubscriptionDeleted(subscription) {
  console.log('[WEBHOOK] Subscription deleted:', subscription.id);
  await updateUserSubscription(subscription.customer, {
    status: 'canceled',
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
  });
}

async function handlePaymentSucceeded(invoice) {
  console.log('[WEBHOOK] Payment succeeded for invoice:', invoice.id);
  if (invoice.subscription) {
    await updateUserSubscription(invoice.customer, {
      status: 'active',
      currentPeriodEnd: new Date(invoice.period_end * 1000).toISOString()
    });
  }
}

async function handlePaymentFailed(invoice) {
  console.log('[WEBHOOK] Payment failed for invoice:', invoice.id);
  if (invoice.subscription) {
    await updateUserSubscription(invoice.customer, {
      status: 'past_due'
    });
  }
}

async function handleTrialWillEnd(subscription) {
  console.log('[WEBHOOK] Trial will end for subscription:', subscription.id);
  // Here you could send reminder emails to the user
  // For now, just log the event
}

async function updateUserSubscription(stripeCustomerId, updates) {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.subscription?.stripeCustomerId === stripeCustomerId);
  
  if (userIndex >= 0) {
    users[userIndex].subscription = {
      ...users[userIndex].subscription,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    setUsers(users);
    console.log('[WEBHOOK] Updated user subscription:', users[userIndex].email);
  } else {
    console.log('[WEBHOOK] User not found for customer:', stripeCustomerId);
  }
}



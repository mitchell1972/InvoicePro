import { createUser, getUserByEmail, getUsers } from '../_data/users.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, email } = req.body;

  try {
    switch (action) {
      case 'create_trial_user':
        return createTrialUser(req, res);
      
      case 'simulate_trial_end':
        return simulateTrialEnd(req, res);
      
      case 'simulate_payment_success':
        return simulatePaymentSuccess(req, res);
      
      case 'simulate_payment_failed':
        return simulatePaymentFailed(req, res);
      
      case 'get_user_status':
        return getUserStatus(req, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Test flow error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function createTrialUser(req, res) {
  const { email, name = 'Test User', planId = 'monthly' } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const existingUser = getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = createUser({
    email,
    name,
    company: 'Test Company',
    subscription: {
      status: 'trialing',
      stripeCustomerId: 'cus_test_' + Math.random().toString(36).substr(2, 9),
      stripeSubscriptionId: 'sub_test_' + Math.random().toString(36).substr(2, 9),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      planId,
      paymentMethodId: 'pm_test_card'
    }
  });

  return res.status(200).json({
    success: true,
    message: 'Test trial user created',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: user.subscription
    }
  });
}

function simulateTrialEnd(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update user to have expired trial
  user.subscription.status = 'trial_expired';
  user.subscription.trialEnd = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Yesterday
  user.subscription.currentPeriodEnd = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return res.status(200).json({
    success: true,
    message: 'Trial expired simulation complete',
    user: {
      id: user.id,
      email: user.email,
      subscription: user.subscription
    }
  });
}

function simulatePaymentSuccess(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update user to active subscription
  user.subscription.status = 'active';
  user.subscription.currentPeriodEnd = user.subscription.planId === 'yearly' ? 
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : // 1 year
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();   // 1 month

  return res.status(200).json({
    success: true,
    message: 'Payment success simulation complete',
    user: {
      id: user.id,
      email: user.email,
      subscription: user.subscription
    }
  });
}

function simulatePaymentFailed(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update user to past due
  user.subscription.status = 'past_due';

  return res.status(200).json({
    success: true,
    message: 'Payment failed simulation complete',
    user: {
      id: user.id,
      email: user.email,
      subscription: user.subscription
    }
  });
}

function getUserStatus(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Calculate days left in trial
  const now = new Date();
  const trialEnd = new Date(user.subscription.trialEnd);
  const msPerDay = 1000 * 60 * 60 * 24;
  const startUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const endUtc = Date.UTC(
    trialEnd.getUTCFullYear(),
    trialEnd.getUTCMonth(),
    trialEnd.getUTCDate()
  );
  const daysLeftInTrial = user.subscription.status === 'trialing'
    ? Math.max(0, Math.floor((endUtc - startUtc) / msPerDay))
    : 0;

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: {
        ...user.subscription,
        daysLeftInTrial
      }
    }
  });
}

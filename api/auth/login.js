import { getUserByEmail } from '../_data/users.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, remember } = req.body || {};

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Check if user exists (in production, verify password hash)
  const user = getUserByEmail(email);
  
  if (user && password.length >= 8) {
    const token = 'token_' + Math.random().toString(36).substr(2, 20);

    // Check subscription status
    const now = new Date();
    const trialEnd = new Date(user.subscription.trialEnd);
    const currentPeriodEnd = new Date(user.subscription.currentPeriodEnd);
    
    let subscriptionStatus = user.subscription.status;
    if (subscriptionStatus === 'trialing' && now > trialEnd) {
      subscriptionStatus = 'active'; // Trial ended, should be active if payment succeeded
    }

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        subscription: {
          ...user.subscription,
          status: subscriptionStatus,
          daysLeftInTrial: subscriptionStatus === 'trialing' ? 
            Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))) : 0
        }
      },
      expiresIn: remember ? '30d' : '24h'
    });
  }

  // For demo purposes, allow new users to login without registration
  if (email.includes('@') && password.length >= 8 && !user) {
    const newUser = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      company: 'Demo Company Ltd',
      createdAt: new Date().toISOString(),
      subscription: {
        status: 'trial_expired',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        trialEnd: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired yesterday
        planId: null,
        paymentMethodId: null
      }
    };

    const token = 'demo_token_' + Math.random().toString(36).substr(2, 20);

    return res.status(200).json({
      success: true,
      token,
      user: newUser,
      expiresIn: remember ? '30d' : '24h',
      message: 'Demo login - Please register for full access'
    });
  }

  return res.status(401).json({
    error: 'Invalid credentials',
    message: 'Email must be valid and password must be at least 8 characters'
  });
}



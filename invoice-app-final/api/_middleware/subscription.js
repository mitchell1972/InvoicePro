import { getUserById } from '../_data/users.js';

export function checkSubscription(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Extract user ID from token (in production, validate JWT properly)
  const token = authHeader.split(' ')[1];
  
  // For demo purposes, extract user ID from demo tokens
  let userId = null;
  if (token.startsWith('token_')) {
    // In a real app, decode JWT to get user ID
    userId = 'user_demo123'; // Demo user
  }

  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check subscription status
  const now = new Date();
  const subscription = user.subscription;

  if (!subscription) {
    return res.status(403).json({ 
      error: 'No subscription found',
      subscriptionRequired: true 
    });
  }

  // Check if trial has expired
  if (subscription.status === 'trialing') {
    const trialEnd = new Date(subscription.trialEnd);
    if (now > trialEnd) {
      return res.status(403).json({
        error: 'Free trial has expired',
        subscriptionRequired: true,
        trialExpired: true
      });
    }
  }

  // Check if subscription is active
  if (!['trialing', 'active'].includes(subscription.status)) {
    return res.status(403).json({
      error: 'Subscription required',
      subscriptionRequired: true,
      status: subscription.status
    });
  }

  // Check if current period has ended (for active subscriptions)
  if (subscription.status === 'active' && subscription.currentPeriodEnd) {
    const periodEnd = new Date(subscription.currentPeriodEnd);
    if (now > periodEnd) {
      return res.status(403).json({
        error: 'Subscription expired',
        subscriptionRequired: true,
        subscriptionExpired: true
      });
    }
  }

  // Add user to request for further processing
  req.user = user;
  
  if (next) {
    next();
  }
  return true;
}

// Wrapper function for serverless functions
export function withSubscription(handler) {
  return async (req, res) => {
    const subscriptionCheck = checkSubscription(req, res);
    
    if (subscriptionCheck === true) {
      return handler(req, res);
    }
    
    // If subscriptionCheck is not true, the response has already been sent
    return;
  };
}
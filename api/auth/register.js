import Stripe from 'stripe';
import { getUserByEmail, createUser } from '../_data/users.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    email, 
    password, 
    name, 
    company, 
    paymentMethodId, 
    planId = 'monthly' 
  } = req.body || {};

  // Basic validation
  if (!email || !password || !name || !paymentMethodId) {
    return res.status(400).json({ 
      error: 'Email, password, name, and payment method are required' 
    });
  }

  if (!email.includes('@') || password.length < 8) {
    return res.status(400).json({
      error: 'Email must be valid and password must be at least 8 characters'
    });
  }

  try {
    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        company: company || '',
      }
    });

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: planId === 'yearly' ? 'Invoice App - Yearly' : 'Invoice App - Monthly',
            description: 'Professional invoice management system'
          },
          unit_amount: planId === 'yearly' ? 16000 : 1499,
          recurring: {
            interval: planId === 'yearly' ? 'year' : 'month',
          },
        },
      }],
      trial_period_days: 7,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Create user in our database
    const user = createUser({
      email,
      name,
      company: company || '',
      subscription: {
        status: subscription.status,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        trialEnd: new Date(subscription.trial_end * 1000).toISOString(),
        planId,
        paymentMethodId
      }
    });

    // Generate token for immediate login
    const token = 'token_' + Math.random().toString(36).substr(2, 20);

    return res.status(200).json({
      success: true,
      message: 'Account created successfully! You have 7 days free trial.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        subscription: user.subscription
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEnd: new Date(subscription.trial_end * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: 'Payment method error',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Registration failed',
      details: error.message
    });
  }
}

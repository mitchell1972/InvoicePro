const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Load environment variables (these should be set in production)
// process.env.STRIPE_SECRET_KEY - should be set in production
// process.env.BLOB_READ_WRITE_TOKEN - should be set in production

// Simple route handler wrapper for error handling
function routeHandler(handlerModule) {
  return async (req, res) => {
    try {
      // Handle both default exports and direct function exports
      const handler = typeof handlerModule === 'function' ? handlerModule : handlerModule.default || handlerModule;
      await handler(req, res);
    } catch (error) {
      console.error('Route error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  };
}

// Auth routes
try {
  const authLogin = require('./api/auth/login.js');
  app.post('/api/auth/login', routeHandler(authLogin));
} catch (e) {
  console.warn('Auth login route not loaded:', e.message);
}

try {
  const authRegister = require('./api/auth/register.js');
  app.post('/api/auth/register', routeHandler(authRegister));
} catch (e) {
  console.warn('Auth register route not loaded:', e.message);
}

// Invoice routes
try {
  const invoicesIndex = require('./api/invoices/index.js');
  app.get('/api/invoices', routeHandler(invoicesIndex));
  app.post('/api/invoices', routeHandler(invoicesIndex));
} catch (e) {
  console.warn('Invoices index route not loaded:', e.message);
}

try {
  const invoicesById = require('./api/invoices/[id].js');
  app.get('/api/invoices/:id', routeHandler(invoicesById));
  app.put('/api/invoices/:id', routeHandler(invoicesById));
  app.delete('/api/invoices/:id', routeHandler(invoicesById));
} catch (e) {
  console.warn('Invoices by ID route not loaded:', e.message);
}

// Invoice email routes
try {
  const invoicesSend = require('./api/invoices/send.js');
  app.post('/api/invoices/send', routeHandler(invoicesSend));
} catch (e) {
  console.warn('Invoices send route not loaded:', e.message);
}

// Payment routes
try {
  const createIntent = require('./api/payments/create-intent.js');
  app.post('/api/payments/create-intent', routeHandler(createIntent));
} catch (e) {
  console.warn('Payment create-intent route not loaded:', e.message);
}

// Subscription routes
try {
  const subscriptionPlans = require('./api/subscriptions/plans.js');
  app.get('/api/subscriptions/plans', routeHandler(subscriptionPlans));
} catch (e) {
  console.warn('Subscription plans route not loaded:', e.message);
}

// Webhook routes
try {
  const stripeWebhook = require('./api/webhooks/stripe.js');
  app.post('/api/webhooks/stripe', routeHandler(stripeWebhook));
} catch (e) {
  console.warn('Stripe webhook route not loaded:', e.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app for any non-API routes (SPA support)
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
  } catch (error) {
    console.error('Error serving React app:', error);
    res.status(500).send('Error loading application');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Invoice App Server running on http://localhost:${PORT}`);
  console.log('📋 API endpoints available:');
  console.log('- GET  /api/health');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/register'); 
  console.log('- GET  /api/invoices');
  console.log('- POST /api/invoices');
  console.log('- GET  /api/invoices/:id');
  console.log('- PUT  /api/invoices/:id');
  console.log('- DELETE /api/invoices/:id');
  console.log('- POST /api/invoices/send');
  console.log('- POST /api/payments/create-intent');
  console.log('- GET  /api/subscriptions/plans');
  console.log('- POST /api/webhooks/stripe');
  console.log('📱 Frontend served for all other routes');
});

module.exports = app;

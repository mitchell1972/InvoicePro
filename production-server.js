import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend/dist'));

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

// Dynamic import wrapper for ES modules
async function importESModule(modulePath) {
  try {
    const module = await import(modulePath);
    return module;
  } catch (error) {
    console.warn(`Failed to import ES module ${modulePath}:`, error.message);
    return null;
  }
}

// Async function to setup all routes
async function setupRoutes() {
  // Auth routes
  const authLogin = await importESModule('./api/auth/login.js');
  if (authLogin) {
    app.post('/api/auth/login', routeHandler(authLogin));
  }

  const authRegister = await importESModule('./api/auth/register.js');
  if (authRegister) {
    app.post('/api/auth/register', routeHandler(authRegister));
  }

  // Invoice routes
  const invoicesIndex = await importESModule('./api/invoices/index.js');
  if (invoicesIndex) {
    app.get('/api/invoices', routeHandler(invoicesIndex));
    app.post('/api/invoices', routeHandler(invoicesIndex));
  }

  const invoicesById = await importESModule('./api/invoices/[id].js');
  if (invoicesById) {
    app.get('/api/invoices/:id', routeHandler(invoicesById));
    app.put('/api/invoices/:id', routeHandler(invoicesById));
    app.delete('/api/invoices/:id', routeHandler(invoicesById));
  }

  // Invoice email routes
  const invoicesSend = await importESModule('./api/invoices/send.js');
  if (invoicesSend) {
    app.post('/api/invoices/send', routeHandler(invoicesSend));
  }

  // Payment routes
  const createIntent = await importESModule('./api/payments/create-intent.js');
  if (createIntent) {
    app.post('/api/payments/create-intent', routeHandler(createIntent));
  }

  // Subscription routes
  const subscriptionPlans = await importESModule('./api/subscriptions/plans.js');
  if (subscriptionPlans) {
    app.get('/api/subscriptions/plans', routeHandler(subscriptionPlans));
  }

  // Webhook routes
  const stripeWebhook = await importESModule('./api/webhooks/stripe.js');
  if (stripeWebhook) {
    app.post('/api/webhooks/stripe', routeHandler(stripeWebhook));
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
      res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
    } catch (error) {
      console.error('Error serving React app:', error);
      res.status(500).send('Error loading application');
    }
  });
}

// Initialize routes and start server
setupRoutes().then(() => {
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
}).catch(error => {
  console.error('Failed to setup routes:', error);
  process.exit(1);
});

export default app;

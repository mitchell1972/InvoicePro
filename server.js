const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend/dist'));

// Load environment variables for demo
process.env.STRIPE_SECRET_KEY = 'sk_test_demo';
process.env.BLOB_READ_WRITE_TOKEN = 'demo_token';

// Import API routes dynamically
const fs = require('fs');

// Simple route handler wrapper
function routeHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('Route error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Auth routes
app.post('/api/auth/login', routeHandler(require('./api/auth/login.js').default));
app.post('/api/auth/register', routeHandler(require('./api/auth/register.js').default));

// Invoice routes
app.get('/api/invoices', routeHandler(require('./api/invoices/index.js').default));
app.post('/api/invoices', routeHandler(require('./api/invoices/index.js').default));
app.get('/api/invoices/:id', routeHandler(require('./api/invoices/[id].js').default));
app.put('/api/invoices/:id', routeHandler(require('./api/invoices/[id].js').default));
app.delete('/api/invoices/:id', routeHandler(require('./api/invoices/[id].js').default));

// Payment routes
app.post('/api/payments/create-intent', routeHandler(require('./api/payments/create-intent.js').default));

// Email routes
app.post('/api/invoices/send', routeHandler(require('./api/invoices/send.js').default));

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/register');
  console.log('- GET /api/invoices');
  console.log('- POST /api/invoices');
  console.log('- POST /api/payments/create-intent');
});
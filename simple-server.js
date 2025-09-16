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

// Simple demo endpoints for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo login - accepts any email/password for testing
  if (email && password) {
    res.json({
      token: 'demo_jwt_token_' + Date.now(),
      user: {
        id: 'demo_user_' + Date.now(),
        email: email,
        name: 'Demo User',
        company: 'Demo Company'
      }
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, company } = req.body;
  
  if (email && password && name) {
    res.json({
      message: 'User registered successfully',
      user: {
        id: 'demo_user_' + Date.now(),
        email: email,
        name: name,
        company: company || 'Demo Company'
      }
    });
  } else {
    res.status(400).json({ error: 'Email, password, and name required' });
  }
});

app.get('/api/invoices', (req, res) => {
  // Demo invoices
  res.json([
    {
      id: 'inv_001',
      number: '001',
      client: { name: 'Demo Client', email: 'client@demo.com' },
      items: [{ description: 'Demo Service', qty: 1, unitPrice: 100 }],
      total: 100,
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  ]);
});

app.post('/api/invoices', (req, res) => {
  // Demo invoice creation
  const invoice = {
    id: 'inv_' + Date.now(),
    number: String(Date.now()).slice(-3),
    ...req.body,
    status: 'draft',
    createdAt: new Date().toISOString()
  };
  res.json(invoice);
});

app.post('/api/payments/create-intent', (req, res) => {
  const { amount, currency = 'gbp', invoiceId } = req.body;
  
  if (!amount || !invoiceId) {
    return res.status(400).json({ error: 'Amount and invoice ID required' });
  }
  
  // Demo payment intent
  res.json({
    clientSecret: 'demo_secret_' + Math.random().toString(36).substr(2, 20),
    demoMode: true,
    amount,
    currency,
    invoiceId
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Invoice App Backend Server running on http://localhost:${PORT}`);
  console.log('\n📡 API endpoints available:');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/register');
  console.log('- GET /api/invoices');
  console.log('- POST /api/invoices');
  console.log('- POST /api/payments/create-intent');
  console.log('- GET /api/health');
  console.log('\n🌐 Frontend served from: http://localhost:' + PORT);
  console.log('\n✅ Demo mode: All endpoints return mock data for testing\n');
});
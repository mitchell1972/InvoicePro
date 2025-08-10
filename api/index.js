export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Invoice API v1.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth/login',
      '/api/invoices',
      '/api/invoices/:id',
      '/api/invoices/send',
      '/api/payments/create-intent',
      '/api/webhooks/stripe'
    ]
  });
}



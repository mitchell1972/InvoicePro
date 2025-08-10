export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Invoice API v1.1',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth/login',
      '/api/invoices',
      '/api/invoices/:id',
      '/api/invoices/send',
      '/api/invoices/remind-overdue',
      '/api/invoices/trigger-reminders',
      '/api/invoices/test-reminders',
      '/api/payments/create-intent',
      '/api/webhooks/stripe'
    ],
    features: [
      'Authentication',
      'Invoice CRUD operations',
      'Email sending',
      'Automatic overdue reminders',
      'Stripe payment integration',
      'Webhook handling'
    ]
  });
}



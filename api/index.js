export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Invoice API v1.1',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/subscriptions/plans',
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
      'User registration & authentication',
      '7-day free trial subscriptions',
      'Invoice CRUD operations',
      'Email sending',
      'Automatic overdue reminders',
      'Stripe payment integration',
      'Subscription management',
      'Webhook handling'
    ]
  });
}



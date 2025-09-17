export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      description: 'Full access to all invoice features',
      price: 899, // $8.99 in cents
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      trialPeriodDays: 7,
      features: [
        'Unlimited invoices',
        'Payment processing',
        'Automatic overdue reminders',
        'Custom branding',
        'Analytics dashboard',
        'Email support'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      description: 'Full access with over 1 month free',
      price: 9900, // $99.00 in cents (equivalent to 11+ months)
      currency: 'usd',
      interval: 'year',
      intervalCount: 1,
      trialPeriodDays: 7,
      features: [
        'Unlimited invoices',
        'Payment processing',
        'Automatic overdue reminders',
        'Custom branding',
        'Analytics dashboard',
        'Priority email support',
        'Over 1 month free'
      ],
      savings: '8% off monthly'
    }
  ];

  return res.status(200).json({
    success: true,
    plans
  });
}
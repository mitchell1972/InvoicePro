export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      description: 'Full access to all invoice features',
      price: 1499, // $14.99 in cents
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
      description: 'Full access with 2 months free',
      price: 16000, // $160.00 in cents (equivalent to ~10.7 months)
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
        '2 months free'
      ],
      savings: '11% off monthly'
    }
  ];

  return res.status(200).json({
    success: true,
    plans
  });
}
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      description: 'Full access to all invoice features',
      price: 2900, // $29.00 in cents
      currency: 'gbp',
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
      price: 29000, // $290.00 in cents (equivalent to 10 months)
      currency: 'gbp',
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
      savings: '17% off monthly'
    }
  ];

  return res.status(200).json({
    success: true,
    plans
  });
}
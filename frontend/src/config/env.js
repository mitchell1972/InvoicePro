/* Environment access for Vite (frontend) */

// Validate Stripe key
const validateStripeKey = (key) => {
  if (
    !key ||
    key === 'pk_test_your_stripe_publishable_key' ||
    key.includes('demo') ||
    key.includes('Demo')
  ) {
    console.error(
      'Invalid or placeholder Stripe publishable key detected. Please configure a valid Stripe key.'
    );
    return null;
  }
  return key;
};

// Vite embeds env vars at build time via import.meta.env
export const VITE_API_URL = import.meta.env.VITE_API_URL ?? '/api';
export const VITE_STRIPE_PUBLISHABLE_KEY = validateStripeKey(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''
);

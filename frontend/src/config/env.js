/* Safe environment access for both browser and Jest */

const getEnvVar = (key, fallback) => {
  if (typeof window !== 'undefined' && window[key]) return window[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return fallback;
};

// Validate Stripe key
const validateStripeKey = (key) => {
  if (!key || key === 'pk_test_your_stripe_publishable_key' || key.includes('demo') || key.includes('Demo')) {
    console.error('Invalid or placeholder Stripe publishable key detected. Please configure a valid Stripe key.');
    return null;
  }
  return key;
};

export const VITE_API_URL = getEnvVar('VITE_API_URL', '/api');
export const VITE_STRIPE_PUBLISHABLE_KEY = validateStripeKey(getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', ''));


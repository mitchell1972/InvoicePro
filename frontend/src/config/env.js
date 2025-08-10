/* Safe environment access for both browser and Jest */

const getEnvVar = (key, fallback) => {
  if (typeof window !== 'undefined' && window[key]) return window[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return fallback;
};

export const VITE_API_URL = getEnvVar('VITE_API_URL', '/api');
export const VITE_STRIPE_PUBLISHABLE_KEY = getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_demo');



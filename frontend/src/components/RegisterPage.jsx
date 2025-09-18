import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { VITE_STRIPE_PUBLISHABLE_KEY } from '../config/env';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const stripePromise = VITE_STRIPE_PUBLISHABLE_KEY ? loadStripe(VITE_STRIPE_PUBLISHABLE_KEY) : null;

function RegistrationForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: '',
    planId: 'monthly'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: user details, 2: plan selection, 3: payment

  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { login } = useAuth();

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$14.99',
      period: '/month',
      description: 'Perfect for getting started',
      features: ['Unlimited invoices', 'Payment processing', 'Email support']
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$160',
      period: '/year',
      description: 'Save 17% with annual billing',
      features: ['Unlimited invoices', 'Payment processing', 'Priority support', '2 months free'],
      popular: true
    }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.name) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error: paymentError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.name,
          email: formData.email,
        },
      });

      if (paymentError) {
        setError(paymentError.message);
        setLoading(false);
        return;
      }

      // Register user with payment method
      const response = await apiClient.post('/auth/register', {
        ...formData,
        paymentMethodId: paymentMethod.id
      });

      if (response.data.success) {
        // Log the user in
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      }

    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Start your 7-day free trial today</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNum <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && <div className={`w-12 h-1 mx-2 ${
                stepNum < step ? 'bg-primary-600' : 'bg-gray-200'
              }`} />}
            </div>
          ))}
        </div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
              {plans.map((plan) => (
                <div key={plan.id} className={`relative border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.planId === plan.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'ring-2 ring-primary-200' : ''}`} onClick={() => setFormData({ ...formData, planId: plan.id })}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-4 px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="planId"
                      value={plan.id}
                      checked={formData.planId === plan.id}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="flex items-baseline">
                        <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                        <span className="ml-2 text-2xl font-bold text-gray-900">{plan.price}</span>
                        <span className="ml-1 text-gray-600">{plan.period}</span>
                      </div>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-7">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>7-day free trial:</strong> Your card will be charged after the trial period ends. Cancel anytime during the trial.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              
              {!VITE_STRIPE_PUBLISHABLE_KEY && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Payment system unavailable</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>The payment system is currently not configured. Please contact support or try again later.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {plans.find(p => p.id === formData.planId)?.name}
                  </span>
                  <span className="font-bold">
                    {plans.find(p => p.id === formData.planId)?.price}{plans.find(p => p.id === formData.planId)?.period}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  7-day free trial • First charge on {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>

              {VITE_STRIPE_PUBLISHABLE_KEY && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Information</label>
                    <div className="p-3 border border-gray-300 rounded-lg">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                    <strong>Secure:</strong> Your payment information is encrypted and secure. We never store your card details.
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (step === 3 && (!stripe || !VITE_STRIPE_PUBLISHABLE_KEY))}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : step === 3 ? 'Start Free Trial' : 'Continue'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  if (!stripePromise) {
    return <RegistrationForm />;
  }
  
  return (
    <Elements stripe={stripePromise}>
      <RegistrationForm />
    </Elements>
  );
}

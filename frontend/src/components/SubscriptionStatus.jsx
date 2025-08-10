import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/money';

export default function SubscriptionStatus() {
  const { user } = useAuth();

  if (!user?.subscription) return null;

  const { subscription } = user;
  const isTrialing = subscription.status === 'trialing';
  const isExpired = subscription.status === 'trial_expired' || subscription.status === 'past_due';
  
  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'trialing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'trial_expired':
      case 'past_due':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusMessage = () => {
    switch (subscription.status) {
      case 'active':
        return `Active subscription • Next billing: ${formatDate(subscription.currentPeriodEnd)}`;
      case 'trialing':
        return `Free trial • ${subscription.daysLeftInTrial || 0} days remaining`;
      case 'trial_expired':
        return 'Trial expired • Please update your subscription';
      case 'past_due':
        return 'Payment failed • Please update your payment method';
      default:
        return 'Subscription status unknown';
    }
  };

  // Don't show if user has active subscription
  if (subscription.status === 'active') return null;

  return (
    <div className={`mb-6 p-4 border rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{getStatusMessage()}</p>
          {isTrialing && (
            <p className="text-sm mt-1 opacity-75">
              Your card will be charged on {formatDate(subscription.trialEnd)}
            </p>
          )}
          {isExpired && (
            <p className="text-sm mt-1 opacity-75">
              Upgrade now to continue using all features
            </p>
          )}
        </div>
        {(isTrialing || isExpired) && (
          <button
            onClick={() => window.location.href = '/settings#subscription'}
            className="px-4 py-2 bg-white border border-current rounded-lg hover:bg-opacity-10 transition-colors text-sm font-medium"
          >
            {isExpired ? 'Upgrade Now' : 'Manage'}
          </button>
        )}
      </div>
    </div>
  );
}
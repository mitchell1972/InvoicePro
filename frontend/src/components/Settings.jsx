import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/money';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    company: {
      name: 'Your Company Ltd',
      address: '123 Business Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
      vatNumber: 'GB123456789'
    },
    defaults: {
      currency: 'GBP',
      taxPercent: 20,
      paymentTerms: 'Net 30'
    },
    reminders: {
      enabled: true,
      firstReminderDays: 1,
      secondReminderDays: 7,
      thirdReminderDays: 15,
      finalReminderDays: 30
    },
    banking: {
      country: 'GB', // GB for UK, US for United States
      // UK fields
      uk: {
        bankName: '',
        accountName: '',
        accountNumber: '',
        sortCode: ''
      },
      // US fields
      us: {
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: ''
      }
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem('invoiceSettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('invoiceSettings', JSON.stringify(settings));
    
    // Show success message
    alert('Settings saved successfully!');
    
    // Navigate to dashboard after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Company Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.company.name}
                onChange={(e) => setSettings({ ...settings, company: { ...settings.company, name: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT/Tax Number</label>
              <input
                type="text"
                value={settings.company.vatNumber}
                onChange={(e) => setSettings({ ...settings, company: { ...settings.company, vatNumber: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={settings.company.address}
                onChange={(e) => setSettings({ ...settings, company: { ...settings.company, address: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={settings.company.city}
                onChange={(e) => setSettings({ ...settings, company: { ...settings.company, city: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
              <input
                type="text"
                value={settings.company.postcode}
                onChange={(e) => setSettings({ ...settings, company: { ...settings.company, postcode: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={settings.company.country}
                onChange={(e) => setSettings({ ...settings, company: { ...settings.company, country: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Default Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={settings.defaults.currency}
                onChange={(e) => setSettings({ ...settings, defaults: { ...settings.defaults, currency: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={settings.defaults.taxPercent}
                onChange={(e) => setSettings({ ...settings, defaults: { ...settings.defaults, taxPercent: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select
                value={settings.defaults.paymentTerms}
                onChange={(e) => setSettings({ ...settings, defaults: { ...settings.defaults, paymentTerms: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on receipt">Due on receipt</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Banking Details</h2>
          <p className="text-sm text-gray-600 mb-4">
            These details will be included in invoices and reminder emails for bank transfer payments.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banking Country</label>
              <select
                value={settings.banking.country}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  banking: { ...settings.banking, country: e.target.value } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
              </select>
            </div>

            {settings.banking.country === 'GB' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={settings.banking.uk.bankName}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        banking: { 
                          ...settings.banking, 
                          uk: { ...settings.banking.uk, bankName: e.target.value } 
                        } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. Barclays Bank"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={settings.banking.uk.accountName}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        banking: { 
                          ...settings.banking, 
                          uk: { ...settings.banking.uk, accountName: e.target.value } 
                        } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Account holder name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Code</label>
                    <input
                      type="text"
                      value={settings.banking.uk.sortCode}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        banking: { 
                          ...settings.banking, 
                          uk: { ...settings.banking.uk, sortCode: e.target.value.replace(/\D/g, '').slice(0, 6) } 
                        } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="12-34-56"
                      maxLength="8"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={settings.banking.uk.accountNumber}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        banking: { 
                          ...settings.banking, 
                          uk: { ...settings.banking.uk, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 8) } 
                        } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="12345678"
                      maxLength="8"
                    />
                  </div>
                </div>
              </>
            )}

            {settings.banking.country === 'US' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={settings.banking.us.bankName}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        banking: { 
                          ...settings.banking, 
                          us: { ...settings.banking.us, bankName: e.target.value } 
                        } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. Bank of America"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={settings.banking.us.accountName}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        banking: { 
                          ...settings.banking, 
                          us: { ...settings.banking.us, accountName: e.target.value } 
                        } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Account holder name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number (ABA)</label>
                    <input
                      type="text"
                      value={settings.banking.us.routingNumber}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        banking: { 
                          ...settings.banking, 
                          us: { ...settings.banking.us, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) } 
                        } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="123456789"
                      maxLength="9"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={settings.banking.us.accountNumber}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        banking: { 
                          ...settings.banking, 
                          us: { ...settings.banking.us, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 17) } 
                        } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Account number"
                      maxLength="17"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Security Note:</strong> Your banking details are stored locally and included in invoice emails. 
                    Never share these details with untrusted parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Overdue Reminders</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminders-enabled"
                checked={settings.reminders.enabled}
                onChange={(e) => setSettings({ ...settings, reminders: { ...settings.reminders, enabled: e.target.checked } })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="reminders-enabled" className="ml-2 text-sm text-gray-700">
                Enable automatic overdue reminders
              </label>
            </div>

            {settings.reminders.enabled && (
              <div className="ml-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First reminder (days after due date)</label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.reminders.firstReminderDays}
                      onChange={(e) => setSettings({ ...settings, reminders: { ...settings.reminders, firstReminderDays: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Second reminder (days after due date)</label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.reminders.secondReminderDays}
                      onChange={(e) => setSettings({ ...settings, reminders: { ...settings.reminders, secondReminderDays: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Third reminder (days after due date)</label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.reminders.thirdReminderDays}
                      onChange={(e) => setSettings({ ...settings, reminders: { ...settings.reminders, thirdReminderDays: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final reminder (days after due date)</label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.reminders.finalReminderDays}
                      onChange={(e) => setSettings({ ...settings, reminders: { ...settings.reminders, finalReminderDays: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Reminders are sent daily at 9:00 AM UTC. Only "Sent" invoices that are past their due date will receive reminders.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {user?.subscription && (
          <div id="subscription" className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Subscription</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">
                    {user.subscription.planId === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Status: <span className={`font-medium ${
                      user.subscription.status === 'active' ? 'text-green-600' :
                      user.subscription.status === 'trialing' ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {user.subscription.status === 'trialing' ? 'Free Trial' :
                       user.subscription.status === 'active' ? 'Active' :
                       user.subscription.status === 'trial_expired' ? 'Trial Expired' :
                       user.subscription.status}
                    </span>
                  </p>
                  {user.subscription.status === 'trialing' && user.subscription.daysLeftInTrial !== undefined && (
                    <p className="text-sm text-gray-600">
                      {user.subscription.daysLeftInTrial} days left in trial
                    </p>
                  )}
                  {user.subscription.currentPeriodEnd && (
                    <p className="text-sm text-gray-600">
                      {user.subscription.status === 'active' ? 'Next billing: ' : 'Trial ends: '}
                      {formatDate(user.subscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {user.subscription.status === 'trial_expired' && (
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      Upgrade Now
                    </button>
                  )}
                  {['trialing', 'active'].includes(user.subscription.status) && (
                    <>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Update Payment
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {user.subscription.status === 'trialing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Free Trial Active</h4>
                  <p className="text-sm text-blue-700">
                    You're currently on a 7-day free trial. Your card will be automatically charged 
                    {user.subscription.trialEnd && ` on ${formatDate(user.subscription.trialEnd)}`} 
                    unless you cancel before then.
                  </p>
                </div>
              )}

              {user.subscription.status === 'trial_expired' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Trial Expired</h4>
                  <p className="text-sm text-red-700">
                    Your free trial has ended. Please upgrade to continue using all features.
                  </p>
                </div>
              )}

              {user.subscription.status === 'past_due' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Payment Failed</h4>
                  <p className="text-sm text-yellow-700">
                    Your last payment failed. Please update your payment method to continue your subscription.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}



import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { VITE_STRIPE_PUBLISHABLE_KEY } from './config/env';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceDetail from './components/InvoiceDetail';
import Settings from './components/Settings';
import PaymentPage from './components/PaymentPage';
import Navbar from './components/Navbar';

// Only load Stripe if we have a valid key
let stripePromise = null;
if (VITE_STRIPE_PUBLISHABLE_KEY && VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
  try {
    stripePromise = loadStripe(VITE_STRIPE_PUBLISHABLE_KEY);
  } catch (error) {
    console.warn('Failed to load Stripe:', error);
  }
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/pay/:id"
          element={
            stripePromise ? (
              <Elements stripe={stripePromise}>
                <PaymentPage />
              </Elements>
            ) : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment System Unavailable</h1>
                  <p className="text-gray-600">Payment processing is currently unavailable. Please contact support.</p>
                </div>
              </div>
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InvoiceForm />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InvoiceDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id/edit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InvoiceForm />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

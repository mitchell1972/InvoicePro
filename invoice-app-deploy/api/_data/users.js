// Shared in-memory storage for users
// Note: This resets on cold starts. For demo purposes only.

const defaultUsers = [
  {
    id: 'user_demo123',
    email: 'demo@example.com',
    name: 'Demo User',
    company: 'Demo Company Ltd',
    createdAt: '2025-01-01T10:00:00Z',
    subscription: {
      status: 'trialing',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      planId: 'monthly',
      paymentMethodId: null
    }
  }
];

if (!globalThis.__users) {
  globalThis.__users = [...defaultUsers];
}

export function getUsers() {
  return globalThis.__users;
}

export function setUsers(newUsers) {
  globalThis.__users = newUsers;
}

export function getUserById(userId) {
  return globalThis.__users.find(user => user.id === userId);
}

export function getUserByEmail(email) {
  return globalThis.__users.find(user => user.email === email);
}

export function createUser(userData) {
  const newUser = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    ...userData,
    createdAt: new Date().toISOString(),
    subscription: {
      status: 'trialing',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      planId: 'monthly',
      paymentMethodId: null
    }
  };
  
  globalThis.__users.push(newUser);
  return newUser;
}

export function updateUser(userId, updates) {
  const userIndex = globalThis.__users.findIndex(user => user.id === userId);
  if (userIndex >= 0) {
    globalThis.__users[userIndex] = { ...globalThis.__users[userIndex], ...updates };
    return globalThis.__users[userIndex];
  }
  return null;
}
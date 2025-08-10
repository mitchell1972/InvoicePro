export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, remember } = req.body || {};

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Mock authentication
  if (email.includes('@') && password.length >= 8) {
    const user = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email,
      name:
        email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      company: 'Demo Company Ltd',
      createdAt: new Date().toISOString()
    };

    const token = 'demo_token_' + Math.random().toString(36).substr(2, 20);

    return res.status(200).json({
      success: true,
      token,
      user,
      expiresIn: remember ? '30d' : '24h'
    });
  }

  return res.status(401).json({
    error: 'Invalid credentials',
    message: 'Email must be valid and password must be at least 8 characters'
  });
}



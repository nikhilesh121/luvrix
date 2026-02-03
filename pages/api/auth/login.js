import { loginUser } from '../../../lib/auth';
import { withRateLimit } from '../../../lib/rateLimit';

// Note: Login is a public endpoint - CSRF not required (no session yet)
// Rate limited to prevent brute force attacks
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const result = await loginUser(email, password);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withRateLimit(handler, 'auth');

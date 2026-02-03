import { getUserFromToken, changePassword } from '../../../lib/auth';
import { withCSRFProtection } from '../../../lib/csrf';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }

    const result = await changePassword(user.uid, currentPassword, newPassword);
    
    if (result.success) {
      return res.status(200).json({ success: true, userId: user.uid });
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Change password API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withCSRFProtection(handler);

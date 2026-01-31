import { getUserFromToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await getUserFromToken(token);
    
    if (user) {
      return res.status(200).json({ user });
    } else {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth me API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

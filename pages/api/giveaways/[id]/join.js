import { verifyToken } from '../../../../lib/auth';
import { joinGiveaway } from '../../../../lib/giveaway';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Please log in to join' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const participant = await joinGiveaway(id, decoded.uid);
    return res.status(201).json(participant);
  } catch (error) {
    console.error('Join giveaway error:', error);
    const status = error.message?.includes('Already joined') ? 409
      : error.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: error.message || 'Internal server error' });
  }
}

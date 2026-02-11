import { verifyToken } from '../../../../lib/auth';
import { getDb } from '../../../../lib/mongodb';
import { getGiveaway, getWinnerShipping } from '../../../../lib/giveaway';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: decoded.uid });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const giveaway = await getGiveaway(id);
    if (!giveaway) return res.status(404).json({ error: 'Giveaway not found' });

    const shipping = await getWinnerShipping(giveaway.id);
    return res.status(200).json({ shipping });
  } catch (error) {
    console.error('Shipping details error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

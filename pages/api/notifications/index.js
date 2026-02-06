import { getUserNotifications, markAllNotificationsRead } from '../../../lib/notifications';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });

  const userId = decoded.uid;

  if (req.method === 'GET') {
    try {
      const { category, limit, skip, unreadOnly } = req.query;
      const result = await getUserNotifications(userId, {
        category: category || null,
        limit: parseInt(limit) || 50,
        skip: parseInt(skip) || 0,
        unreadOnly: unreadOnly === 'true',
      });
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  if (req.method === 'PUT') {
    // Mark all as read
    try {
      const { category } = req.body;
      await markAllNotificationsRead(userId, category);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Mark all read error:', error);
      return res.status(500).json({ error: 'Failed to mark notifications' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

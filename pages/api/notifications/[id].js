import { markNotificationRead } from '../../../lib/notifications';
import { verifyToken } from '../../../lib/auth';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }
      await markNotificationRead(objectId);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Mark read error:', error);
      return res.status(500).json({ error: 'Failed to mark notification' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const db = await getDb();
      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }
      await db.collection('notifications').deleteOne({ _id: objectId, userId: decoded.uid });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

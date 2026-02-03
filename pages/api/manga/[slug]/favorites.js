import { getDb } from '../../../../lib/mongodb';
import { withCSRFProtection } from '../../../../lib/csrf';

async function handler(req, res) {
  const { slug } = req.query;
  const db = await getDb();

  if (req.method === 'POST') {
    try {
      // Use findOneAndUpdate to get the updated document
      const result = await db.collection('manga').findOneAndUpdate(
        { slug },
        { $inc: { favorites: 1 } },
        { returnDocument: 'after' }
      );
      // Return the updated favorites count for real-time updates
      return res.status(200).json({ success: true, favorites: result?.favorites || 0 });
    } catch (error) {
      console.error('Error incrementing manga favorites:', error);
      return res.status(500).json({ error: 'Failed to increment favorites' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Use findOneAndUpdate to get the updated document
      const result = await db.collection('manga').findOneAndUpdate(
        { slug },
        { $inc: { favorites: -1 } },
        { returnDocument: 'after' }
      );
      // Return the updated favorites count for real-time updates
      return res.status(200).json({ success: true, favorites: Math.max(0, result?.favorites || 0) });
    } catch (error) {
      console.error('Error decrementing manga favorites:', error);
      return res.status(500).json({ error: 'Failed to decrement favorites' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCSRFProtection(handler);

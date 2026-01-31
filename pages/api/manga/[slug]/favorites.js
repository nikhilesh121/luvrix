import { getDb } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  const { slug } = req.query;
  const db = await getDb();

  if (req.method === 'POST') {
    try {
      await db.collection('manga').updateOne(
        { slug },
        { $inc: { favorites: 1 } }
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error incrementing manga favorites:', error);
      return res.status(500).json({ error: 'Failed to increment favorites' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db.collection('manga').updateOne(
        { slug },
        { $inc: { favorites: -1 } }
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error decrementing manga favorites:', error);
      return res.status(500).json({ error: 'Failed to decrement favorites' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

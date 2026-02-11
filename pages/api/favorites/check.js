import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId, userId, itemType } = req.query;
    
    if (!itemId || !userId) {
      return res.status(400).json({ error: 'Missing itemId or userId' });
    }

    const db = await getDb();
    const favId = `${userId}_${itemId}`;
    
    const favorite = await db.collection('favorites').findOne({ _id: favId });

    return res.status(200).json({ favorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return res.status(500).json({ error: 'Failed to check favorite status' });
  }
}

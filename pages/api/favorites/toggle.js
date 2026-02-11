import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, itemId, itemType = 'blog' } = req.body;

    if (!userId || !itemId) {
      return res.status(400).json({ error: 'Missing userId or itemId' });
    }

    const db = await getDb();
    const favId = `${userId}_${itemId}`;

    const existing = await db.collection('favorites').findOne({ _id: favId });

    if (existing) {
      await db.collection('favorites').deleteOne({ _id: favId });
      return res.status(200).json({ favorited: false });
    } else {
      await db.collection('favorites').updateOne(
        { _id: favId },
        {
          $set: {
            userId,
            itemId,
            itemType,
            addedAt: new Date(),
          },
        },
        { upsert: true }
      );
      return res.status(200).json({ favorited: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}

import { getDb } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;
    const db = await getDb();
    
    const result = await db.collection('manga').updateOne(
      { slug },
      { $inc: { views: 1 } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Manga not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error incrementing manga views:', error);
    return res.status(500).json({ error: 'Failed to increment views' });
  }
}

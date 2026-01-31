import { getDb } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const db = await getDb();
    
    const result = await db.collection('blogs').updateMany(
      { authorId: id },
      { $set: { hidden: false } }
    );

    return res.status(200).json({ success: true, count: result.modifiedCount });
  } catch (error) {
    console.error('Error unhiding user posts:', error);
    return res.status(500).json({ error: 'Failed to unhide posts' });
  }
}

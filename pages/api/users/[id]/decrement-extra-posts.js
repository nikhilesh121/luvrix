import { getDb } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const db = await getDb();
    
    // First check if user has extra posts
    const user = await db.collection('users').findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if ((user.extraPosts || 0) <= 0) {
      return res.status(400).json({ error: 'No extra posts available' });
    }

    const result = await db.collection('users').updateOne(
      { _id: id },
      { $inc: { extraPosts: -1 } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error decrementing extra posts:', error);
    return res.status(500).json({ error: 'Failed to decrement extra posts' });
  }
}

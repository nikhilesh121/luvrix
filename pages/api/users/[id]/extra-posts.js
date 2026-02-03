import { getDb } from '../../../../lib/mongodb';
import { withCSRFProtection } from '../../../../lib/csrf';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { posts } = req.body;

    if (typeof posts !== 'number' || posts < 0) {
      return res.status(400).json({ error: 'Invalid posts value' });
    }

    const db = await getDb();
    
    const result = await db.collection('users').updateOne(
      { _id: id },
      { 
        $inc: { extraPosts: posts },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ success: true, message: `Added ${posts} extra posts` });
  } catch (error) {
    console.error('Error adding extra posts:', error);
    return res.status(500).json({ error: 'Failed to add extra posts' });
  }
}

export default withCSRFProtection(handler);

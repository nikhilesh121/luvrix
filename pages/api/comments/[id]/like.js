import { likeComment, getDb, toObjectId } from '../../../../lib/db';
import { withCSRFProtection } from '../../../../lib/csrf';

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'POST') {
      await likeComment(id);
      // Return updated like count for real-time updates
      const db = await getDb();
      const comment = await db.collection('comments').findOne({ _id: toObjectId(id) });
      return res.status(200).json({ success: true, likes: comment?.likes || 0 });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Like comment API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withCSRFProtection(handler);

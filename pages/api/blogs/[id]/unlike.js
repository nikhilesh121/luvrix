import { unlikeBlog, getBlog } from '../../../../lib/db';
import { getDb } from '../../../../lib/mongodb';
import { withCSRFProtection } from '../../../../lib/csrf';
import { NOTIFICATION_TYPES } from '../../../../lib/notifications';

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'POST') {
      const { userId } = req.body;
      await unlikeBlog(userId, id);
      const blog = await getBlog(id);

      // Delete the like notification (Instagram-style: unlike = remove notification)
      if (blog && blog.authorId && blog.authorId !== userId) {
        const db = await getDb();
        await db.collection('notifications').deleteMany({
          userId: blog.authorId,
          type: NOTIFICATION_TYPES.BLOG_LIKED,
          fromUserId: userId,
          'metadata.blogId': id,
        });
      }

      return res.status(200).json({ 
        success: true, 
        likes: Math.max(0, blog?.likes || 0),
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Unlike blog API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withCSRFProtection(handler);

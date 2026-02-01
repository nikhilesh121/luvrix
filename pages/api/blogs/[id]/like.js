import { likeBlog, getBlog } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'POST') {
      const { userId } = req.body;
      await likeBlog(id, userId);
      // Return updated like count for real-time updates
      const blog = await getBlog(id);
      return res.status(200).json({ 
        success: true, 
        likes: blog?.likes?.length || 0,
        likedBy: blog?.likes || []
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Like blog API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

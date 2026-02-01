import { incrementBlogViews, getBlog } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'POST') {
      await incrementBlogViews(id);
      // Return updated view count for real-time updates
      const blog = await getBlog(id);
      return res.status(200).json({ success: true, views: blog?.views || 0 });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Increment views API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

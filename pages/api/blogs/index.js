import { getAllBlogs, getUserBlogs, createBlog } from '../../../lib/db';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (req.method === 'GET') {
      const { status, userId, all } = req.query;
      
      if (userId) {
        const blogs = await getUserBlogs(userId, status);
        return res.status(200).json(blogs);
      }
      
      // If all=true, fetch all blogs regardless of status (for admin)
      // Otherwise filter by status (default to 'approved' for public)
      const statusFilter = all === 'true' ? null : (status || 'approved');
      const blogs = await getAllBlogs(statusFilter, true, 500);
      return res.status(200).json(blogs);
    }
    
    if (req.method === 'POST') {
      const blogId = await createBlog(req.body);
      return res.status(201).json({ success: true, id: blogId });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Blogs API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

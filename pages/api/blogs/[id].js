import { getBlog, updateBlog, deleteBlog } from '../../../lib/db';
import { withCSRFProtection } from '../../../lib/csrf';

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const { id } = req.query;
  
  try {
    if (req.method === 'GET') {
      const blog = await getBlog(id);
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
      return res.status(200).json(blog);
    }
    
    if (req.method === 'PUT') {
      // Clean up data before update - convert Date strings and remove undefined
      const cleanData = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined) {
          // Convert date strings to Date objects
          if (key.includes('At') || key.includes('Date')) {
            cleanData[key] = value ? new Date(value) : null;
          } else {
            cleanData[key] = value;
          }
        }
      }
      
      const updated = await updateBlog(id, cleanData);
      if (!updated) {
        return res.status(404).json({ error: 'Blog not found or update failed' });
      }
      return res.status(200).json({ success: true, message: 'Blog updated successfully' });
    }
    
    if (req.method === 'DELETE') {
      await deleteBlog(id);
      return res.status(200).json({ success: true, message: 'Blog deleted successfully' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Blog API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withCSRFProtection(handler);

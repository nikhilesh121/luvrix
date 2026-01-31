import { incrementBlogViews } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'POST') {
      await incrementBlogViews(id);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Increment views API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

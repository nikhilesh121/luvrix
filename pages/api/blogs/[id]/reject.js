import { rejectBlog } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'POST') {
      const { reason } = req.body;
      await rejectBlog(id, reason);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Reject blog API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import { getComments, createComment } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { targetId, targetType } = req.query;
      const comments = await getComments(targetId, targetType || 'blog');
      return res.status(200).json(comments);
    }
    
    if (req.method === 'POST') {
      const comment = await createComment(req.body);
      return res.status(201).json(comment);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Comments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

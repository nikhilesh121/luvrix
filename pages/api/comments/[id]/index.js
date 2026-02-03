import { deleteComment } from '../../../../lib/db';
import { withCSRFProtection } from '../../../../lib/csrf';

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'DELETE') {
      await deleteComment(id);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Delete comment API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withCSRFProtection(handler);

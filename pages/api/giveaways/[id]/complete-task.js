import { verifyToken } from '../../../../lib/auth';
import { completeTask } from '../../../../lib/giveaway';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Please log in' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'Task ID is required' });

    const result = await completeTask(id, decoded.uid, taskId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Complete task error:', error);
    const status = error.message?.includes('not found') ? 404
      : error.message?.includes('already completed') ? 409
      : error.message?.includes('Not a participant') ? 403 : 500;
    return res.status(status).json({ error: error.message || 'Internal server error' });
  }
}

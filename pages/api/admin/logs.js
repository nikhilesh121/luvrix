import { getLogs, createLog } from '../../../lib/db';
import { withAdmin } from '../../../lib/auth';
import { withRateLimit } from '../../../lib/rateLimit';

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const logs = await getLogs();
      return res.status(200).json(logs);
    }
    
    if (req.method === 'POST') {
      const log = await createLog(req.body);
      return res.status(201).json(log);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Logs API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAdmin(withRateLimit(handler, 'admin'));

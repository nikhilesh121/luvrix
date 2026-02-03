import { completeReferral } from '../../../lib/db';
import { withCSRFProtection } from '../../../lib/csrf';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { referredId } = req.body;
    
    if (!referredId) {
      return res.status(400).json({ error: 'Referred user ID required' });
    }
    
    const completed = await completeReferral(referredId);
    
    return res.status(200).json({ success: completed });
  } catch (error) {
    console.error('Complete referral error:', error);
    return res.status(500).json({ error: 'Failed to complete referral' });
  }
}

export default withCSRFProtection(handler);

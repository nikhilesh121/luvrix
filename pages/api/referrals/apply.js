import { getReferralByCode, createReferral } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, referredId } = req.body;
    
    if (!code || !referredId) {
      return res.status(400).json({ error: 'Code and referred user ID required' });
    }
    
    // Find referrer by code
    const referrer = await getReferralByCode(code);
    
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }
    
    // Cannot refer yourself
    if (referrer.id === referredId) {
      return res.status(400).json({ error: 'Cannot use your own referral code' });
    }
    
    // Create referral
    const referralId = await createReferral(referrer.id, referredId);
    
    if (!referralId) {
      return res.status(400).json({ error: 'Referral already exists for this user' });
    }
    
    return res.status(200).json({ success: true, referralId });
  } catch (error) {
    console.error('Apply referral error:', error);
    return res.status(500).json({ error: 'Failed to apply referral' });
  }
}

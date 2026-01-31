import { getReferralSettings, updateReferralSettings } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const settings = await getReferralSettings();
      return res.status(200).json(settings);
    }
    
    if (req.method === 'PUT') {
      await updateReferralSettings(req.body);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Referral settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

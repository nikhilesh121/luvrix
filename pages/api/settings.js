import { getSettings, updateSettings } from '../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const settings = await getSettings();
      return res.status(200).json(settings || {});
    }
    
    if (req.method === 'PUT') {
      await updateSettings(req.body);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

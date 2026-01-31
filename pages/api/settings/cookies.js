import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const db = await getDb();
    
    if (req.method === 'GET') {
      const settings = await db.collection('settings').findOne({ type: 'cookies' });
      return res.status(200).json(settings || { 
        enabled: true, 
        message: 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.',
        buttonText: 'Accept',
        showDecline: true
      });
    }
    
    if (req.method === 'PUT') {
      const { enabled, message, buttonText, showDecline } = req.body;
      
      await db.collection('settings').updateOne(
        { type: 'cookies' },
        { 
          $set: { 
            type: 'cookies',
            enabled: enabled ?? true,
            message: message || 'We use cookies to enhance your browsing experience.',
            buttonText: buttonText || 'Accept',
            showDecline: showDecline ?? true,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Cookie settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import { getAllSubscribers, addSubscriber } from '../../../lib/db';
import { withCSRFProtection } from '../../../lib/csrf';

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const subscribers = await getAllSubscribers();
      return res.status(200).json(subscribers);
    }
    
    if (req.method === 'POST') {
      const { email } = req.body;
      const subscriber = await addSubscriber(email);
      return res.status(201).json(subscriber);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Subscribers API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withCSRFProtection(handler);

import { getAllUsers, getPublishers } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { publishers } = req.query;
      
      if (publishers === 'true') {
        const users = await getPublishers();
        return res.status(200).json(users);
      }
      
      const users = await getAllUsers();
      return res.status(200).json(users);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import { getFollowing } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'GET') {
      const following = await getFollowing(id);
      return res.status(200).json(following);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Following API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

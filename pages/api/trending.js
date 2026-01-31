import { getTrendingTopics } from '../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const topics = await getTrendingTopics();
      return res.status(200).json(topics);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Trending API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

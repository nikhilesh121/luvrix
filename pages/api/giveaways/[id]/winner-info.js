import { getWinnerInfo } from '../../../../lib/giveaway';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const winner = await getWinnerInfo(id);
    return res.status(200).json(winner || { name: null });
  } catch (error) {
    console.error('Winner info error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

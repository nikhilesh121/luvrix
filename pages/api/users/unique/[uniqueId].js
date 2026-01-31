import { getDb } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uniqueId } = req.query;
    const db = await getDb();
    
    const user = await db.collection('users').findOne({ uniqueId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { password, ...safeUser } = user;
    
    return res.status(200).json({ id: user._id, ...safeUser });
  } catch (error) {
    console.error('Error fetching user by uniqueId:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

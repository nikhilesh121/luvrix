import { getUserLibraries, createLibrary } from '../../../lib/db';
import { withCSRFProtection } from '../../../lib/csrf';

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }
      const libraries = await getUserLibraries(userId);
      return res.status(200).json(libraries);
    }
    
    if (req.method === 'POST') {
      const { userId, name, description, isPublic } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Library name is required' });
      }
      const library = await createLibrary(userId, { name: name.trim(), description, isPublic });
      return res.status(201).json({ id: library, success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Libraries API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withCSRFProtection(handler);

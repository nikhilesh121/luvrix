import { getAllManga, createManga } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const manga = await getAllManga();
      return res.status(200).json(manga);
    }

    if (req.method === 'POST') {
      const data = req.body || {};
      if (!data.title || !data.slug) {
        return res.status(400).json({ error: 'Title and slug are required' });
      }

      const id = await createManga(data);
      return res.status(201).json({ id });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Manga API error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}

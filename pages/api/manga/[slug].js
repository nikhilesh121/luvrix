import { getMangaBySlug } from '../../../lib/db';

export default async function handler(req, res) {
  const { slug } = req.query;
  
  try {
    if (req.method === 'GET') {
      const manga = await getMangaBySlug(slug);
      if (!manga) {
        return res.status(404).json({ error: 'Manga not found' });
      }
      return res.status(200).json(manga);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Manga API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

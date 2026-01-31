import { getBlogDrafts, createBlogDraft } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const drafts = await getBlogDrafts();
      return res.status(200).json(drafts);
    }
    
    if (req.method === 'POST') {
      const draft = await createBlogDraft(req.body);
      return res.status(201).json(draft);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Drafts API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

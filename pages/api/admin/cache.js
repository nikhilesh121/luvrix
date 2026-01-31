import { getDb } from '../../../lib/mongodb';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;
    const results = [];

    if (action === 'all' || action === 'next') {
      // Clear Next.js cache
      const nextCachePath = path.join(process.cwd(), '.next', 'cache');
      if (fs.existsSync(nextCachePath)) {
        fs.rmSync(nextCachePath, { recursive: true, force: true });
        results.push('Next.js cache cleared');
      } else {
        results.push('Next.js cache already empty');
      }
    }

    if (action === 'all' || action === 'api') {
      // Clear any API cache (stored in MongoDB)
      const db = await getDb();
      await db.collection('apiCache').deleteMany({});
      results.push('API cache cleared');
    }

    if (action === 'all' || action === 'sessions') {
      // Clear expired password reset tokens
      const db = await getDb();
      const deleted = await db.collection('passwordResets').deleteMany({
        expiresAt: { $lt: new Date() }
      });
      results.push(`${deleted.deletedCount} expired tokens cleared`);
    }

    if (action === 'all' || action === 'temp') {
      // Clear temp files
      const tempPath = path.join(process.cwd(), 'tmp');
      if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { recursive: true, force: true });
        fs.mkdirSync(tempPath, { recursive: true });
        results.push('Temp files cleared');
      }
    }

    // Log the cache clear action
    const db = await getDb();
    await db.collection('logs').insertOne({
      type: 'cache_clear',
      action,
      results,
      timestamp: new Date(),
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Cache cleared successfully',
      results 
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return res.status(500).json({ error: 'Failed to clear cache' });
  }
}

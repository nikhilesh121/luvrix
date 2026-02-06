import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, seconds } = req.body;
    if (!path || !seconds || seconds < 1) {
      return res.status(400).json({ error: 'path and seconds required' });
    }

    // Cap at 30 minutes to prevent bad data
    const cappedSeconds = Math.min(Math.round(seconds), 1800);

    const db = await getDb();
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const sessionKey = `${ip}_${path}`;

    // Upsert: update if same session+path exists within last 30 min, otherwise insert
    await db.collection('watchtime').updateOne(
      {
        sessionKey,
        updatedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
      {
        $set: {
          path,
          seconds: cappedSeconds,
          ip,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          sessionKey,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Watch time API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

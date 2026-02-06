import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const db = await getDb();

      // Get real counts in parallel
      const [usersCount, blogsCount, totalViews] = await Promise.all([
        // Count all registered users (writers)
        db.collection('users').countDocuments({}),
        // Count approved blogs
        db.collection('blogs').countDocuments({ status: 'approved' }),
        // Sum all blog views for total readers
        db.collection('blogs').aggregate([
          { $match: { status: 'approved' } },
          { $group: { _id: null, total: { $sum: { $ifNull: ['$views', 0] } } } },
        ]).toArray(),
      ]);

      // Get site_stats doc for tracked visitor count
      const siteStats = await db.collection('site_stats').findOne({ _id: 'global' });
      const trackedReaders = siteStats?.totalVisitors || 0;
      const blogViews = totalViews[0]?.total || 0;

      // Readers = max of tracked unique visitors or total blog views
      const readers = Math.max(trackedReaders, blogViews);

      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({
        readers,
        writers: usersCount,
        articles: blogsCount,
      });
    } catch (error) {
      console.error('Platform stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  // POST - track a visitor (called from client)
  if (req.method === 'POST') {
    try {
      const db = await getDb();
      const forwarded = req.headers['x-forwarded-for'];
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
      const ua = req.headers['user-agent'] || '';
      const fingerprint = `${ip}_${ua.slice(0, 50)}`;

      // Upsert visitor - only count unique per day
      const today = new Date().toISOString().split('T')[0];
      const visitorKey = `${fingerprint}_${today}`;

      const result = await db.collection('visitors').updateOne(
        { _id: visitorKey },
        {
          $setOnInsert: {
            _id: visitorKey,
            ip,
            date: today,
            createdAt: new Date(),
          },
          $set: { lastSeen: new Date() },
        },
        { upsert: true }
      );

      // If new visitor today, increment global counter
      if (result.upsertedCount > 0) {
        await db.collection('site_stats').updateOne(
          { _id: 'global' },
          {
            $inc: { totalVisitors: 1, [`daily.${today}`]: 1 },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
      }

      return res.status(200).json({ tracked: true });
    } catch (error) {
      console.error('Track visitor error:', error);
      return res.status(200).json({ tracked: false });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

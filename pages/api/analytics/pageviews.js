import { getDb } from '../../../lib/mongodb';
import { withRateLimit } from '../../../lib/rateLimit';

const BOT_UA = /bot|crawl|spider|slurp|bingbot|googlebot|yandex|baidu|duckduck|semrush|ahref|lighthouse|pagespeed|headless|phantom|selenium/i;

async function handler(req, res) {
  const db = await getDb();

  try {
    // POST: Log a page view
    if (req.method === 'POST') {
      const { path, referrer, userAgent } = req.body;
      if (!path) return res.status(400).json({ error: 'path required' });

      // Exclude bots from pageview tracking
      const ua = req.headers['user-agent'] || '';
      if (BOT_UA.test(ua)) {
        return res.status(200).json({ ok: true, skipped: 'bot' });
      }

      await db.collection('pageviews').insertOne({
        path,
        referrer: referrer || null,
        userAgent: userAgent || null,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
        timestamp: new Date(),
      });

      return res.status(200).json({ ok: true });
    }

    // GET: Query aggregated page views (admin only)
    if (req.method === 'GET') {
      const { range = '7d' } = req.query;

      let startDate;
      const now = new Date();
      if (range === '1d' || range === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (range === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Daily views aggregation
      const dailyViews = await db.collection('pageviews').aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
            },
            views: { $sum: 1 },
            uniqueIPs: { $addToSet: '$ip' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            views: 1,
            uniqueVisitors: { $size: '$uniqueIPs' },
            _id: 0,
          },
        },
      ]).toArray();

      // Top pages
      const topPages = await db.collection('pageviews').aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$path', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { path: '$_id', views: 1, _id: 0 } },
      ]).toArray();

      // Total counts
      const totalViews = await db.collection('pageviews').countDocuments({ timestamp: { $gte: startDate } });

      // Unique visitors (by IP)
      const uniqueVisitors = await db.collection('pageviews').aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$ip' } },
        { $count: 'total' },
      ]).toArray();

      // Bounce rate: sessions (by IP) with only 1 pageview
      const bounceData = await db.collection('pageviews').aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$ip', pageCount: { $sum: 1 } } },
        { $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bounceSessions: { $sum: { $cond: [{ $eq: ['$pageCount', 1] }, 1, 0] } },
        }},
      ]).toArray();

      const totalSessions = bounceData[0]?.totalSessions || 0;
      const bounceSessions = bounceData[0]?.bounceSessions || 0;
      const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

      // Average session duration from watchtime collection
      const sessionDuration = await db.collection('watchtime').aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$ip', totalSeconds: { $sum: '$seconds' } } },
        { $group: { _id: null, avgSeconds: { $avg: '$totalSeconds' } } },
      ]).toArray();

      const avgSessionDuration = Math.round(sessionDuration[0]?.avgSeconds || 0);

      // Pagination for topPages
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      return res.status(200).json({
        dailyViews,
        topPages,
        totalViews,
        uniqueVisitors: uniqueVisitors[0]?.total || 0,
        bounceRate,
        avgSessionDuration,
        range,
        startDate: startDate.toISOString(),
        pagination: { page, limit },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Analytics pageviews error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withRateLimit(handler, 'content');

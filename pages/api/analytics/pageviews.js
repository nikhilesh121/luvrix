import { getDb } from "../../../lib/mongodb";
import { withRateLimit } from "../../../lib/rateLimit";
import { ObjectId } from "mongodb";

const BOT_UA = /bot|crawl|spider|slurp|bingbot|googlebot|yandex|baidu|duckduck|semrush|ahref|lighthouse|pagespeed|headless|phantom|selenium/i;
const THROTTLE_MS = 30 * 60 * 1000; // 30 minutes

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function toObjectId(id) {
  try { return new ObjectId(id); } catch { return id; }
}

async function handler(req, res) {
  const db = await getDb();

  try {
    // POST: Log a page view with 30-min IP throttle + content view increments
    if (req.method === "POST") {
      const { path, referrer, slug, contentType, contentId } = req.body;
      if (!path) return res.status(400).json({ error: "path required" });

      const ua = req.headers["user-agent"] || "";
      if (BOT_UA.test(ua)) {
        return res.status(200).json({ ok: true, skipped: "bot" });
      }

      const ip = getClientIP(req);
      const visitorId = req.cookies?.vid || req.body.vid || ip;
      const now = new Date();
      const throttleCutoff = new Date(now.getTime() - THROTTLE_MS);

      // 30-minute IP + cookie throttle — prevent duplicate counts
      const recentView = await db.collection("pageviews").findOne({
        path,
        $or: [{ ip }, { visitorId }],
        timestamp: { $gte: throttleCutoff },
      });

      if (recentView) {
        return res.status(200).json({ ok: true, skipped: "throttled" });
      }

      // Insert pageview record
      const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
      await db.collection("pageviews").insertOne({
        path,
        slug: slug || null,
        contentType: contentType || null,
        contentId: contentId || null,
        referrer: referrer || null,
        ip,
        visitorId,
        day: today,
        timestamp: now,
      });

      // Increment daily aggregated count for analytics graph
      await db.collection("daily_views").updateOne(
        { day: today },
        { $inc: { views: 1, [`paths.${path.replace(/\./g, "_")}`]: 1 } },
        { upsert: true }
      );

      // Auto-increment views on content models
      if (contentType && contentId) {
        const collectionMap = { blog: "blogs", manga: "manga", giveaway: "giveaways" };
        const collection = collectionMap[contentType];
        if (collection) {
          const objId = toObjectId(contentId);
          await db.collection(collection).updateOne(
            { $or: [{ _id: objId }, { slug: slug }] },
            { $inc: { views: 1 } }
          ).catch(() => {});
        }
      }

      return res.status(200).json({ ok: true, counted: true });
    }

    // GET: Query aggregated page views (admin)
    if (req.method === "GET") {
      const { range = "7d", type } = req.query;

      let startDate;
      const now = new Date();
      if (range === "1d" || range === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (range === "7d") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === "30d") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (range === "90d") {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const matchFilter = { timestamp: { $gte: startDate } };
      if (type) matchFilter.contentType = type;

      // Daily views aggregation
      const dailyViews = await db.collection("pageviews").aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            views: { $sum: 1 },
            uniqueIPs: { $addToSet: "$ip" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            views: 1,
            uniqueVisitors: { $size: "$uniqueIPs" },
            _id: 0,
          },
        },
      ]).toArray();

      // Top pages
      const topPages = await db.collection("pageviews").aggregate([
        { $match: matchFilter },
        { $group: { _id: "$path", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { path: "$_id", views: 1, _id: 0 } },
      ]).toArray();

      // Top 10 blogs by views
      const topBlogs = await db.collection("pageviews").aggregate([
        { $match: { ...matchFilter, contentType: "blog" } },
        { $group: { _id: "$slug", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { slug: "$_id", views: 1, _id: 0 } },
      ]).toArray();

      // Top 10 manga by views
      const topManga = await db.collection("pageviews").aggregate([
        { $match: { ...matchFilter, contentType: "manga" } },
        { $group: { _id: "$slug", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { slug: "$_id", views: 1, _id: 0 } },
      ]).toArray();

      // Top 10 giveaways by views
      const topGiveaways = await db.collection("pageviews").aggregate([
        { $match: { ...matchFilter, contentType: "giveaway" } },
        { $group: { _id: "$slug", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { slug: "$_id", views: 1, _id: 0 } },
      ]).toArray();

      // Total counts
      const totalViews = await db.collection("pageviews").countDocuments(matchFilter);

      // Unique visitors (by IP)
      const uniqueVisitors = await db.collection("pageviews").aggregate([
        { $match: matchFilter },
        { $group: { _id: "$ip" } },
        { $count: "total" },
      ]).toArray();

      // Bounce rate
      const bounceData = await db.collection("pageviews").aggregate([
        { $match: matchFilter },
        { $group: { _id: "$ip", pageCount: { $sum: 1 } } },
        { $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bounceSessions: { $sum: { $cond: [{ $eq: ["$pageCount", 1] }, 1, 0] } },
        }},
      ]).toArray();

      const totalSessions = bounceData[0]?.totalSessions || 0;
      const bounceSessions = bounceData[0]?.bounceSessions || 0;
      const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

      // Average session duration from watchtime collection
      const sessionDuration = await db.collection("watchtime").aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$ip", totalSeconds: { $sum: "$seconds" } } },
        { $group: { _id: null, avgSeconds: { $avg: "$totalSeconds" } } },
      ]).toArray();

      const avgSessionDuration = Math.round(sessionDuration[0]?.avgSeconds || 0);

      return res.status(200).json({
        dailyViews,
        topPages,
        topBlogs,
        topManga,
        topGiveaways,
        totalViews,
        uniqueVisitors: uniqueVisitors[0]?.total || 0,
        bounceRate,
        avgSessionDuration,
        range,
        startDate: startDate.toISOString(),
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Analytics pageviews error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withRateLimit(handler, "content");

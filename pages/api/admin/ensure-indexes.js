// Admin-only endpoint to ensure MongoDB indexes for performance
import { getDb } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = await getDb();
    const results = [];

    // Blogs indexes
    await db.collection("blogs").createIndex({ slug: 1 }, { unique: true, sparse: true });
    await db.collection("blogs").createIndex({ status: 1, updatedAt: -1 });
    await db.collection("blogs").createIndex({ status: 1, createdAt: -1 });
    await db.collection("blogs").createIndex({ views: -1 });
    await db.collection("blogs").createIndex({ authorId: 1, status: 1 });
    await db.collection("blogs").createIndex({ category: 1, status: 1 });
    results.push({ collection: "blogs", indexes: 6 });

    // Manga indexes
    await db.collection("manga").createIndex({ slug: 1 }, { unique: true, sparse: true });
    await db.collection("manga").createIndex({ status: 1, updatedAt: -1 });
    await db.collection("manga").createIndex({ views: -1 });
    await db.collection("manga").createIndex({ createdAt: -1 });
    results.push({ collection: "manga", indexes: 4 });

    // Giveaways indexes
    await db.collection("giveaways").createIndex({ slug: 1 }, { unique: true, sparse: true });
    await db.collection("giveaways").createIndex({ status: 1, updatedAt: -1 });
    await db.collection("giveaways").createIndex({ views: -1 });
    results.push({ collection: "giveaways", indexes: 3 });

    // Pageviews indexes (critical for analytics performance)
    await db.collection("pageviews").createIndex({ timestamp: -1 });
    await db.collection("pageviews").createIndex({ path: 1, ip: 1, timestamp: -1 });
    await db.collection("pageviews").createIndex({ path: 1, visitorId: 1, timestamp: -1 });
    await db.collection("pageviews").createIndex({ contentType: 1, slug: 1, timestamp: -1 });
    await db.collection("pageviews").createIndex({ day: 1 });
    results.push({ collection: "pageviews", indexes: 5 });

    // Daily views indexes
    await db.collection("daily_views").createIndex({ day: 1 }, { unique: true });
    results.push({ collection: "daily_views", indexes: 1 });

    // Watchtime indexes
    await db.collection("watchtime").createIndex({ createdAt: -1 });
    await db.collection("watchtime").createIndex({ ip: 1, createdAt: -1 });
    results.push({ collection: "watchtime", indexes: 2 });

    // Index requests log
    await db.collection("index_requests").createIndex({ createdAt: -1 });
    results.push({ collection: "index_requests", indexes: 1 });

    // Users indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection("users").createIndex({ uniqueId: 1 }, { unique: true, sparse: true });
    results.push({ collection: "users", indexes: 2 });

    // Sitemap collection indexes
    await db.collection("sitemap").createIndex({ url: 1 }, { unique: true });
    await db.collection("sitemap").createIndex({ type: 1 });
    results.push({ collection: "sitemap", indexes: 2 });

    const totalIndexes = results.reduce((sum, r) => sum + r.indexes, 0);

    return res.status(200).json({
      success: true,
      message: `Created/ensured ${totalIndexes} indexes across ${results.length} collections`,
      results,
    });
  } catch (error) {
    console.error("Ensure indexes error:", error);
    return res.status(500).json({ error: error.message });
  }
}

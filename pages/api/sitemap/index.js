// Dynamic Sitemap Index — fetches real lastmod from DB per sub-sitemap
import { getDb } from "../../../lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

function toISO(d) {
  if (!d) return new Date().toISOString();
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader("X-Accel-Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex");

  try {
    const db = await getDb();

    // Fetch settings for sitemap toggles
    const settings = await db.collection("settings").findOne(
      { _id: "main" },
      { projection: { sitemapIncludeManga: 1, sitemapIncludeCategories: 1, sitemapIncludeGiveaways: 1 } }
    );
    const includeManga = settings?.sitemapIncludeManga !== false;
    const includeCategories = settings?.sitemapIncludeCategories !== false;
    const includeGiveaways = settings?.sitemapIncludeGiveaways !== false;

    // Get latest updatedAt per collection for accurate <lastmod>
    const [latestBlog, latestManga, latestGiveaway] = await Promise.all([
      db.collection("blogs").find({ status: { $nin: ["draft", "pending", "hidden", "rejected", "deleted"] } }).sort({ updatedAt: -1 }).limit(1).project({ updatedAt: 1 }).toArray(),
      includeManga ? db.collection("manga").find({ status: { $nin: ["draft", "private"] } }).sort({ updatedAt: -1 }).limit(1).project({ updatedAt: 1 }).toArray() : [],
      includeGiveaways ? db.collection("giveaways").find({ status: { $ne: "draft" } }).sort({ updatedAt: -1 }).limit(1).project({ updatedAt: 1 }).toArray() : [],
    ]);

    const sitemaps = [];

    // Always include pages
    sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`);

    // Posts (blogs)
    sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/sitemap-posts.xml</loc>
    <lastmod>${toISO(latestBlog[0]?.updatedAt)}</lastmod>
  </sitemap>`);

    // Manga
    if (includeManga) {
      sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/sitemap-manga.xml</loc>
    <lastmod>${toISO(latestManga[0]?.updatedAt)}</lastmod>
  </sitemap>`);
    }

    // Categories
    if (includeCategories) {
      sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/sitemap-categories.xml</loc>
    <lastmod>${toISO(latestBlog[0]?.updatedAt)}</lastmod>
  </sitemap>`);
    }

    // Giveaways
    if (includeGiveaways) {
      sitemaps.push(`  <sitemap>
    <loc>${SITE_URL}/sitemap-giveaways.xml</loc>
    <lastmod>${toISO(latestGiveaway[0]?.updatedAt)}</lastmod>
  </sitemap>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join("\n")}
</sitemapindex>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap index error:", error);
    res.status(500).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></sitemapindex>");
  }
}

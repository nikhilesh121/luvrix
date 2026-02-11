// Dynamic SSR sitemap index — served at /sitemaps/
// References sub-sitemap URLs at /sitemaps/posts/, /sitemaps/manga/, etc.
import { getDb } from "../../lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

function toISO(d) {
  if (!d) return new Date().toISOString();
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

export default function SitemapIndex() {
  return null;
}

export async function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Cloudflare-CDN-Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");

  try {
    const db = await getDb();

    const settings = await db.collection("settings").findOne(
      { _id: "main" },
      { projection: { sitemapIncludeManga: 1, sitemapIncludeCategories: 1, sitemapIncludeGiveaways: 1 } }
    );
    const includeManga = settings?.sitemapIncludeManga !== false;
    const includeCategories = settings?.sitemapIncludeCategories !== false;
    const includeGiveaways = settings?.sitemapIncludeGiveaways !== false;

    const [latestBlog, latestManga, latestGiveaway] = await Promise.all([
      db.collection("blogs").find({ status: { $nin: ["draft", "pending", "hidden", "rejected", "deleted"] } }).sort({ updatedAt: -1 }).limit(1).project({ updatedAt: 1 }).toArray(),
      includeManga ? db.collection("manga").find({ status: { $nin: ["draft", "private"] } }).sort({ updatedAt: -1 }).limit(1).project({ updatedAt: 1 }).toArray() : [],
      includeGiveaways ? db.collection("giveaways").find({ status: { $ne: "draft" } }).sort({ updatedAt: -1 }).limit(1).project({ updatedAt: 1 }).toArray() : [],
    ]);

    const sitemaps = [];

    sitemaps.push(`  <sitemap>\n    <loc>${SITE_URL}/sitemaps/pages/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>`);
    sitemaps.push(`  <sitemap>\n    <loc>${SITE_URL}/sitemaps/posts/</loc>\n    <lastmod>${toISO(latestBlog[0]?.updatedAt)}</lastmod>\n  </sitemap>`);

    if (includeManga) {
      sitemaps.push(`  <sitemap>\n    <loc>${SITE_URL}/sitemaps/manga/</loc>\n    <lastmod>${toISO(latestManga[0]?.updatedAt)}</lastmod>\n  </sitemap>`);
    }
    if (includeCategories) {
      sitemaps.push(`  <sitemap>\n    <loc>${SITE_URL}/sitemaps/categories/</loc>\n    <lastmod>${toISO(latestBlog[0]?.updatedAt)}</lastmod>\n  </sitemap>`);
    }
    if (includeGiveaways) {
      sitemaps.push(`  <sitemap>\n    <loc>${SITE_URL}/sitemaps/giveaways/</loc>\n    <lastmod>${toISO(latestGiveaway[0]?.updatedAt)}</lastmod>\n  </sitemap>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.join("\n")}\n</sitemapindex>`;

    res.write(xml);
    res.end();
  } catch (error) {
    console.error("Sitemap index error:", error);
    res.statusCode = 500;
    res.write(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`);
    res.end();
  }

  return { props: {} };
}

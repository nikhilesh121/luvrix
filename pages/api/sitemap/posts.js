// Dynamic Posts Sitemap — lean DB query with projection, auto-split at 50k
import { getDb } from "../../../lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";
const MAX_URLS = 50000;

function escapeXml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function toISO(d) {
  if (!d) return new Date().toISOString();
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    const db = await getDb();
    const page = parseInt(req.query.page) || 1;

    const blogs = await db.collection("blogs")
      .find({ status: "approved" })
      .project({ slug: 1, updatedAt: 1, createdAt: 1 })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * MAX_URLS)
      .limit(MAX_URLS)
      .toArray();

    const seen = new Set();
    const urls = [];
    for (const blog of blogs) {
      if (!blog.slug || seen.has(blog.slug)) continue;
      seen.add(blog.slug);
      urls.push(`  <url>
    <loc>${escapeXml(SITE_URL)}/blog/${escapeXml(blog.slug)}</loc>
    <lastmod>${toISO(blog.updatedAt || blog.createdAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap posts error:", error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}

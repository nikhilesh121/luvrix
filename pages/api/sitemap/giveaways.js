// Dynamic Giveaways Sitemap — lean DB query with projection, no-store cache
import { getDb } from "../../../lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

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
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader("X-Accel-Expires", "0");

  try {
    const db = await getDb();

    const giveaways = await db.collection("giveaways")
      .find({ status: { $ne: "draft" } })
      .project({ slug: 1, status: 1, updatedAt: 1, createdAt: 1 })
      .sort({ updatedAt: -1 })
      .toArray();

    const seen = new Set();
    const urls = [];

    // Giveaway index page
    urls.push(`  <url>
    <loc>${escapeXml(SITE_URL)}/giveaway</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);

    for (const g of giveaways) {
      if (!g.slug || seen.has(g.slug)) continue;
      seen.add(g.slug);
      const priority = g.status === "active" ? "0.9" : "0.6";
      const changefreq = g.status === "active" ? "daily" : "weekly";
      urls.push(`  <url>
    <loc>${escapeXml(SITE_URL)}/giveaway/${escapeXml(g.slug)}</loc>
    <lastmod>${toISO(g.updatedAt || g.createdAt)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap giveaways error:", error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}

// Dynamic Categories Sitemap — fetches distinct categories from approved blogs
import { getDb } from "../../../lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

function escapeXml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    const db = await getDb();

    // Get distinct categories from approved blogs
    const categories = await db.collection("blogs").distinct("category", { status: "approved" });

    const urls = [];

    // Main categories page
    urls.push(`  <url>
    <loc>${escapeXml(SITE_URL)}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);

    // Individual category pages (only real categories, no nulls/empties)
    for (const cat of categories) {
      if (!cat || typeof cat !== "string") continue;
      urls.push(`  <url>
    <loc>${escapeXml(SITE_URL)}/categories?category=${escapeXml(encodeURIComponent(cat))}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap categories error:", error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

function escapeXml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml");
  const noCache = req.query.nocache === "1";
  res.setHeader("Cache-Control", noCache ? "no-cache, no-store" : "public, s-maxage=60, stale-while-revalidate=300");

  // Only include the clean /categories URL — no parameter-based URLs
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(SITE_URL)}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

  res.status(200).send(xml);
}

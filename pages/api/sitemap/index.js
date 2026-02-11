// Sitemap index - references sub-sitemaps

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml");
  const noCache = req.query.nocache === "1";
  res.setHeader("Cache-Control", noCache ? "no-cache, no-store" : "public, s-maxage=60, stale-while-revalidate=300");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-posts.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-manga.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-categories.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-giveaways.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

  res.status(200).send(xml);
}

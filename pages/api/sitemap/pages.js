const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

const staticPages = [
  { url: "/", changefreq: "daily", priority: "1.0" },
  { url: "/about", changefreq: "monthly", priority: "0.8" },
  { url: "/contact", changefreq: "monthly", priority: "0.7" },
  { url: "/categories", changefreq: "weekly", priority: "0.8" },
  { url: "/manga", changefreq: "daily", priority: "0.9" },
  { url: "/giveaway", changefreq: "daily", priority: "0.8" },
  { url: "/leaderboard", changefreq: "daily", priority: "0.7" },
  { url: "/publishers", changefreq: "weekly", priority: "0.7" },
  { url: "/privacy", changefreq: "yearly", priority: "0.3" },
  { url: "/terms", changefreq: "yearly", priority: "0.3" },
  { url: "/giveaway-terms", changefreq: "yearly", priority: "0.3" },
  { url: "/policy/privacy", changefreq: "yearly", priority: "0.3" },
  { url: "/policy/terms", changefreq: "yearly", priority: "0.3" },
  { url: "/policy/disclaimer", changefreq: "yearly", priority: "0.3" },
  { url: "/policy/dmca", changefreq: "yearly", priority: "0.3" },
];

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

  const urls = staticPages.map(page => `
  <url>
    <loc>${escapeXml(SITE_URL + page.url)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.status(200).send(xml);
}

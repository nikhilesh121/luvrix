const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luvrix.com';

const categories = [
  'news',
  'anime',
  'manga',
  'technology',
  'gaming',
  'entertainment',
  'lifestyle',
  'sports',
  'business',
  'health',
];

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  const urls = categories.map(category => `
  <url>
    <loc>${escapeXml(SITE_URL)}/categories?category=${escapeXml(category)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.status(200).send(xml);
}

import { getAllManga } from '../../../lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luvrix.com';

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
  try {
    res.setHeader('Content-Type', 'application/xml');
    const noCache = req.query.nocache === '1';
    res.setHeader('Cache-Control', noCache ? 'no-cache, no-store' : 'public, s-maxage=60, stale-while-revalidate=300');

    const manga = await getAllManga();

    let urls = '';
    for (const m of manga) {
      const totalChapters = m.totalChapters || 1;
      const lastmod = m.updatedAt || m.createdAt || new Date();
      const dateStr = lastmod instanceof Date ? lastmod.toISOString() : new Date(lastmod).toISOString();
      
      for (let i = 1; i <= totalChapters; i++) {
        urls += `
  <url>
    <loc>${escapeXml(SITE_URL)}/manga/${escapeXml(m.slug)}/chapter-${i}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap chapters error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}

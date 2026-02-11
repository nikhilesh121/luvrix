import { listGiveaways } from '../../../lib/giveaway';

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

    // Get all non-draft giveaways for sitemap
    const giveaways = await listGiveaways({});
    const publicGiveaways = giveaways.filter(g => g.status !== 'draft');

    const urls = publicGiveaways.map(g => {
      const lastmod = g.updatedAt || g.createdAt || new Date();
      const dateStr = lastmod instanceof Date ? lastmod.toISOString() : new Date(lastmod).toISOString();
      const priority = g.status === 'active' ? '0.9' : '0.6';
      const changefreq = g.status === 'active' ? 'daily' : 'weekly';

      return `
  <url>
    <loc>${escapeXml(SITE_URL)}/giveaway/${escapeXml(g.slug)}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    }).join('');

    // Also include the giveaway index page
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(SITE_URL)}/giveaway</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${urls}
</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap giveaways error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}

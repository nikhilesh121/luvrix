// Chapter URLs are NO LONGER included in sitemaps.
// Chapters link directly to external sources via /manga/[slug] page.
// This endpoint returns an empty urlset for backward compatibility with
// any cached sitemap index references.
//
// Architecture decision: February 8, 2026
// See: docs/SEO_MASTER_PLAYBOOK.md → "Manga Chapter Architecture (FINAL)"

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

  res.status(200).send(xml);
}

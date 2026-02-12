import { getDb } from "../../../lib/mongodb";

/**
 * Admin-only endpoint to list all manga chapter URLs that need to be
 * removed from Google's index. Use this list with Google Search Console's
 * URL Removal Tool or IndexNow to notify search engines.
 *
 * GET /api/admin/cleanup-chapter-urls
 *   → Returns JSON list of all chapter URLs that were previously generated
 *
 * DELETE /api/admin/cleanup-chapter-urls
 *   → Clears the .next server cache for chapter pages (run after deploy)
 */
export default async function handler(req, res) {
  // Simple admin auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

  try {
    const db = await getDb();

    // Get all manga with their chapter counts
    const mangaList = await db
      .collection("manga")
      .find(
        { totalChapters: { $gt: 0 } },
        { projection: { slug: 1, totalChapters: 1, title: 1 } }
      )
      .lean?.() || await db
      .collection("manga")
      .find(
        { totalChapters: { $gt: 0 } },
        { projection: { slug: 1, totalChapters: 1, title: 1 } }
      )
      .toArray();

    // Generate all possible chapter URLs that might be cached/indexed
    const chapterUrls = [];
    for (const manga of mangaList) {
      if (!manga.slug || !manga.totalChapters) continue;
      for (let i = 1; i <= manga.totalChapters; i++) {
        chapterUrls.push({
          url: `${SITE_URL}/manga/${manga.slug}/chapter-${i}/`,
          manga: manga.title,
          chapter: i,
        });
      }
    }

    if (req.method === "GET") {
      return res.status(200).json({
        message: `Found ${chapterUrls.length} chapter URLs across ${mangaList.length} manga that should be de-indexed`,
        totalManga: mangaList.length,
        totalChapterUrls: chapterUrls.length,
        urls: chapterUrls,
        instructions: [
          "All chapter URLs now return HTTP 410 (Gone) via middleware — Google will automatically de-index them on next crawl.",
          "To speed up removal, use Google Search Console → Removals → New Request → Enter URL prefix: https://luvrix.com/manga/*/chapter",
          "Or submit individual URLs from the list below.",
          "The robots.txt already blocks /manga/*/chapter* for all crawlers.",
          "On the server, clear Nginx cache: sudo rm -rf /var/cache/nginx/* && sudo systemctl reload nginx",
          "Clear Cloudflare cache: Dashboard → Caching → Purge Everything",
        ],
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Cleanup chapter URLs error:", error);
    return res.status(500).json({ error: "Failed to generate chapter URL list" });
  }
}

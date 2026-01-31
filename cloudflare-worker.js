/**
 * Cloudflare Worker for Sitemap Proxying - luvrix.com
 * 
 * This worker intercepts sitemap requests and proxies them to Firebase Functions
 * so that the sitemaps appear to come from luvrix.com without external redirects.
 * 
 * COPY THE CODE BELOW INTO YOUR CLOUDFLARE WORKER:
 * ================================================
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const FIREBASE_BASE = 'https://us-central1-singlestore-14943.cloudfunctions.net';

    const SITEMAP_ROUTES = {
      '/sitemap.xml': `${FIREBASE_BASE}/sitemapIndex`,
      '/sitemap-pages.xml': `${FIREBASE_BASE}/sitemapPages`,
      '/sitemap-manga.xml': `${FIREBASE_BASE}/sitemapManga`,
      '/sitemap-chapters.xml': `${FIREBASE_BASE}/sitemapChapters`,
      '/sitemap-posts.xml': `${FIREBASE_BASE}/sitemapPosts`,
      '/sitemap-categories.xml': `${FIREBASE_BASE}/sitemapCategories`,
    };

    // Check if this is a sitemap request
    if (SITEMAP_ROUTES[path]) {
      try {
        const response = await fetch(SITEMAP_ROUTES[path]);
        const xml = await response.text();

        return new Response(xml, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>', {
          status: 500,
          headers: { 'Content-Type': 'application/xml' },
        });
      }
    }

    // For non-sitemap requests, pass through to origin
    return fetch(request);
  },
};

/**
 * Auto-Index Utility
 * Automatically notifies search engines when new content is published.
 * 
 * Supports:
 * - Google Sitemap Ping (free, no API key needed)
 * - Google Indexing API (if service account credentials are configured)
 * - IndexNow (Bing, Yandex, etc. — if INDEXNOW_KEY is set)
 * - Internal logging of all indexing requests
 */

import { getDb } from './mongodb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luvrix.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

/**
 * Ping Google to re-crawl the sitemap
 */
async function pingGoogleSitemap() {
  try {
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const res = await fetch(pingUrl);
    return { success: res.ok, engine: 'google_sitemap', status: res.status };
  } catch (err) {
    console.error('[auto-index] Google sitemap ping failed:', err.message);
    return { success: false, engine: 'google_sitemap', error: err.message };
  }
}

/**
 * Submit URL to IndexNow (Bing, Yandex, Seznam, Naver)
 */
async function submitIndexNow(url) {
  if (!INDEXNOW_KEY) return { success: false, engine: 'indexnow', error: 'No INDEXNOW_KEY configured' };

  try {
    const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: new URL(SITE_URL).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: [fullUrl],
      }),
    });
    return { success: res.ok || res.status === 202, engine: 'indexnow', status: res.status };
  } catch (err) {
    console.error('[auto-index] IndexNow submit failed:', err.message);
    return { success: false, engine: 'indexnow', error: err.message };
  }
}

/**
 * Submit URL via Google Indexing API (requires service account)
 * Set GOOGLE_INDEXING_CREDENTIALS env var as JSON string of service account
 */
async function submitGoogleIndexingAPI(url) {
  const credsJson = process.env.GOOGLE_INDEXING_CREDENTIALS;
  if (!credsJson) return { success: false, engine: 'google_indexing_api', error: 'No credentials configured' };

  try {
    // Dynamically require google-auth-library — skip gracefully if not installed
    // Use variable-based require to prevent webpack from resolving at build time
    let JWT;
    try {
      const pkgName = 'google-auth-library';
      const gal = typeof __webpack_require__ !== 'undefined'
        ? __non_webpack_require__(pkgName)
        : require(pkgName);
      JWT = gal.JWT;
    } catch {
      return { success: false, engine: 'google_indexing_api', error: 'google-auth-library not installed' };
    }

    const creds = JSON.parse(credsJson);
    const jwtClient = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const tokens = await jwtClient.authorize();
    const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;

    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({
        url: fullUrl,
        type: 'URL_UPDATED',
      }),
    });

    const data = await res.json();
    return { success: res.ok, engine: 'google_indexing_api', status: res.status, data };
  } catch (err) {
    console.error('[auto-index] Google Indexing API failed:', err.message);
    return { success: false, engine: 'google_indexing_api', error: err.message };
  }
}

/**
 * Log indexing request to DB for tracking
 */
async function logIndexRequest(url, type, results) {
  try {
    const db = await getDb();
    await db.collection('index_requests').insertOne({
      url,
      fullUrl: url.startsWith('http') ? url : `${SITE_URL}${url}`,
      type,
      results,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[auto-index] Failed to log index request:', err.message);
  }
}

/**
 * Main auto-index function — call this when content is published
 * @param {string} url - The URL path (e.g., /blog/my-post or /manga/my-manga)
 * @param {string} type - Content type: 'blog', 'manga', 'giveaway', 'page'
 */
export async function autoIndex(url, type = 'page') {
  console.log(`[auto-index] Indexing ${type}: ${url}`);

  const results = await Promise.allSettled([
    pingGoogleSitemap(),
    submitIndexNow(url),
    submitGoogleIndexingAPI(url),
  ]);

  const outcomes = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { success: false, engine: ['google_sitemap', 'indexnow', 'google_indexing_api'][i], error: r.reason?.message };
  });

  // Log to DB
  await logIndexRequest(url, type, outcomes);

  const successCount = outcomes.filter(o => o.success).length;
  console.log(`[auto-index] ${type} ${url} — ${successCount}/${outcomes.length} engines notified`);

  return { url, type, results: outcomes, successCount };
}

/**
 * Batch auto-index multiple URLs
 */
export async function autoIndexBatch(urls, type = 'page') {
  const results = [];
  for (const url of urls) {
    const result = await autoIndex(url, type);
    results.push(result);
  }
  return results;
}

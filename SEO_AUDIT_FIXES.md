# Technical SEO Audit — All Changes

**Date:** Feb 12, 2026
**Site:** https://luvrix.com
**Framework:** Next.js 14 (Pages Router)

---

## PHASE 1 — Crawl & Index Audit

### 1. Trailing Slash Mismatch (CRITICAL)
- **Problem:** `next.config.js` has `trailingSlash: true`, meaning Next.js serves all pages at URLs ending with `/` (e.g. `/blog/my-post/`). But ALL canonical tags, sitemap URLs, Open Graph URLs, and JSON-LD schema URLs were missing trailing slashes (e.g. `/blog/my-post`). Google sees these as two different URLs → canonical confusion → indexing failure.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/sitemaps/[type].js` — All sitemap `<loc>` URLs now include trailing slashes
  - `pages/blog.js` — `pageUrl` changed from `/blog/${slug}` to `/blog/${slug}/`
  - `pages/manga/[slug]/index.js` — `pageUrl` and `fullUrl` now include trailing slashes, loading state canonical also fixed
  - `pages/index.js` — Homepage canonical changed from `SITE_URL` to `${SITE_URL}/`, og:url also fixed
  - `pages/about.js` — Canonical and og:url changed from `/about` to `/about/`
  - `pages/categories.js` — Canonical now dynamic per category with trailing slash, schema URLs fixed
  - `pages/manga/index.js` — Canonical changed from `/manga` to `/manga/`, schema item URLs fixed
  - `components/SEOHead.js` — `fullUrl` builder now auto-appends trailing slash, BreadcrumbSchema URLs auto-append trailing slash, BlogArticleSchema `@id` URL fixed
  - `components/Layout.js` — Canonical URL rendering now auto-appends trailing slash (unless URL has query params)
  - `pages/_document.js` — Organization schema `url` changed from `https://luvrix.com` to `https://luvrix.com/`

### 2. Soft 404s (CRITICAL)
- **Problem:** Blog and manga pages returned HTTP 200 when content was not found or not approved. Google treats 200-status "not found" pages as thin/duplicate content, wasting crawl budget.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/blog/[slug].js` — `getServerSideProps` now returns `{ notFound: true }` (proper 404) instead of `{ props: { initialBlog: null } }` when blog not found or not approved
  - `pages/manga/[slug]/index.js` — `getServerSideProps` now returns `{ notFound: true }` when manga not found

### 3. Blog Meta Description Bug (CRITICAL)
- **Problem:** `blog.js` passed `blog.seoDescription` to `Layout` component, which is often `null`/`undefined`. Layout then falls back to generic "Luvrix - Read blogs, manga & stories..." description. This means ALL blog posts without a custom SEO description showed the same generic text → duplicate meta descriptions across the site.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/blog.js` — Now passes computed `seoDescription` (which falls back to content-derived text) to Layout instead of raw `blog.seoDescription`. Also passes `canonical`, `type`, `author`, `publishedTime`, `modifiedTime` props.

---

## PHASE 2 — Sitemap Validation

### 4. Sitemap URLs Missing Trailing Slashes (CRITICAL)
- **Problem:** All sitemap `<loc>` URLs lacked trailing slashes, creating a mismatch with the actual served URLs (which have trailing slashes due to `trailingSlash: true`).
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/sitemaps/[type].js` — Every URL type updated:
    - Blog posts: `/blog/${slug}` → `/blog/${slug}/`
    - Manga: `/manga/${slug}` → `/manga/${slug}/`
    - Categories: `/categories` → `/categories/`, `/categories?category=X` → `/categories/?category=X`
    - Static pages: Smart logic to add trailing slash (homepage `/` stays as-is, others get `/` appended)
    - Giveaways: `/giveaway` → `/giveaway/`, `/giveaway/${slug}` → `/giveaway/${slug}/`

---

## PHASE 3 — Crawlability

### 5. robots.txt Cleanup
- **Problem:** robots.txt contained 20+ rules for non-existent paths (`/cart/`, `/checkout/`, `/my-account/`, `/page/`, `/*/page/`, `/feed/`, `/*/feed/`). Had `Crawl-delay: 1` (Google ignores it, Bing throttles unnecessarily). Had redundant `Allow:` directives for paths already allowed by `Allow: /`. Missing `Disallow: /sitemaps/` (SSR pages behind the .xml rewrites). Missing `Disallow: /user/`.
- **Status:** ✅ FIXED
- **Files changed:**
  - `public/robots.txt` — Streamlined to only relevant rules:
    - Removed non-existent paths
    - Removed `Crawl-delay`
    - Removed redundant `Allow:` rules
    - Removed spam query param blocks (handled by middleware 301 redirects instead)
    - Added `Disallow: /sitemaps/` (raw SSR pages shouldn't be crawled directly)
    - Added `Disallow: /user/` (user profile pages are thin content)

### 6. Middleware X-Robots-Tag Leak on Sitemaps
- **Problem:** Middleware `NOINDEX_PATHS` didn't exclude `/sitemaps/`, so the SSR sitemap pages (which serve XML) could receive `X-Robots-Tag: noindex` header. While sitemaps aren't "indexed" as pages, this header could confuse Google's sitemap parser.
- **Status:** ✅ FIXED
- **Files changed:**
  - `middleware.js` — Added `&& !pathname.startsWith('/sitemaps')` to the noindex check

---

## PHASE 4 — Content Quality Signals

### 7. BlogArticleSchema `datePublished` Crash
- **Problem:** JSON-LD BlogPosting schema used `.toDate()` method on blog dates, but after SSR serialization these are already ISO strings (not Firestore Timestamp objects). This caused the schema to output incorrect/empty dates.
- **Status:** ✅ FIXED
- **Files changed:**
  - `components/SEOHead.js` — `datePublished` and `dateModified` now check `typeof === 'string'` first, then fall back to `.toDate()` for raw Firestore timestamps

### 8. Publisher Logo 404
- **Problem:** All JSON-LD schemas (BlogPosting, Article in SEOHead) referenced `${SITE_URL}/logo.png` which doesn't exist → Google's Rich Results validator fails → no rich snippets.
- **Status:** ✅ FIXED
- **Files changed:**
  - `components/SEOHead.js` — Both the inline Article schema and `BlogArticleSchema` publisher logo now use the actual Cloudinary logo URL: `https://res.cloudinary.com/dsga2d0bv/image/upload/v1770089324/Luvrix/Luvrix_favicon_yqovij.png`

### 9. Categories Canonical Tag
- **Problem:** Categories page had a hardcoded canonical of `https://luvrix.com/categories` for ALL category filter views. When viewing Technology category, canonical still said `/categories` → Google thinks all category pages are duplicates of the main categories page.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/categories.js` — Canonical is now dynamic: `/categories/` for "All", `/categories/?category=X` for specific categories

### 10. Organization Schema URL
- **Problem:** Organization JSON-LD in `_document.js` had `url: "https://luvrix.com"` without trailing slash.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/_document.js` — Changed to `https://luvrix.com/`

---

## PHASE 5 — Performance & Core Web Vitals

### 11. Featured Blog Image CLS
- **Problem:** Homepage featured blog image had no `width`, `height`, or `loading` attributes → causes CLS (Cumulative Layout Shift) and blocks initial paint.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/index.js` — Added `width={800} height={600} loading="lazy"` to featured blog image

---

## PHASE 6 — Internal Linking

- **Status:** ✅ Already good — blog pages have related posts, breadcrumb schemas on blog/manga/categories, category links on blog pages, homepage links to all major sections.

---

## PHASE 7 — Cloudflare Cache Fix

### 12. HTML Pages Cached by Cloudflare CDN
- **Problem:** Without explicit `CDN-Cache-Control` headers, Cloudflare's "Cache Everything" page rules could cache HTML pages, serving stale content and interfering with dynamic rendering.
- **Status:** ✅ FIXED
- **Files changed:**
  - `next.config.js` — Added `CDN-Cache-Control: no-store` and `Cloudflare-CDN-Cache-Control: no-store` to the catch-all `/:path*` header rule. This ensures all HTML pages return `cf-cache-status: DYNAMIC`.

---

## Summary Table

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Trailing slash mismatch (canonical/sitemap/OG/schema) | 🔴 CRITICAL | ✅ Fixed |
| 2 | Soft 404s (blog/manga return 200 for missing content) | 🔴 CRITICAL | ✅ Fixed |
| 3 | Blog meta description falls back to generic text | 🔴 CRITICAL | ✅ Fixed |
| 4 | Sitemap URLs missing trailing slashes | 🔴 CRITICAL | ✅ Fixed |
| 5 | robots.txt has non-existent paths | 🟡 Medium | ✅ Fixed |
| 6 | Middleware noindex leaks onto /sitemaps/ | 🟠 High | ✅ Fixed |
| 7 | BlogArticleSchema datePublished crash on SSR | 🟠 High | ✅ Fixed |
| 8 | Publisher logo 404 in JSON-LD schemas | 🟠 High | ✅ Fixed |
| 9 | Categories canonical hardcoded | 🟠 High | ✅ Fixed |
| 10 | Organization schema URL missing trailing slash | 🟡 Medium | ✅ Fixed |
| 11 | Homepage featured image missing dimensions | 🟡 Medium | ✅ Fixed |
| 12 | Cloudflare caching HTML pages | 🟡 Medium | ✅ Fixed |

---

### 13. Additional Trailing Slash Fixes (Found During Recheck)
- **Problem:** Several pages missed during first pass still had canonical/og:url without trailing slashes.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/giveaway/index.js` — canonical and og:url fixed
  - `pages/giveaway/[slug].js` — canonical and og:url fixed
  - `pages/contact.js` — canonical and og:url fixed
  - `pages/giveaway-terms.js` — canonical fixed
  - `pages/manga/[slug]/[chapter].js` — canonical fixed (2 locations: loading state + main render)

### 14. Additional Schema Fixes (Found During Recheck)
- **Problem:** `ChapterSchema` in SEOHead.js still had `/logo.png`, `WebsiteSchema` URL missing trailing slash, `MangaSchema` and `CollectionPageSchema` URLs had no trailing slash enforcement.
- **Status:** ✅ FIXED
- **Files changed:**
  - `components/SEOHead.js` — ChapterSchema publisher logo fixed, WebsiteSchema url fixed, MangaSchema url fixed, CollectionPageSchema url fixed

### 15. Policy/Static Pages (Verified OK)
- `pages/policy/terms.js`, `pages/policy/privacy.js`, `pages/policy/dmca.js`, `pages/policy/disclaimer.js`, `pages/privacy.js`, `pages/terms.js`, `pages/publishers.js`, `pages/leaderboard.js` — All pass `canonical` to Layout, which now auto-appends trailing slashes. **No changes needed.**

---

## Files Modified (18 files)

1. `pages/sitemaps/[type].js` — Trailing slashes on all sitemap URLs
2. `pages/blog.js` — Trailing slash, seoDescription fix, Layout props
3. `pages/blog/[slug].js` — Soft 404 fix (notFound: true)
4. `pages/manga/[slug]/index.js` — Trailing slash, soft 404 fix
5. `pages/manga/[slug]/[chapter].js` — Trailing slash on canonical (2 locations)
6. `pages/manga/index.js` — Trailing slash on canonical/schema
7. `pages/index.js` — Trailing slash on canonical/og:url, image lazy loading
8. `pages/about.js` — Trailing slash on canonical/og:url
9. `pages/contact.js` — Trailing slash on canonical/og:url
10. `pages/categories.js` — Dynamic canonical, trailing slashes on schema URLs
11. `pages/giveaway/index.js` — Trailing slash on canonical/og:url
12. `pages/giveaway/[slug].js` — Trailing slash on canonical/og:url
13. `pages/giveaway-terms.js` — Trailing slash on canonical
14. `pages/_document.js` — Organization schema URL trailing slash
15. `components/SEOHead.js` — datePublished fix, publisher logo (3 schemas), trailing slashes (5 schemas)
16. `components/Layout.js` — Auto trailing slash on canonical
17. `middleware.js` — Exclude /sitemaps/ from noindex
18. `public/robots.txt` — Cleaned up rules
19. `next.config.js` — CDN-Cache-Control headers, comment update

---

## Chapter Page Complete Removal

### What was removed:
- **`pages/manga/[slug]/[chapter].js`** — Entire chapter page deleted
- **`components/MangaRedirectBox.js`** — Redirect box component deleted (only used by chapter page)
- **`components/SEOHead.js`** — `ChapterSchema` export removed
- **`components/AdRenderer.js`** — Chapter page type detection removed
- **`pages/admin/seo-settings.js`** — Chapter SEO template fields removed from admin UI

### What was added:
- **`middleware.js`** — 410 Gone response for all `/manga/*/chapter*` URLs with `X-Robots-Tag: noindex` header. This tells Google the pages are permanently removed and to de-index them.
- **`pages/api/admin/cleanup-chapter-urls.js`** — Admin endpoint to list all chapter URLs that need de-indexing.

### What was kept:
- **`utils/mangaRedirectGenerator.js`** — Still used by manga detail page to generate EXTERNAL chapter links (not internal pages)
- **`pages/manga/[slug]/index.js`** — Chapter list UI still works — links open externally via `target="_blank" rel="nofollow noopener"`
- **`public/robots.txt`** — `Disallow: /manga/*/chapter*` already blocks crawlers
- **`pages/admin/manga.js`** — Manga admin still manages totalChapters, redirectBaseUrl, chapterFormat (data fields for external redirect generation)

### How Google de-indexes old chapter URLs:
1. **Automatic (410 Gone):** Middleware returns HTTP 410 for any `/manga/*/chapter*` request. Google will de-index on next crawl.
2. **Speed up via GSC:** Google Search Console → Removals → New Request → URL prefix `https://luvrix.com/manga/` with path containing `chapter`
3. **robots.txt:** Already blocks `/manga/*/chapter*` for all user agents
4. **Server cleanup:** After deploying, clear Nginx cache and Cloudflare cache (commands below)

---

## PHASE 8 — Second Full SEO Audit (Feb 12, 2026)

### 16. Duplicate Meta Tags Across All Pages (CRITICAL)
- **Problem:** Pages like index.js, blog.js, manga detail, about, contact, giveaway index, giveaway detail, and giveaway-terms all set meta tags (canonical, og:*, twitter:*, robots) both via Layout props AND inline `<Head>` blocks. This creates duplicate canonical tags, duplicate OG tags, and duplicate robots directives in the HTML — confusing Google's parser.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/index.js` — Moved canonical to Layout prop, removed all duplicate inline Head tags
  - `pages/blog.js` — Removed duplicate canonical/og/twitter/robots from inline Head (Layout handles them)
  - `pages/manga/[slug]/index.js` — Added canonical to Layout prop, removed duplicates from both loading and main render states
  - `pages/about.js` — Moved canonical to Layout prop, removed duplicates
  - `pages/contact.js` — Moved canonical to Layout prop, removed duplicates
  - `pages/giveaway/index.js` — Moved canonical to Layout prop, removed duplicates
  - `pages/giveaway/[slug].js` — Moved canonical+image to Layout prop, removed duplicates (kept Event JSON-LD)
  - `pages/giveaway-terms.js` — Moved canonical to Layout prop, removed duplicates

### 17. CollectionPageSchema Item URLs Missing Trailing Slashes (HIGH)
- **Problem:** In `CollectionPageSchema`, individual item URLs used `${SITE_URL}${item.url}` without enforcing trailing slash. Mismatch with actual served URLs.
- **Status:** ✅ FIXED
- **Files changed:**
  - `components/SEOHead.js` — CollectionPageSchema item URLs now enforce trailing slash

### 18. ProfilePageSchema URL Missing Trailing Slash (HIGH)
- **Problem:** ProfilePage schema `mainEntity.url` didn't enforce trailing slash.
- **Status:** ✅ FIXED
- **Files changed:**
  - `components/SEOHead.js` — ProfilePageSchema URL now enforces trailing slash

### 19. Blog Breadcrumb Category URL Incorrect (MEDIUM)
- **Problem:** Blog breadcrumb used `/categories?cat=...` but the actual URL pattern is `/categories/?category=...`. Wrong URL in breadcrumb schema = broken structured data link.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/blog.js` — Breadcrumb category URL changed to `/categories/?category=${encodeURIComponent(...)}`

### 20. Manga Sitemap Missing `deleted` Status Filter (HIGH)
- **Problem:** Blog sitemap correctly excluded `deleted` status, but manga sitemap only excluded `draft` and `private`. Deleted manga could appear in sitemap → Google crawls 404/410 pages → wasted crawl budget.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/sitemaps/[type].js` — Added `deleted` to manga exclusion filter

### 21. Giveaway Sitemap Including Low-Value Ended Pages (MEDIUM)
- **Problem:** Giveaway sitemap included ended and winner_selected giveaways. These are thin content pages that waste crawl budget.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/sitemaps/[type].js` — Now only includes `active` and `upcoming` giveaways

### 22. Chapter 410 Middleware Regex Improvement (LOW)
- **Problem:** Non-trailing-slash chapter URLs like `/manga/x/chapter-1` got a 308 redirect to `/manga/x/chapter-1/` before middleware could return 410. Two-hop response instead of direct 410.
- **Status:** ✅ FIXED
- **Files changed:**
  - `middleware.js` — Regex now strips trailing slash before matching, catching both variants

### 23. Event Schema URLs Missing Trailing Slashes (LOW)
- **Problem:** Giveaway detail Event schema had `location.url` and `organizer.url` without trailing slashes.
- **Status:** ✅ FIXED
- **Files changed:**
  - `pages/giveaway/[slug].js` — Added trailing slashes to schema URLs

---

## Updated Summary Table

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1–15 | Previous audit fixes | Various | ✅ Fixed |
| 16 | Duplicate meta tags on 8 pages | 🔴 CRITICAL | ✅ Fixed |
| 17 | CollectionPageSchema item URLs no trailing slash | 🟠 HIGH | ✅ Fixed |
| 18 | ProfilePageSchema URL no trailing slash | 🟠 HIGH | ✅ Fixed |
| 19 | Blog breadcrumb wrong category URL | 🟡 MEDIUM | ✅ Fixed |
| 20 | Manga sitemap includes deleted manga | 🟠 HIGH | ✅ Fixed |
| 21 | Giveaway sitemap includes ended giveaways | 🟡 MEDIUM | ✅ Fixed |
| 22 | Chapter 410 redirect chain | 🟢 LOW | ✅ Fixed |
| 23 | Event schema URLs missing trailing slashes | 🟢 LOW | ✅ Fixed |

---

## Files Modified in Phase 8 (11 files)

1. `pages/index.js` — Removed duplicate meta tags, canonical via Layout
2. `pages/blog.js` — Removed duplicate meta tags, fixed breadcrumb URL
3. `pages/manga/[slug]/index.js` — Removed duplicate meta tags, canonical via Layout
4. `pages/about.js` — Removed duplicate meta tags, canonical via Layout
5. `pages/contact.js` — Removed duplicate meta tags, canonical via Layout
6. `pages/giveaway/index.js` — Removed duplicate meta tags, canonical via Layout
7. `pages/giveaway/[slug].js` — Removed duplicate meta tags, canonical via Layout, Event schema URLs fixed
8. `pages/giveaway-terms.js` — Removed duplicate meta tags, canonical via Layout
9. `components/SEOHead.js` — CollectionPageSchema + ProfilePageSchema trailing slash fixes
10. `pages/sitemaps/[type].js` — Manga deleted filter, giveaway active-only filter
11. `middleware.js` — Chapter 410 regex handles both trailing slash variants

---

## Server Deployment Steps

```bash
cd /path/to/luvrix/WebApp
git pull origin main
npm install

# IMPORTANT: Clear old .next build cache (includes old chapter page bundles)
rm -rf .next

npm run build
pm2 restart luvrix

# Clear Nginx cache (removes any cached chapter page responses)
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx

# Purge Cloudflare cache: Dashboard → Caching → Purge Everything
# Resubmit sitemap in Google Search Console
# Use GSC Removals tool to speed up chapter URL de-indexing
```

---

## PHASE 9 — Faster Indexing & Search Engine Integration (Feb 13, 2026)

### 24. IndexNow Integration Enabled (CRITICAL)
- **Problem:** Auto-indexing infrastructure existed but was not active — `INDEXNOW_KEY` env var missing, no verification file.
- **Status:** ✅ FIXED
- **Changes:**
  - Created `/public/97966f3775497d1ad6046d7c506ecbef.txt` — IndexNow key verification file
  - Added `INDEXNOW_KEY=97966f3775497d1ad6046d7c506ecbef` to `.env`
  - Updated `middleware.js` matcher to exclude `.txt` verification files
- **Impact:** New content now auto-notifies Bing, Yandex, Seznam, Naver for **instant indexing**

### 25. Bing Webmaster Verification Support (HIGH)
- **Problem:** Site not verified in Bing Webmaster Tools — missing access to Bing's indexing tools, URL removal, and crawl data.
- **Status:** ✅ READY (requires manual step)
- **Changes:**
  - Added `<meta name="msvalidate.01">` support to `pages/_document.js`
  - Uses `NEXT_PUBLIC_BING_VERIFICATION` env var
- **Manual Step Required:**
  1. Go to https://www.bing.com/webmasters/
  2. Add site: https://luvrix.com
  3. Get verification code
  4. Add `NEXT_PUBLIC_BING_VERIFICATION=YOUR_CODE` to `.env`

### 26. Middleware Matcher Updated for Verification Files (LOW)
- **Problem:** Middleware matcher could potentially intercept verification `.txt` files.
- **Status:** ✅ FIXED
- **Changes:**
  - Added `[a-f0-9]{32}\\.txt|ads\\.txt|robots\\.txt` to middleware exclusion pattern

### 27. Comprehensive SEO Expert Guide Created
- **File:** `SEO_INDEXING_GUIDE.md`
- **Contents:**
  - Faster indexing strategies (IndexNow, Google Indexing API, sitemap pings)
  - Deleted URL management best practices
  - DNS configuration audit and recommendations
  - Implementation checklist

---

## Updated Summary Table (Phase 9)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1–23 | Previous audit fixes | Various | ✅ Fixed |
| 24 | IndexNow not enabled | 🔴 CRITICAL | ✅ Fixed |
| 25 | Bing Webmaster not verified | 🟠 HIGH | ✅ Ready (manual step) |
| 26 | Middleware blocks .txt files | 🟢 LOW | ✅ Fixed |
| 27 | No indexing speed guide | 🟡 MEDIUM | ✅ Created |

---

## Files Modified in Phase 9 (4 files + 1 new)

1. `public/97966f3775497d1ad6046d7c506ecbef.txt` — **NEW** IndexNow key verification
2. `pages/_document.js` — Bing verification meta tag support
3. `middleware.js` — Exclude verification files from middleware
4. `.env` — Added INDEXNOW_KEY
5. `SEO_INDEXING_GUIDE.md` — **NEW** Comprehensive SEO expert guide

---

## Environment Variables Reference

```env
# Required for faster indexing
INDEXNOW_KEY=97966f3775497d1ad6046d7c506ecbef

# Optional: Bing Webmaster verification (get from Bing)
NEXT_PUBLIC_BING_VERIFICATION=YOUR_BING_CODE

# Optional: Google Indexing API (fastest Google indexing)
GOOGLE_INDEXING_CREDENTIALS={"type":"service_account",...}
```

---

## PHASE 10 — SEO Expert: Faster Indexing & Deleted URL Protection (Feb 14, 2026)

### 28. Auto-Index URLs Missing Trailing Slashes (CRITICAL)
- **Problem:** `lib/auto-index.js` submitted URLs to IndexNow and Google Indexing API without trailing slashes (e.g., `/blog/my-post`). Since the site uses `trailingSlash: true`, the canonical URL is `/blog/my-post/`. Google/Bing see these as different URLs → indexing confusion, diluted signals.
- **Status:** ✅ FIXED
- **Changes:**
  - `lib/auto-index.js` — Added `ensureTrailingSlash()` helper. All `submitIndexNow()`, `submitGoogleIndexingAPI()`, and `logIndexRequest()` now enforce trailing slashes before sending to search engines.

### 29. Auto-Deindex for Deleted Content (CRITICAL)
- **Problem:** When blogs or manga were deleted, they were removed from the sitemap collection, but search engines were **never notified**. Google could keep deleted URLs indexed for weeks/months. The Google Indexing API supports `URL_DELETED` type and IndexNow can re-ping to trigger re-crawl (which then sees the 404/410).
- **Status:** ✅ FIXED
- **Changes:**
  - `lib/auto-index.js` — Added `autoDeindex()` function that sends `URL_DELETED` via Google Indexing API and re-pings IndexNow
  - `lib/db.js` — `deleteBlog()` now calls `autoDeindex()` after removing from sitemap
  - `lib/db.js` — `deleteManga()` now calls `autoDeindex()` after removing from sitemap
  - `lib/db.js` — `removeMangaFromSitemap()` now calls `autoDeindex()`

### 30. Sitemap Index Manga Query Missing `deleted` Filter (HIGH)
- **Problem:** `sitemaps/index.js` queried manga with `$nin: ["draft", "private"]` but the individual manga sitemap used `$nin: ["draft", "private", "deleted"]`. The sitemap index `<lastmod>` could reflect a deleted manga's update time, causing Google to re-crawl the sub-sitemap unnecessarily.
- **Status:** ✅ FIXED
- **Changes:**
  - `pages/sitemaps/index.js` — Added `"deleted"` to manga `$nin` filter to match the individual sitemap

### 31. Image Sitemap Tags for Google Image Search (MEDIUM)
- **Problem:** Blog and manga sitemaps had no `<image:image>` tags. Google Image Search is a significant traffic source (20-30% of all Google searches). Without image sitemap data, Google may not discover or rank content images properly.
- **Status:** ✅ FIXED
- **Changes:**
  - `pages/sitemaps/[type].js` — Blog sitemap now includes `<image:image>` with `featuredImage` URL and title
  - `pages/sitemaps/[type].js` — Manga sitemap now includes `<image:image>` with `coverImage` URL and title
  - Both sitemaps now include `xmlns:image` namespace declaration

### 32. Last-Modified Header for Dynamic Pages (MEDIUM)
- **Problem:** Blog and manga SSR pages had no `Last-Modified` header. Without it, Googlebot must re-download the full page on every crawl to check for changes. With it, crawlers can use conditional requests (`If-Modified-Since`) to skip unchanged pages → faster crawling, reduced server load, better crawl budget allocation.
- **Status:** ✅ FIXED
- **Changes:**
  - `pages/blog/[slug].js` — `getServerSideProps` now sets `Last-Modified` header from `updatedAt || publishedAt || createdAt`
  - `pages/manga/[slug]/index.js` — `getServerSideProps` now sets `Last-Modified` header from `updatedAt || createdAt`

---

## Updated Summary Table (Phase 10)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1–27 | Previous audit fixes | Various | ✅ Fixed |
| 28 | Auto-index URLs missing trailing slashes | 🔴 CRITICAL | ✅ Fixed |
| 29 | No auto-deindex when content deleted | 🔴 CRITICAL | ✅ Fixed |
| 30 | Sitemap index manga query missing `deleted` | � HIGH | ✅ Fixed |
| 31 | No image sitemap tags (missing Google Image Search traffic) | 🟡 MEDIUM | ✅ Fixed |
| 32 | No Last-Modified header on dynamic pages | 🟡 MEDIUM | ✅ Fixed |

---

## Files Modified in Phase 10 (5 files)

1. `lib/auto-index.js` — `ensureTrailingSlash()` helper, trailing slash enforcement on all URL submissions, new `autoDeindex()` function
2. `lib/db.js` — Import `autoDeindex`, added deindex calls to `deleteBlog`, `deleteManga`, `removeMangaFromSitemap`
3. `pages/sitemaps/index.js` — Added `deleted` to manga `$nin` filter
4. `pages/sitemaps/[type].js` — Image sitemap tags for blog (`featuredImage`) and manga (`coverImage`)
5. `pages/blog/[slug].js` — `Last-Modified` header in `getServerSideProps`
6. `pages/manga/[slug]/index.js` — `Last-Modified` header in `getServerSideProps`

---

## DNS Expert Review (Updated Feb 14, 2026)

### Current DNS Configuration Analysis

Your DNS is **mostly correct** but has a few issues that can hurt deliverability and SEO:

| Record | Status | Analysis |
|--------|--------|----------|
| **A record (luvrix.com → 38.146.28.243)** | ✅ Good | Proxied through Cloudflare — DDoS protection + CDN |
| **A records (cdd1, ftp → 46.202.161.74)** | ⚠️ Review | These are DNS-only pointing to a different IP. If not actively used, they're attack surface. Consider removing. |
| **CNAME www → luvrix.com** | ✅ Good | Properly proxied. **Ensure Cloudflare Page Rule:** `www.luvrix.com/*` → 301 redirect to `https://luvrix.com/$1` to avoid duplicate content. |
| **MX records (Hostinger)** | ✅ Good | Priority 5/10 for mx1/mx2 |
| **SPF record** | ⚠️ Incomplete | `v=spf1 include:_spf.mail.hostinger.com ~all` — **Missing Brevo SPF**. Emails sent via Brevo may fail SPF checks. |
| **DKIM records** | ✅ Good | Both Brevo and Hostinger DKIM configured |
| **DMARC** | ⚠️ Weak | `p=none` only monitors, doesn't protect. Should upgrade to `p=quarantine` after monitoring period. |
| **CAA records** | ⚠️ Excessive | 14 CAA records (6 CAs × issue/issuewild). Keep only CAs you actually use. |
| **Google verification** | ✅ Present | `google-site-verification=HV_vnIriki10qfX9MKUD8YJwG372P_5WD7TgNUjWW-o` |
| **Yandex verification** | ✅ Present | `yandex-verification: 20735c8f81d228fe` |
| **Bing verification** | ❌ Missing | **Add Bing Webmaster TXT record** |
| **Brevo codes** | ⚠️ Duplicate | Two `brevo-code:` TXT records — remove the old one |
| **CNAME autoconfig/autodiscover** | ⚠️ Should be DNS-only | These are mail autoconfiguration records. Being proxied through Cloudflare can break email client auto-setup. **Set to DNS-only.** |

### DNS Actions Required

**🔴 HIGH PRIORITY:**

1. **Fix SPF record** — Add Brevo SPF include:
   ```
   Current:  v=spf1 include:_spf.mail.hostinger.com ~all
   Fixed:    v=spf1 include:_spf.mail.hostinger.com include:spf.brevo.com ~all
   ```
   Without this, emails sent via Brevo to Gmail/Outlook may go to spam.

2. **Add Bing Webmaster verification TXT record:**
   ```
   Type: TXT
   Name: luvrix.com (or @)
   Content: [Get from Bing Webmaster Tools → Settings → Ownership Verification]
   TTL: Auto
   Proxy: DNS only
   ```

3. **Ensure www→non-www redirect in Cloudflare:**
   - Go to Cloudflare → Rules → Redirect Rules
   - Create rule: `www.luvrix.com/*` → `https://luvrix.com/$1` (301)
   - This prevents duplicate content (Google seeing www and non-www as separate sites)

**🟡 MEDIUM PRIORITY:**

4. **Upgrade DMARC policy:**
   ```
   Current:  v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com
   Upgrade:  v=DMARC1; p=quarantine; rua=mailto:rua@dmarc.brevo.com; pct=100
   ```

5. **Set autoconfig/autodiscover CNAMEs to DNS-only** (not Proxied):
   - `autoconfig` → DNS only
   - `autodiscover` → DNS only

6. **Remove duplicate Brevo verification code** — Keep only the latest `brevo-code:` TXT record

**🟢 LOW PRIORITY:**

7. **Simplify CAA records** — Keep only CAs you actively use:
   ```
   0 issue letsencrypt.org
   0 issuewild letsencrypt.org
   ```
   Remove the rest (pki.goog, comodoca, globalsign, digicert, sectigo) unless you have certificates from them.

8. **Review cdd1 and ftp A records** — If not in active use, remove them to reduce attack surface.

9. **Consider AAAA record (IPv6)** — If your server supports IPv6, adding an AAAA record can slightly improve crawl performance with modern search engine bots.

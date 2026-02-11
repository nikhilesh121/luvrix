# SEO + Analytics Enterprise Implementation Tracker

## Project: Luvrix
## Date Started: Feb 11, 2026

---

## PART 1: FULLY DYNAMIC SITEMAP SYSTEM

| # | Task | Status |
|---|------|--------|
| 1.1 | Delete pages/api/sitemap/chapters.js | [x] |
| 1.2 | Remove chapters references from next.config.js rewrites | [x] |
| 1.3 | Remove chapters references from admin/sitemap.js | [x] |
| 1.4 | Rewrite sitemap/index.js — dynamic sitemap index from DB | [x] |
| 1.5 | Rewrite sitemap/posts.js — lean DB queries, projection, no-store | [x] |
| 1.6 | Rewrite sitemap/manga.js — lean DB queries, projection, no-store | [x] |
| 1.7 | Rewrite sitemap/categories.js — DB-driven with distinct categories | [x] |
| 1.8 | Rewrite sitemap/giveaways.js — lean DB queries, projection, no-store | [x] |
| 1.9 | Auto-split sitemaps at 50,000 URLs | [x] |
| 1.10 | Update next.config.js rewrites (clean URLs, no chapters) | [x] |
| 1.11 | Auto Google Ping on blog/manga/giveaway publish (via auto-index.js) | [x] |
| 1.12 | Update robots.txt to include Sitemap directive | [x] |

## PART 2: GOOGLE ANALYTICS 4 IMPLEMENTATION

| # | Task | Status |
|---|------|--------|
| 2.1 | Integrate gtag.js properly in _app.js + Layout.js (production only) | [x] |
| 2.2 | Track page views on all routes (Layout.js + _app.js) | [x] |
| 2.3 | Custom event tracking (blog_view, manga_view, giveaway_view, signup, login, payment_success, referral_used) | [x] |
| 2.4 | Enhance pageviews API — 30-min IP+cookie throttle, daily counts, slug+type tracking | [x] |
| 2.5 | Add views field to blog/manga/giveaway models (auto-increment on view) | [x] |
| 2.6 | Auto-increment views on page load via trackInternalPageView | [x] |
| 2.7 | Admin Dashboard — total views, daily graph, top 10 posts/manga/giveaways (pageviews API GET) | [x] |
| 2.8 | User Dashboard — views per blog available via existing blog views field | [x] |
| 2.9 | No double counting (30-min throttle), no bot counting (UA regex), no SSR blocking (async) | [x] |

## PART 3: PERFORMANCE + INDEXING

| # | Task | Status |
|---|------|--------|
| 3.1 | Add DB indexes API (slug, updatedAt, views, createdAt + pageviews) | [x] |
| 3.2 | Use projection everywhere for sitemap read queries | [x] |
| 3.3 | IndexNow endpoint (/api/indexnow) | [x] |
| 3.4 | Auto-notify Bing + IndexNow on new content (via auto-index.js) | [x] |

## PART 4: ADMIN SITEMAP PANEL

| # | Task | Status |
|---|------|--------|
| 4.1 | Show sitemap URLs with counts per type | [x] |
| 4.2 | "Ping Google Now" button with last ping timestamp | [x] |
| 4.3 | Toggles: include giveaways, categories, manga | [x] |
| 4.4 | Remove chapters references from panel | [x] |

---

## COMPLETION LOG

| Date | Items Completed | Notes |
|------|----------------|-------|
| Feb 11, 2026 | ALL PARTS 1-4 | Full implementation complete. Build passes with 0 errors. |

## FILES CREATED/MODIFIED

### New Files:
- `pages/api/indexnow.js` — IndexNow endpoint for Bing/Yandex
- `pages/api/admin/ensure-indexes.js` — MongoDB indexes setup endpoint

### Modified Files:
- `pages/api/sitemap/index.js` — Dynamic DB-driven sitemap index with toggles
- `pages/api/sitemap/posts.js` — Lean DB query with projection, 50k split
- `pages/api/sitemap/manga.js` — Lean DB query with projection, 50k split
- `pages/api/sitemap/categories.js` — DB-driven distinct categories
- `pages/api/sitemap/giveaways.js` — Lean DB query with projection
- `pages/api/sitemap/ping-google.js` — Enhanced with last-ping timestamp in DB
- `pages/api/analytics/pageviews.js` — 30-min throttle, slug+type, top 10 by type
- `pages/admin/sitemap.js` — Complete rewrite with toggles, counts, last ping
- `next.config.js` — Removed chapters rewrite
- `public/robots.txt` — Cleaned sitemap references
- `lib/analytics.js` — Added trackGiveawayView, trackPayment, trackReferral, trackInternalPageView
- `components/Layout.js` — Uses trackInternalPageView
- `SEO_ANALYTICS_IMPLEMENTATION.md` — This tracking doc

### Deleted Files:
- `pages/api/sitemap/chapters.js` — Removed per architecture decision

# Sitemap & Cloudflare Setup Guide

## Sitemap Architecture

Luvrix uses **dynamic server-side rendered (SSR) sitemaps** that query MongoDB on every request. No rebuild is needed — sitemaps update instantly when content is published.

### Sitemap URLs

| URL | Description |
|-----|-------------|
| `https://luvrix.com/sitemap.xml` | Sitemap index (links to all sub-sitemaps) |
| `https://luvrix.com/sitemap-posts.xml` | All approved blog posts |
| `https://luvrix.com/sitemap-manga.xml` | All published manga |
| `https://luvrix.com/sitemap-categories.xml` | Blog category pages |
| `https://luvrix.com/sitemap-pages.xml` | Static pages (home, about, contact, etc.) |
| `https://luvrix.com/sitemap-giveaways.xml` | Active and past giveaways |

### How It Works

1. Browser/Google requests `/sitemap-posts.xml`
2. Next.js middleware internally rewrites to `/sitemaps/posts/` (SSR page)
3. The SSR page runs `getServerSideProps` → queries MongoDB → returns fresh XML
4. Response includes `Cache-Control: no-store` headers

---

## Cloudflare Configuration (REQUIRED)

Cloudflare **automatically caches `.xml` files by default**. This is built into Cloudflare's free plan — it caches file extensions like `.xml`, `.css`, `.js`, `.jpg`, etc. Regular HTML pages (no file extension) are NOT cached, which is why blog and manga pages always show fresh content but `.xml` sitemaps can become stale.

### Step 1: Create Cache Bypass Rule (Already Done)

You already have this rule. Verify it matches exactly:

1. Go to **Cloudflare Dashboard** → `luvrix.com`
2. Navigate to **Caching** → **Cache Rules**
3. Your rule "Bypass XML Files" should have:
   - **Field:** URI Path
   - **Operator:** contains
   - **Value:** `/sitemap`
   - **Cache eligibility:** Bypass cache
   - **Place at:** First
4. Make sure the rule is **enabled** (green toggle)

### Step 2: Purge ALL Cached Content (DO THIS NOW)

**This is the critical step.** The bypass rule only affects NEW requests. Old cached responses are still stored in Cloudflare's edge servers worldwide. You must purge them:

1. Go to **Cloudflare Dashboard** → `luvrix.com`
2. Navigate to **Caching** → **Configuration**
3. Find the **"Purge Cache"** section
4. Click **"Purge Everything"**
5. Confirm by clicking **"Purge Everything"** again

> **Important:** After purging, the first request to each sitemap URL will take slightly longer (it goes to your server instead of Cloudflare's cache). All subsequent requests will also go to your server because of the bypass rule — this is correct behavior for sitemaps.

### Step 3: Verify Sitemaps Are Fresh

After purging, open these URLs in a **new incognito/private browser window**:

- `https://luvrix.com/sitemap.xml` — Should show 5 sub-sitemaps with recent `<lastmod>` dates
- `https://luvrix.com/sitemap-posts.xml` — Should show all your blog posts
- `https://luvrix.com/sitemap-categories.xml` — Should show all categories
- `https://luvrix.com/sitemap-manga.xml` — Should show all manga

**How to confirm the bypass rule is working:**

Open browser DevTools (F12) → Network tab → click on the sitemap request → look at Response Headers:
- `cf-cache-status: BYPASS` — Rule is working correctly
- `cf-cache-status: HIT` — Rule is NOT working, check Step 1
- No `cf-cache-status` header — Cloudflare is serving from old cache, purge again

---

## Google Search Console Setup

### Submit Sitemap

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select property: `https://luvrix.com`
3. Navigate to **Sitemaps** in the left sidebar
4. In the "Add a new sitemap" field, enter: `sitemap.xml`
5. Click **Submit**

Google will fetch your sitemap index, discover all sub-sitemaps automatically, and begin crawling the URLs.

### Verify Submission

After submitting, Google Search Console will show:
- **Status:** Success (green checkmark)
- **Discovered URLs:** Total count of URLs across all sub-sitemaps
- **Last read:** Recent date/time

If it shows "Couldn't fetch", wait 5 minutes and try again — it may take a moment for Cloudflare's cache to fully clear.

---

## Troubleshooting

### Sitemaps still showing old data after purge

1. **Clear your browser cache** or use incognito mode
2. **Purge Cloudflare cache again** (Step 2 above)
3. Verify the bypass rule is active and placed **First** in priority
4. Check if there are any other Cache Rules or Page Rules that might conflict

### How to check if Cloudflare is caching sitemaps

Run this command on your server:
```bash
curl -sI https://luvrix.com/sitemap-posts.xml | grep cf-cache-status
```

Expected output: `cf-cache-status: BYPASS` or `cf-cache-status: DYNAMIC`

If you see `cf-cache-status: HIT`, the bypass rule isn't working.

### Admin Panel Sitemap Manager

Access the Sitemap Manager at: `https://luvrix.com/admin/sitemap`

Features:
- **Refresh Counts** — Shows live URL counts for each sitemap
- **Ping Google** — Notifies Google that your sitemap has been updated
- **Toggle Includes** — Enable/disable manga, categories, or giveaways from the sitemap index

---

## Technical Details

### File Structure

```
pages/
  sitemaps/
    index.js       → Sitemap index (SSR, queries MongoDB)
    [type].js      → Dynamic sub-sitemaps: posts, manga, categories, pages, giveaways
  api/
    sitemap/
      index.js     → API route (backup, also queries MongoDB)
      posts.js     → API route for posts sitemap
      categories.js → API route for categories sitemap
      manga.js     → API route for manga sitemap
      pages.js     → API route for static pages sitemap
      giveaways.js → API route for giveaways sitemap
      ping-google.js → Google ping endpoint
middleware.js      → Rewrites /sitemap*.xml → /sitemaps/* SSR pages
```

### Why `.xml` URLs need special handling

Cloudflare automatically caches responses for these file extensions by default:
`7z, avi, css, csv, doc, gif, gz, ico, jpg, js, json, mp3, mp4, pdf, png, svg, xml, zip` (and more)

This means any URL ending in `.xml` gets cached by Cloudflare's edge network regardless of `Cache-Control` headers from the origin server. The **Cache Rules bypass** tells Cloudflare to skip caching for sitemap URLs specifically.

Regular pages (like `/blog/my-post/` or `/manga/one-piece/`) don't have file extensions, so Cloudflare marks them as `DYNAMIC` and never caches them. This is why blogs and manga always show fresh content without any special configuration.

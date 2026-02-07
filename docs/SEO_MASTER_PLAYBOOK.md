# SEO Master Playbook — Luvrix Platform
## Canonical Source of Truth for All SEO Decisions

**Created:** February 7, 2026  
**Last Updated:** February 7, 2026  
**Enforced By:** All Engineers & Content Creators  
**Review Cadence:** Monthly

---

## 1. Global SEO Rules (NON-NEGOTIABLE)

| # | Rule |
|---|------|
| 1 | Every public page MUST have a unique `<title>` (≤60 chars) |
| 2 | Every public page MUST have a unique `meta description` (140–160 chars) |
| 3 | Every public page MUST have a canonical URL pointing to itself |
| 4 | No duplicate `<title>` tags across the site |
| 5 | All OG images MUST be PNG/JPG/WebP — **NEVER SVG** |
| 6 | All OG image URLs MUST be absolute (https://luvrix.com/…) |
| 7 | JSON-LD structured data required on every page type |
| 8 | `noindex,nofollow` on all admin, auth, draft, and transactional pages |
| 9 | Breadcrumbs on every content page (blog, manga, chapter) |
| 10 | Internal links always use clean slug URLs — never `?id=` params |

---

## 2. Page-Type SEO Requirements

### Homepage (`/`)
- **Title:** `Luvrix — Read Blogs, Manga & Stories Free`
- **Schema:** WebSite + Organization + SearchAction
- **Canonical:** `https://luvrix.com`
- **Priority:** 1.0

### Blog Post (`/blog/[slug]`)
- **Title:** `{seoTitle} | Luvrix` (≤60 chars)
- **Schema:** BlogPosting + BreadcrumbList
- **Canonical:** `https://luvrix.com/blog/{slug}`
- **Required:** datePublished, dateModified, author, image
- **Priority:** 0.8

### Manga Detail (`/manga/[slug]`)
- **Title:** `{title} — Read Online Free | Luvrix`
- **Schema:** Book + BreadcrumbList
- **Canonical:** `https://luvrix.com/manga/{slug}`
- **Priority:** 0.7

### Chapter Page (`/manga/[slug]/chapter-[n]`)
- **Title:** `{title} Chapter {n} — Read Online | Luvrix`
- **Schema:** Chapter + BreadcrumbList
- **Canonical to SELF** (not parent manga)
- **Priority:** 0.6

### Categories (`/categories`)
- **Title:** `Browse Categories | Luvrix`
- **Schema:** CollectionPage + ItemList
- **Canonical:** `https://luvrix.com/categories`
- **Priority:** 0.7

### Manga Listing (`/manga`)
- **Title:** `Browse Manga — Read Online Free | Luvrix`
- **Schema:** CollectionPage + ItemList
- **Canonical:** `https://luvrix.com/manga`
- **Priority:** 0.8

### Static Pages (`/about`, `/contact`, `/policy/*`)
- **Canonical:** Self-referencing
- **Priority:** 0.3–0.5

### User Profiles (`/user/[id]`)
- **Robots:** `noindex, follow`
- **No canonical** — prevents indexing of thin content

### Auth/Admin Pages (`/login`, `/register`, `/admin/*`)
- **Robots:** `noindex, nofollow`
- **No canonical** — must never be indexed

---

## 3. Image SEO Rules

| Rule | Requirement |
|------|-------------|
| OG Image format | PNG, JPG, or WebP only — **NEVER SVG** |
| OG Image size | 1200×630 pixels |
| OG Image URL | Absolute URL starting with `https://` |
| Default OG image | Cloudinary PNG (not SVG) |
| Favicon format | PNG, ICO, or WebP (NO SVG) |
| Favicon URL | Must be absolute `https://` when configured in Theme settings |
| `alt` text | Descriptive, keyword-rich, ≤125 chars |
| Lazy loading | `loading="lazy"` on all below-fold images |
| Hero/LCP images | `loading="eager"` + `fetchpriority="high"` |
| ImageObject in JSON-LD | Include `url`, `width`, `height` |
| Twitter image | Must match OG image |

### Default OG Image URL
```
https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png
```

---

## 4. Indexing & Crawl Rules

### robots.txt
- Allow: `/`, `/blog`, `/manga`, `/categories`, `/about`, `/contact`, `/publishers`, `/leaderboard`, `/policy/`
- Disallow: `/admin/`, `/api/`, `/_next/`, `/login/`, `/register/`, `/profile/`, `/favorites/`, `/create-blog/`, `/edit-blog/`, `/preview-blog/`, `/payment-*`
- Allow specific bots: `Googlebot`, `Googlebot-Image`, `AdsBot-Google`
- Sitemaps listed at bottom

### Sitemap Strategy
| Sitemap | Contents |
|---------|----------|
| `/sitemap.xml` | Index of all sub-sitemaps |
| `/sitemap-pages.xml` | Static pages |
| `/sitemap-posts.xml` | Published blogs only |
| `/sitemap-manga.xml` | All manga series |
| `/sitemap-chapters.xml` | All chapters |
| `/sitemap-categories.xml` | Category page |

### Excluded from Sitemaps
- Draft/pending blogs
- Admin pages
- Auth pages
- User profiles
- Pagination pages beyond page 1

---

## 5. Structured Data Rules

| Schema | Pages | Required Fields |
|--------|-------|-----------------|
| WebSite | Homepage | name, url, potentialAction (SearchAction) |
| Organization | All (via _document.js) | name, url, logo, sameAs, contactPoint |
| BlogPosting | Blog posts | headline, datePublished, dateModified, author, publisher, image |
| Book | Manga detail | name, author, numberOfPages, genre, image |
| Chapter | Chapter pages | name, isPartOf, position, image |
| BreadcrumbList | Blog, Manga, Chapter | itemListElement with position, name, item |
| CollectionPage | Categories, Manga listing | name, description |
| ItemList | Categories, Manga listing | itemListElement |
| ProfilePage | User profiles (noindex) | name, description |

### Validation Rules
- All image URLs must be absolute
- `datePublished` and `dateModified` always present on articles
- `author` must have `@type: Person` with `name`
- `publisher` must have `@type: Organization` with `name` and `logo`
- One primary schema per page type

---

## 6. AdSense + SEO Coexistence Rules

| # | Rule |
|---|------|
| 1 | No ads injected before `<main>` element (header_top is above nav, acceptable) |
| 2 | No ads inside H1/H2 heading containers |
| 3 | No ads above-the-fold on first paint that cause layout shift |
| 4 | All ad containers have min-height to prevent CLS |
| 5 | Auto Ads enabled via admin toggle only |
| 6 | No duplicate AdSense script tags |
| 7 | AdSense script loaded with `strategy="afterInteractive"` |
| 8 | No ads on admin, auth, or error pages |
| 9 | Cookie consent must be respected |
| 10 | In-content ads placed after every 4 paragraphs minimum |
| 11 | Between-posts ads appear after every 4–6 cards in listings |
| 12 | Ads rendered via lazy loading (IntersectionObserver) below fold |

### Ad Position Map
| Position ID | Location | Layout safe? |
|-------------|----------|-------------|
| header_top | Above nav bar | ✅ fixed height |
| header_below | Below nav | ✅ fixed height |
| content_top | Above main content | ✅ |
| content_middle | Between paragraphs/sections | ✅ lazy loaded |
| content_bottom | Below main content | ✅ |
| between_posts | In blog/manga grids | ✅ col-span-full |
| footer_above | Before footer | ✅ |
| footer_inside | In footer | ✅ |
| sticky_bottom | Fixed bottom bar | ✅ z-indexed |

---

## 7. Core Web Vitals Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | < 2.5s | Preload hero images, font-display: swap, defer JS |
| CLS | < 0.1 | Fixed-size ad containers, explicit image dimensions |
| INP | < 200ms | Debounce handlers, minimize main-thread blocking |

### Performance Checklist
- [x] `generateEtags: true` in next.config.js
- [x] `productionBrowserSourceMaps: false`
- [x] `compress: true`
- [x] `swcMinify: true`
- [x] Preconnect to Cloudinary, Google Fonts, Google Ads
- [x] `font-display: swap` on web fonts
- [x] AdSense loaded `afterInteractive`
- [x] Images lazy-loaded below fold
- [x] Hero images `loading="eager"`

---

## 8. Regression Checklist

### Before Every Merge
- [ ] No new pages missing `<title>` or `meta description`
- [ ] No new pages missing canonical URL
- [ ] No public page with `noindex` that should be indexed
- [ ] No `?id=` parameter links in internal navigation
- [ ] OG image is absolute URL, PNG/JPG/WebP format
- [ ] Structured data validates at https://validator.schema.org
- [ ] No duplicate AdSense script injections
- [ ] Ad containers have min-height set
- [ ] `npm run build` succeeds without errors

### Before Every Release
- [ ] `robots.txt` serves correctly at `/robots.txt`
- [ ] All sitemaps return valid XML
- [ ] No admin/auth URLs in sitemaps
- [ ] Google Search Console shows no new errors
- [ ] Core Web Vitals pass in Lighthouse
- [ ] AdSense policy compliance verified
- [ ] Structured data tested with Rich Results Test

---

## 9. SEO Priority / Internal Linking Hierarchy

```
Homepage (1.0)
├── Categories (0.8) ← linked from nav + homepage
├── Manga Listing (0.8) ← linked from nav + homepage  
├── Blog Posts (0.8) ← linked from homepage cards
│   └── Related Posts (internal links)
├── Manga Detail (0.7) ← linked from manga listing
│   └── Chapter Pages (0.6) ← linked from manga detail
├── About (0.5)
├── Contact (0.5)
├── Policy Pages (0.3)
└── Leaderboard (0.5)
```

### Orphan Page Prevention
- Every blog must link to category and related posts
- Every chapter must link to manga detail and adjacent chapters
- Footer must link to all top-level pages
- Breadcrumbs provide upward navigation on all content pages

---

## 10. Build Stability & Low-Memory VPS Rules

| # | Rule |
|---|------|
| 1 | Build MUST succeed with `NODE_OPTIONS="--max-old-space-size=1024"` |
| 2 | Server requires 2GB swap (`/swapfile`) — verify with `swapon --show` |
| 3 | PM2 manages the process: `pm2 start npm --name "luvrix" -- start` |
| 4 | Apache reverse proxy on port 443 → localhost:3000 |
| 5 | After build, verify `.next/BUILD_ID` and `.next/prerender-manifest.json` exist |
| 6 | Never introduce memory-heavy build steps (large static generation, etc.) |
| 7 | If a feature blocks build, gracefully disable it — never delete logic |

### Build Command
```bash
NODE_OPTIONS="--max-old-space-size=1024" npm run build
pm2 restart luvrix
```

---

## 11. Auto Ads + Manual Ads Coexistence

### Admin Settings Required
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `adsEnabled` | boolean | false | Global ads kill switch |
| `adsensePublisherId` | string | — | `ca-pub-XXXXX` |
| `enableAutoAds` | boolean | false | Enable Google Auto Ads overlay |
| `autoAdsExcludedRoutes` | string[] | `["/admin","/login","/register","/error"]` | Routes where auto ads are suppressed |

### Auto Ads Implementation Rules
1. AdSense script loaded ONCE via `next/script` with `strategy="afterInteractive"`
2. Auto Ads enabled by adding `data-ad-client` + `enable_page_level_ads: true` — controlled by admin toggle
3. Auto Ads excluded from auth/admin/error pages via route check
4. Cookie consent MUST be respected — no ads before consent
5. Auto Ads and manual `AdRenderer` slots coexist — no conflicts
6. NEVER call `adsbygoogle.push()` more than once per slot

---

## 12. SEO Implementation Status

### ✅ Completed
- [x] Unique `<title>` per page (≤60 chars)
- [x] Unique `meta description` per page (140–160 chars)
- [x] Canonical URLs on all indexable pages
- [x] `noindex,nofollow` on admin/auth/draft/transactional pages
- [x] `noindex,follow` on user profiles
- [x] OG images use Cloudinary PNG (never SVG), absolute URLs, 1200×630
- [x] Twitter Card matches OG image
- [x] Organization schema (global via `_document.js`)
- [x] WebSite + SearchAction schema (homepage)
- [x] BlogPosting + BreadcrumbList schema (blog posts)
- [x] Book + BreadcrumbList schema (manga detail)
- [x] Chapter + BreadcrumbList schema (chapter pages)
- [x] CollectionPage + ItemList schema (categories, manga listing)
- [x] ProfilePage schema (user profiles)
- [x] Internal links use slug URLs (no `?id=` params)
- [x] `robots.txt` allows Googlebot, Googlebot-Image, AdsBot-Google
- [x] Sitemaps exclude drafts, admin, auth pages
- [x] `font-display: swap` on Google Fonts
- [x] AdSense loaded `afterInteractive` (no render blocking)
- [x] Preconnect to Cloudinary, Google Fonts, Google Ads
- [x] GSC verification meta support (`settings.gscVerificationCode`)
- [x] Duplicate AdSense script removed from `_document.js`
- [x] Broken `getDb`/`toObjectId` imports fixed in `comments/like.js`
- [x] 2GB swap created for build stability

### ⏳ Pending (External / Manual)
- [ ] Submit sitemap to Google Search Console (requires Google account)
- [ ] Set GSC verification code in admin settings
- [ ] Create social media accounts (Twitter, Instagram)
- [ ] Facebook Pixel integration (requires ad platform)
- [ ] Content moderation API for user-uploaded images (requires AI API)

---

*This document is the canonical source of truth. All SEO changes must reference and comply with this playbook.*

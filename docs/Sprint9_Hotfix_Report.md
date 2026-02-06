# Sprint 9: Enterprise Hotfix Release
## Luvrix Platform — Production Fixes

**Release Date:** February 6, 2026  
**Version:** 9.1.0  
**Status:** ✅ Deployed

---

## Executive Summary

Sprint 9 addresses six critical production issues: blog publish flow, editor HTML/Word paste handling, client-side routing blank pages, mobile UI regressions, chapter redirect SEO safety, and auto-generated chapter content for indexing.

---

## Fix 1: Blog Publish Flow

### What was broken
- `createBlog()` result was not captured — no blogId available after publish
- Frontend navigated blindly without confirming creation succeeded
- `content_text` (plain text) was never stored alongside `content_html`

### Why it broke
- The `await createBlog(blogData)` return value was discarded
- No dual-format content processing existed

### What was changed
**File:** `pages/create-blog.js`
- Import `processContent` from `BlogEditor` to split content into `content_html` + `content_text`
- Capture `result.id` from API response before navigating
- Navigate to blog page (if auto-approved) or profile (if pending)
- Log errors with `console.error` for debugging

### Before → After
| Aspect | Before | After |
|--------|--------|-------|
| Blog ID captured | ❌ No | ✅ Yes |
| Dual content storage | ❌ No | ✅ `content` + `content_text` |
| Navigation target | Always `/` | Blog page or `/profile` |
| Error detail | Generic message | Actual error message |

---

## Fix 2: Blog Editor — HTML + Text Support

### What was broken
- Pasting HTML or Word content produced broken raw tags or junk formatting
- No plain-text extraction for SEO meta/schema

### What was changed
**File:** `components/BlogEditor.js`
- Exported utilities: `sanitizeHtml`, `htmlToPlainText`, `isHtmlContent`, `processContent`
- HTML detection via regex: `/<[a-z][\s\S]*>/i`
- DOMPurify sanitization with strict allowlist (no `<script>`, `<iframe>`, `<style>`, event handlers)
- Word paste cleanup: strips `Mso*` classes, `mso-*` styles, `data-*` attributes
- `processContent(raw)` returns `{ content_html, content_text }` for dual storage

### Security
- **XSS blocked:** `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>` forbidden
- **Event handlers blocked:** `onclick`, `onerror`, `onload`, `onmouseover`, `onfocus`, `onblur`
- **Attribute whitelist:** Only `href`, `src`, `alt`, `title` allowed

---

## Fix 3: Client-Side Routing Blank Page

### What was broken
Clicking "You Might Also Like" links loaded the correct URL but showed a blank page until manual refresh.

### Root cause
- `router.query.id` is `undefined` on first render during client-side navigation
- Fetch ran before `id` was available → empty response → blank UI
- SSR data from previous blog was stale but not cleared

### What was changed
**File:** `pages/blog.js`
- Added `router.isReady` guard: fetch only runs when query params are ready
- State resets (`setLoading(true)`, `setError(null)`) on every `id` change
- SSR data only used when `initialBlog.id === id` — forces client fetch for new blogs
- Added `error` state with user-friendly error UI

---

## Fix 4: Mobile UI Improvements

### What was broken
- Blog title overflowed on narrow screens (visible in screenshot)
- Hero image was fixed height, not responsive
- Content padding too large on mobile
- Prose typography not responsive

### What was changed
**File:** `pages/blog.js`
- Hero image: `aspect-video` on mobile, `h-[60vh]` on desktop
- Title: `text-2xl sm:text-3xl md:text-5xl` + `break-words line-clamp-4`
- Padding: `p-4 sm:p-6 md:p-12` (hero), `px-3 sm:px-4 py-6 md:py-12` (article)
- Prose: `prose-base md:prose-lg`, responsive heading sizes, `leading-relaxed md:leading-loose`
- Images: `prose-img:w-full`, code: `break-words`, pre: `overflow-x-auto`

---

## Fix 5: Auth Cleanup

### What was broken
- `lib/csrf.js` referenced `process.env.NEXTAUTH_SECRET` (next-auth not used)

### What was changed
- Replaced `NEXTAUTH_SECRET` fallback with `JWT_SECRET` in CSRF secret chain
- No functional imports of next-auth remain in the codebase

---

## Fix 6: Chapter Redirect System (SEO Safe)

### What was broken
- Auto-redirect fired unconditionally with 3-second delay
- Bots (Googlebot, Bingbot) were redirected away from indexable content
- No admin control over redirect behavior

### What was changed

**File:** `components/MangaRedirectBox.js` — Complete rewrite
- **Default:** Manual "Read Now" button only — NO auto redirect
- **Admin-enabled:** `autoRedirect` prop toggles countdown
- **Bot detection:** User-agent regex blocks redirect for crawlers
- **Progress bar** replaces large countdown number
- **`rel="nofollow noopener"`** on redirect link

**File:** `pages/manga/[slug]/[chapter].js`
- Reads `manga.autoRedirect` and `manga.redirectDelay` from DB
- Falls back to `settings.mangaRedirectDelay` or 5 seconds
- Added `ChapterContent` component (550+ words, server-rendered)

**File:** `pages/admin/manga.js` — Admin controls added
- Toggle: Auto Redirect (on/off, default OFF)
- Input: Redirect delay (seconds, 1–300)
- Input: Custom redirect URL override

### Manual vs Auto Redirect

| Setting | Behavior |
|---------|----------|
| `autoRedirect: false` (default) | "Read Now" button only, no countdown |
| `autoRedirect: true` | Countdown + progress bar + button, bots excluded |
| Bot user-agent detected | Never redirect, content always visible |

---

## Fix 7: Auto-Generated Chapter Content

### What was added
**File:** `pages/manga/[slug]/[chapter].js` — `ChapterContent` component

- 550+ words of unique, contextual content per chapter page
- Sections: Overview, Plot Summary, Character Analysis, Art Style, Series Context
- Uses manga title, chapter number, genre, author, status, total chapters
- Server-rendered for full SEO indexability
- SEO-friendly headings (h1, h2) with relevant keywords

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `components/BlogEditor.js` | HTML detection, sanitization, dual content, paste handler |
| `components/MangaRedirectBox.js` | Manual default, bot detection, admin-controlled auto-redirect |
| `pages/blog.js` | Routing fix, mobile UI, responsive typography |
| `pages/create-blog.js` | Capture blogId, dual content storage, smart navigation |
| `pages/manga/[slug]/[chapter].js` | Redirect props, 550+ word auto-generated content |
| `pages/admin/manga.js` | Redirect settings UI (toggle, delay, URL) |
| `lib/csrf.js` | Remove NEXTAUTH_SECRET reference |
| `docs/Sprint9_Hotfix_Report.md` | This document |

---

## Verification Checklist

- ✅ `npm run build` passes with no errors
- ✅ `.next/BUILD_ID` exists
- ✅ Blog publishes successfully with blogId returned
- ✅ Blog visible immediately after auto-approval
- ✅ HTML paste sanitized, plain text stored
- ✅ Client-side blog navigation renders without refresh
- ✅ Mobile title does not overflow
- ✅ Hero image 16:9 on mobile, 60vh on desktop
- ✅ Chapter pages default to manual redirect
- ✅ Admin can enable auto-redirect per manga
- ✅ Bots never redirected (content indexable)
- ✅ 550+ words generated per chapter page
- ✅ No next-auth imports remain
- ✅ No XSS vulnerabilities in editor

---

## Deployment

```bash
cd /var/www/luvrix
git pull origin main
npm install
NODE_OPTIONS="--max-old-space-size=512" npm run build
pm2 restart luvrix
pm2 status
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### Rollback
```bash
git log --oneline -3
git revert HEAD
npm run build && pm2 restart luvrix
```

---

**Approved For Production:** ✅  
*Sprint 9 Enterprise Hotfix Release — February 6, 2026*

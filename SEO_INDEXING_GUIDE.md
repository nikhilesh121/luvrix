# SEO Expert Guide: Faster Indexing & Deleted URL Management

**Date:** Feb 13, 2026  
**Site:** https://luvrix.com  
**Prepared by:** SEO Expert, Google Webmaster Expert, Bing Webmaster Expert

---

## Executive Summary

This guide provides actionable recommendations to:
1. **Index new content faster** — within hours instead of days/weeks
2. **Protect site health from deleted URLs** — prevent crawl budget waste and ranking dilution
3. **Optimize DNS configuration** for SEO best practices

---

## PART 1: FASTER INDEXING

### Current State Analysis

Your codebase already has excellent auto-indexing infrastructure:
- ✅ Google Sitemap Ping (`/ping?sitemap=`)
- ✅ IndexNow API integration (Bing, Yandex, Seznam, Naver)
- ✅ Google Indexing API support (requires setup)
- ✅ Auto-index logging to MongoDB

**BUT** these features are **NOT ACTIVE** because:
- ❌ `INDEXNOW_KEY` environment variable is not set
- ❌ IndexNow key verification file missing from `/public/`
- ❌ `GOOGLE_INDEXING_CREDENTIALS` not configured
- ❌ Bing Webmaster Tools not verified

---

### Action Item 1: Enable IndexNow (CRITICAL - Bing, Yandex, etc.)

IndexNow allows **instant** notification to Bing, Yandex, Seznam, and Naver when content changes. Pages can be indexed within **minutes** instead of days.

#### Step 1.1: Generate IndexNow Key
```bash
# Generate a random 32-character hex key
openssl rand -hex 16
# Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### Step 1.2: Create Key Verification File
Create file: `/public/{YOUR_KEY}.txt`  
Content: Just the key itself (same as filename without .txt)

```bash
# Example: if key is "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
echo "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" > public/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6.txt
```

#### Step 1.3: Set Environment Variable
Add to your `.env` or server environment:
```env
INDEXNOW_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### Step 1.4: Verify Setup
After deployment, test: `https://luvrix.com/{YOUR_KEY}.txt` should return the key.

---

### Action Item 2: Add Bing Webmaster Verification (CRITICAL)

Your DNS shows Google verification but **NO Bing verification**. Bing is the 2nd largest search engine and powers DuckDuckGo, Yahoo, and Ecosia.

#### Option A: DNS TXT Record (Recommended)
Add to Cloudflare DNS:
```
Type: TXT
Name: luvrix.com (or @)
Content: Get the verification code from Bing Webmaster Tools
TTL: Auto
Proxy: DNS only
```

#### Option B: Meta Tag
Add to `pages/_document.js` in the `<Head>`:
```jsx
<meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />
```

#### How to get Bing verification code:
1. Go to https://www.bing.com/webmasters/
2. Sign in with Microsoft account
3. Add site: https://luvrix.com
4. Choose verification method and get code

---

### Action Item 3: Submit Sitemaps to Search Engines

#### Google Search Console
1. Go to https://search.google.com/search-console/
2. Select property: luvrix.com
3. Sitemaps → Add: `https://luvrix.com/sitemap.xml`
4. Verify it shows "Success" status

#### Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters/
2. Sitemaps → Submit: `https://luvrix.com/sitemap.xml`

#### Yandex Webmaster (Optional but recommended for international traffic)
1. Go to https://webmaster.yandex.com/
2. Add site and verify (you already have yandex-verification TXT record!)
3. Submit sitemap

---

### Action Item 4: Enable Google Indexing API (HIGH PRIORITY)

The Google Indexing API provides **fastest possible** indexing for Google — pages can appear in search within **minutes**.

#### Step 4.1: Create Google Cloud Service Account
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable "Indexing API" in API Library
4. Create Service Account (IAM & Admin → Service Accounts)
5. Create JSON key and download

#### Step 4.2: Add Service Account to Search Console
1. Go to Google Search Console
2. Settings → Users and permissions
3. Add user: `your-service-account@project.iam.gserviceaccount.com`
4. Permission: Owner

#### Step 4.3: Set Environment Variable
```env
GOOGLE_INDEXING_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**Note:** The JSON must be on a single line with escaped quotes.

---

### Action Item 5: Optimize Crawl Signals

#### 5.1: Add Last-Modified Headers (Code Change Required)
Add to `next.config.js` headers or middleware:
```javascript
// For dynamic pages, set Last-Modified to content's updatedAt
response.headers.set('Last-Modified', new Date(content.updatedAt).toUTCString());
```

#### 5.2: Improve Sitemap Freshness Signals
Your sitemaps already include `<lastmod>` — ensure it reflects actual content update time, not server time.

#### 5.3: Internal Linking Strategy
- New content should be linked from homepage or high-traffic pages
- Add "Recently Updated" or "New Content" sections
- Cross-link related content (already good with related blogs)

---

## PART 2: DELETED URL MANAGEMENT

### Current State: EXCELLENT ✅

Your deleted URL handling is already well-implemented:

| Protection | Status | Implementation |
|------------|--------|----------------|
| HTTP 410 Gone for chapters | ✅ Active | `middleware.js` line 39-41 |
| X-Robots-Tag: noindex header | ✅ Active | Middleware adds header |
| robots.txt blocks chapters | ✅ Active | `Disallow: /manga/*/chapter*` |
| Deleted manga excluded from sitemap | ✅ Active | `sitemaps/[type].js` |
| Soft 404 prevention | ✅ Active | `getServerSideProps` returns `notFound: true` |

### Additional Recommendations

#### Action Item 6: Use Google Search Console URL Removal Tool

For **immediate** removal of deleted URLs from Google's index:

1. Go to Google Search Console → Removals
2. New Request → Enter URL or prefix
3. For chapters: Use prefix `https://luvrix.com/manga/` and filter by "chapter"
4. This temporarily hides URLs for 6 months while 410 signals propagate

#### Action Item 7: Use Bing URL Removal Tool

1. Go to Bing Webmaster Tools → Configure My Site → Block URLs
2. Add patterns for deleted content
3. URLs will be removed within 24-48 hours

#### Action Item 8: Monitor Crawl Errors

**Google Search Console:**
- Pages → Indexing → Check "Not indexed" reasons
- Look for "Crawled - currently not indexed" (may indicate thin content)
- Look for "Soft 404" errors (should be zero after fixes)

**Bing Webmaster Tools:**
- Reports & Data → Crawl Information
- Check for 4xx errors and ensure they're expected (deleted content)

---

## PART 3: DNS CONFIGURATION AUDIT

### Current DNS Analysis

| Record | Status | Notes |
|--------|--------|-------|
| A record (luvrix.com) | ✅ Good | Proxied through Cloudflare |
| CNAME www → luvrix.com | ✅ Good | Properly redirects www |
| MX records | ✅ Good | Hostinger mail configured |
| SPF record | ✅ Good | Prevents email spoofing |
| DKIM records | ✅ Good | Brevo + Hostinger DKIM |
| DMARC | ⚠️ Weak | `p=none` doesn't enforce |
| CAA records | ✅ Excessive | 14 CA records is overkill |
| Google verification | ✅ Present | Site verified |
| Yandex verification | ✅ Present | Site verified |
| Bing verification | ❌ Missing | **Add this!** |

### DNS Recommendations

#### Action Item 9: Add Bing Verification TXT Record
```
Type: TXT
Name: luvrix.com
Content: [Get from Bing Webmaster Tools]
TTL: Auto
Proxy: DNS only
```

#### Action Item 10: Strengthen DMARC Policy (Optional)
Current: `p=none` (monitoring only)
Recommended after monitoring period:
```
v=DMARC1; p=quarantine; rua=mailto:rua@dmarc.brevo.com
```
This quarantines suspicious emails instead of just monitoring.

#### Action Item 11: Simplify CAA Records (Low Priority)
You have 14 CAA records for multiple CAs. Consider keeping only:
- `letsencrypt.org` (if using Let's Encrypt)
- `pki.goog` (if using Google Trust Services)
- Remove others you don't actively use

**This is low priority** — extra CAA records don't hurt SEO but add DNS clutter.

#### Action Item 12: Consider Adding AAAA Record (IPv6)
If your server supports IPv6, add an AAAA record. Google slightly prefers IPv6-enabled sites.

---

## PART 4: IMPLEMENTATION CHECKLIST

### Immediate Actions (Do Today)

- [ ] **Generate IndexNow key** and create verification file
- [ ] **Set INDEXNOW_KEY** environment variable
- [ ] **Verify site in Bing Webmaster Tools**
- [ ] **Submit sitemap** to Bing Webmaster Tools
- [ ] **Check Google Search Console** for any crawl errors

### This Week

- [ ] **Set up Google Indexing API** service account
- [ ] **Review Google Search Console** indexing coverage report
- [ ] **Use URL Removal Tool** for any stubborn deleted URLs
- [ ] **Add Bing verification** TXT record to DNS

### Ongoing Monitoring

- [ ] **Weekly:** Check GSC & Bing for new crawl errors
- [ ] **Weekly:** Monitor index_requests collection for auto-index success rate
- [ ] **Monthly:** Review "Crawled but not indexed" pages
- [ ] **Monthly:** Audit sitemap for any unwanted URLs

---

## PART 5: TECHNICAL IMPLEMENTATION

The following code changes will be made to enable faster indexing:

### Files to Create/Modify

1. **`/public/{INDEXNOW_KEY}.txt`** — IndexNow verification file
2. **`pages/_document.js`** — Add Bing meta verification tag
3. **`middleware.js`** — Ensure IndexNow key file is accessible
4. **`.env`** — Add INDEXNOW_KEY (manual step on server)

---

## Summary

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| 🔴 Critical | Enable IndexNow | Instant Bing/Yandex indexing | Low |
| 🔴 Critical | Verify Bing Webmaster | Access to Bing tools | Low |
| 🟠 High | Google Indexing API | Instant Google indexing | Medium |
| 🟠 High | Submit sitemaps everywhere | Ensure discovery | Low |
| 🟡 Medium | URL Removal for chapters | Speed up de-indexing | Low |
| 🟢 Low | Simplify CAA records | DNS hygiene | Low |

---

## Appendix: Environment Variables Reference

```env
# IndexNow (Bing, Yandex, Seznam, Naver)
INDEXNOW_KEY=your-32-char-hex-key

# Google Indexing API (optional but recommended)
GOOGLE_INDEXING_CREDENTIALS={"type":"service_account",...}

# Site URL (already set)
NEXT_PUBLIC_SITE_URL=https://luvrix.com
```

---

*Document Version: 1.0*  
*Last Updated: Feb 13, 2026*

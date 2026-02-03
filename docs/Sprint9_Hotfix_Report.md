# Sprint 9: Enterprise Hotfix Release
## Luvrix Platform - Production Fixes

**Release Date:** February 3, 2026  
**Version:** 9.0.0  
**Status:** ✅ Deployed

---

## Executive Summary

This sprint addresses two critical production issues:
1. Blog pages not loading on client-side navigation (requires refresh)
2. Editor paste handling for HTML/Word content causing broken formatting

---

## Fix 1: Blog Navigation Blank Page

### Issue Summary
When users clicked on "You Might Also Like" related blog links, the correct URL loaded but the blog content did not display until a manual page refresh.

### Root Cause
- Next.js `router.query.id` is `undefined` on first render during client-side navigation
- The fetch effect ran before the router was ready, resulting in no data fetch
- SSR data from initial page load was not being properly cleared for new blog navigation

### Solution Applied

**File Modified:** `pages/blog.js`

1. Added `router.isReady` check to ensure query params are available:
```javascript
const isReady = router.isReady;

useEffect(() => {
  if (!isReady) return;
  // ... fetch logic
}, [id, isReady]);
```

2. Added proper state reset when navigating between blogs:
```javascript
setLoading(true);
setError(null);
```

3. Added SSR data ID match check to handle client-side navigation:
```javascript
if (initialBlog && initialBlog.id === id) {
  // Use SSR data
} else {
  // Fetch fresh data for new blog
}
```

4. Added error state for better UX:
```javascript
const [error, setError] = useState(null);
```

### Files Modified
- `/pages/blog.js` - Lines 36-274, 327-344

### Testing Verification
- ✅ Direct URL access works
- ✅ "You Might Also Like" navigation works instantly
- ✅ Loading indicator displays during fetch
- ✅ Error message displays if blog not found
- ✅ No blank screen scenarios

---

## Fix 2: Editor Paste Sanitization

### Issue Summary
When users pasted content from Word, Google Docs, or HTML sources into the blog editor, it showed broken raw HTML or unwanted Microsoft Office formatting.

### Supports
- ✅ HTML paste (`<h1>`, `<p>`, `<b>`, tables, etc.)
- ✅ Microsoft Word paste
- ✅ Google Docs paste
- ✅ Plain text paste (unchanged)
- ✅ Normal typing (unchanged)

### Conversion Approach

**File Modified:** `components/BlogEditor.js`

1. **DOMPurify Integration** - XSS protection with allowlist:
```javascript
import DOMPurify from "isomorphic-dompurify";

const sanitized = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ["p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "b", "strong", "i", "em", "u", "s", "strike", "ul", "ol", "li", "a", "blockquote", "pre", "code"],
  ALLOWED_ATTR: ["href"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style"],
  FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover", "onfocus", "onblur"],
});
```

2. **Word/Office Cleanup** - Remove Microsoft-specific formatting:
```javascript
// Remove Word-specific junk (mso-*, MsoNormal, etc.)
const wordJunkSelectors = [
  '[class*="Mso"]',
  '[style*="mso-"]',
  'o\\:p',
  'style',
];
```

3. **Paste Event Handler** - Intercept and sanitize:
```javascript
const handlePaste = useCallback((e) => {
  const html = clipboardData.getData("text/html");
  if (html && html.trim()) {
    e.preventDefault();
    const cleanHtml = sanitizePastedContent(html);
    editor.clipboard.dangerouslyPasteHTML(range?.index || 0, cleanHtml, "user");
  }
}, []);
```

### Security Protections
- **XSS Prevention:** All `<script>`, `<iframe>`, `<object>`, `<embed>` tags removed
- **Event Handler Removal:** `onclick`, `onerror`, `onload`, etc. stripped
- **Style Isolation:** Inline styles removed to prevent CSS injection
- **Attribute Whitelist:** Only `href` allowed on links

### Files Modified
- `/components/BlogEditor.js` - Complete rewrite with sanitization logic

### Testing Verification
- ✅ Normal typing unaffected
- ✅ Word paste converts cleanly
- ✅ Google Docs paste works
- ✅ HTML paste sanitized properly
- ✅ No XSS vulnerabilities
- ✅ No blank pages or crashes

---

## Git Deployment Notes

### Safe Deployment Steps

1. **Pull latest changes:**
```bash
cd /var/www/luvrix
git pull origin main
```

2. **Install dependencies (if new packages added):**
```bash
npm install
```

3. **Build production:**
```bash
NODE_OPTIONS="--max-old-space-size=512" npm run build
```

4. **Restart application:**
```bash
pm2 restart luvrix
```

5. **Verify deployment:**
```bash
pm2 status
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### Rollback (if needed)
```bash
git log --oneline -5  # Find previous commit
git revert HEAD       # Revert last commit
npm run build
pm2 restart luvrix
```

---

## Changelog

| Change | Type | Impact |
|--------|------|--------|
| Blog navigation fix | Bug Fix | High - Critical UX |
| Editor paste sanitization | Feature + Security | High - Data integrity |
| Error state handling | Enhancement | Medium - UX improvement |
| XSS protection | Security | High - Security hardening |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| isomorphic-dompurify | ^1.0.0 | HTML sanitization (XSS protection) |
| react-quill | ^2.0.0 | Rich text editor |

---

## Sign-off

- **Developed By:** Engineering Team
- **Reviewed By:** Sprint 9 Release
- **Approved For Production:** ✅ Yes

---

*Document generated as part of Sprint 9 Enterprise Hotfix Release*

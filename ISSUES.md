# Luvrix WebApp — Open Issues

## Issue 1: Dark Mode Text Readability
**Status:** ✅ Fixed  
**Priority:** High  
**Description:** Blog content, headings, and list items have poor contrast in dark mode — gray text on dark background is hard to read.  
**Fix applied:**
- [x] `styles/globals.css` — Added `.dark .blog-content` rules for h1-h3, p, li, blockquote, strong, code, th, td + scrollbar + card + form dark variants
- [x] `components/BlogContentRenderer.js` — Added `dark:` variants to all 7 PROSE_CLASSES templates (headings, paragraphs, lists, blockquotes, code, strong, hr) + MediaBlock + LazyInContentAd
- [x] `pages/blog.js` — Added `dark:` variants to progress bar, floating share, top/bottom ads, engagement bar, like button, share buttons, tags, author card, related articles, comments heading
- [x] `components/BlogHero.js` — Added `dark:` variants for no-image background, title, back link, AuthorMeta text/name/avatar colors
- [x] `components/BlogTemplates.js` — Added `dark:` variants for Magazine, Minimal, Newsletter hero backgrounds/text/borders + Newsletter content card
- [x] `pages/edit-blog.js` — Added `dark:` variants to page bg, header, all card containers, labels, inputs, error/success alerts, media modal, cancel button

## Issue 2: In-Content Media Missing in Edit Blog
**Status:** ✅ Already Implemented  
**Priority:** High  
**Description:** Verified that `edit-blog.js` already has full mediaItems support: state (line 53), fetch from DB (line 113), save to DB (line 187), and complete UI with add/remove/modal (lines 385-513).

## Issue 3: Scroll Lag / Performance on Create & Edit Blog Pages
**Status:** ✅ Fixed  
**Priority:** Medium  
**Description:** Infinite framer-motion animations in create-blog.js hero (background blobs scaling/fading, floating elements bouncing) caused scroll jank by repainting every frame.  
**Fix applied:**
- [x] `pages/create-blog.js` — Replaced 4 infinitely repeating `motion.div` animations with static CSS divs. Simplified hero title/subtitle from animated to static elements. Background blobs now use plain CSS with `pointer-events-none`.
- [x] `pages/edit-blog.js` — Already minimal (single one-shot animation wrapper), no changes needed.

## Issue 4: Dark Mode Blog Text Still Too Dim
**Status:** ✅ Fixed  
**Priority:** High  
**Description:** Blog content paragraph text is still too dark/dim in dark mode (`text-gray-300` not bright enough), making it hard to read against the dark background.  
**Fix applied:**
- [x] `styles/globals.css` — Lightened `.dark .blog-content` base text, p, li, td from `text-gray-300` → `text-gray-200`; blockquote from `text-gray-400` → `text-gray-300`
- [x] `components/BlogContentRenderer.js` — Updated all 7 PROSE_CLASSES templates: `dark:prose-p:text-gray-300` → `dark:prose-p:text-gray-200`, same for `prose-li` and `prose-blockquote` dark variants

## Issue 5: "Back to Home" & Category Badge Too Close
**Status:** ✅ Fixed  
**Priority:** High  
**Description:** In the blog hero, the "Home" back link and the category badge (e.g. "Sports") are vertically cramped with insufficient spacing.  
**Fix applied:**
- [x] `components/BlogHero.js` — Increased Home link `mb-3 sm:mb-4` → `mb-4 sm:mb-5` (with-image) and `mb-4` → `mb-5 sm:mb-6` (no-image); category badge `mb-2.5 sm:mb-3` → `mb-3 sm:mb-4`
- [x] `components/BlogTemplates.js` — Increased back link margin in all 6 template heroes (Magazine `mb-6→mb-8`, Minimal `mb-8→mb-10`, Cinematic `mb-8→mb-10`, Newsletter `mb-6→mb-8`, Bold `mb-8→mb-10`, Video `mb-6→mb-8`); increased category badge margins similarly

## Issue 6: Mobile Hero Metadata Not Inline
**Status:** ✅ Fixed  
**Priority:** High  
**Description:** On mobile, the hero metadata (author, date, read time, views) stacks vertically instead of flowing inline, creating a messy layout.  
**Fix applied:**
- [x] `components/BlogHero.js` — AuthorMeta: reduced mobile font `text-xs` → `text-[11px]`, tighter gaps `gap-x-3` → `gap-x-2.5 sm:gap-x-3`, `gap-y-1.5` → `gap-y-1`, stats inner gap `gap-1` → `gap-0.5 sm:gap-1`
- [x] `components/BlogTemplates.js` — Same AuthorMeta compact mobile treatment applied to template-shared component

## Issue 7: Light Mode Default + Move Theme Toggle to Dropdown
**Status:** ✅ Fixed  
**Priority:** High  
**Description:** Light mode should be the default (no system dark preference fallback). Theme toggle should be removed from the main navbar and placed in the user profile dropdown menu instead.  
**Fix applied:**
- [x] `context/ThemeContext.js` — Removed system dark preference fallback; light is now always the default for new users (only respects saved localStorage preference)
- [x] `components/Header.js` — Removed standalone `<ThemeToggle />` from desktop navbar and mobile quick actions bar
- [x] `components/Header.js` — Added "Light Mode / Dark Mode" toggle row inside the user profile dropdown (between nav links and Sign Out)
- [x] `components/Header.js` — Added theme toggle icon for non-logged-in desktop users (next to Sign In)
- [x] `components/Header.js` — Added "Light Mode / Dark Mode" button at the bottom of the mobile hamburger menu

## Issue 8: Admin Control for Default Theme, Blog Reading Colors & Typography Spacing
**Status:** ✅ Fixed  
**Priority:** High  
**Description:** Admin needs ability to set default theme (light/dark) for new visitors, control blog reading text/heading/link colors for both light and dark mode, and adjust typography spacing (heading margins, paragraph margins, line-height, letter-spacing, word-spacing) — all with preset options + custom input.  
**Fix applied:**
- [x] `pages/admin/theme.js` — Added "Blog Reading" tab with:
  - Default Theme Mode toggle (light/dark) with visual cards
  - Light Mode section: body text color, heading color, link color (each with 8-10 preset swatches deep→light + color picker + hex input)
  - Dark Mode section: body text color, heading color, link color (same controls)
  - Typography Spacing section: H1/H2/H3 margin-top & margin-bottom, paragraph margin-bottom, line-height, letter-spacing, word-spacing (each with dropdown presets + custom text input)
  - Live Preview panel showing both light and dark mode with selected colors AND spacing
  - Preset arrays: spacingPresets (0–4rem), lineHeightPresets, letterSpacingPresets, wordSpacingPresets
- [x] `context/ThemeContext.js` — Updated to fetch `defaultTheme` from `/api/settings` when no saved user preference exists; falls back to 'light' on error
- [x] `styles/globals.css` — Replaced hardcoded Tailwind color/spacing classes in `.blog-content` rules with CSS custom properties (`--blog-text-color`, `--blog-heading-color`, `--blog-link-color`, `--blog-h1-mt`, `--blog-h1-mb`, `--blog-h2-mt`, `--blog-h2-mb`, `--blog-h3-mt`, `--blog-h3-mb`, `--blog-p-mb`, `--blog-line-height`, `--blog-letter-spacing`, `--blog-word-spacing` + dark color variants) with sensible fallback defaults
- [x] `pages/blog.js` — Injected `<style jsx global>` that sets all CSS custom properties from settings onto `:root`

**Settings keys added:** `defaultTheme`, `blogTextColorLight`, `blogTextColorDark`, `blogHeadingColorLight`, `blogHeadingColorDark`, `blogLinkColorLight`, `blogLinkColorDark`, `blogH1MarginTop`, `blogH1MarginBottom`, `blogH2MarginTop`, `blogH2MarginBottom`, `blogH3MarginTop`, `blogH3MarginBottom`, `blogParagraphMarginBottom`, `blogLineHeight`, `blogLetterSpacing`, `blogWordSpacing`

## Issue 9: Giveaway System — Full Implementation
**Status:** ✅ Fixed  
**Priority:** High  
**Description:** Implement a fully legal, SEO-safe, task-based Giveaway system with homepage integration, admin controls, sponsor support, and audit-safe winner selection. Joining is free, tasks determine eligibility, winners selected randomly from eligible users only, physical prizes only, all selections audit-logged.

**Files created:**
- [x] `docs/GIVEAWAY_SYSTEM.md` — Full design document
- [x] `lib/giveaway.js` — Server-side DB operations (CRUD, eligibility check, task completion, invite system, winner selection with hard-block enforcement, index creation)
- [x] `pages/api/giveaways/index.js` — List (public: active only; admin: all) + Create (admin)
- [x] `pages/api/giveaways/[id].js` — Get (public) + Update/Delete (admin)
- [x] `pages/api/giveaways/[id]/join.js` — Free join (authenticated users)
- [x] `pages/api/giveaways/[id]/tasks.js` — GET tasks (public) + POST/DELETE (admin)
- [x] `pages/api/giveaways/[id]/complete-task.js` — Complete a task, auto-check eligibility
- [x] `pages/api/giveaways/[id]/participants.js` — Count (public) + Full list with user enrichment (admin)
- [x] `pages/api/giveaways/[id]/winner.js` — SYSTEM_RANDOM or ADMIN_RANDOM selection, hard-blocks non-eligible, audit logged with CRITICAL severity
- [x] `pages/api/giveaways/[id]/my-status.js` — User's participation status
- [x] `pages/api/giveaways/[id]/invite.js` — Validate invite code + award points
- [x] `pages/admin/giveaways.js` — Admin panel: list/create/edit giveaways, task manager, participants view with search/filter, winner selection (auto-random + manual from eligible only)
- [x] `components/GiveawayCard.js` — Reusable card with countdown timer, prize info, status badges
- [x] `pages/giveaway/index.js` — Public list page (active + past giveaways, SEO meta, legal notice)
- [x] `pages/giveaway/[slug].js` — Public detail page (hero image, countdown, progress bar, join CTA, task list, invite section, eligibility status, structured data JSON-LD, fairness notice)
- [x] `pages/giveaway-terms.js` — Legal terms page (10 sections: free entry, no purchase, task eligibility, random selection, physical prizes, platform discretion, support disclaimer, data usage, eligibility, contact)

**Files modified:**
- [x] `lib/api-client.js` — Added 14 giveaway API wrapper functions
- [x] `pages/index.js` — Added GiveawaysSection (shows up to 3 active giveaways before CTA section, auto-hides if none active)
- [x] `components/Header.js` — Added "Giveaways" menu item with FiGift icon to defaultMenuData + iconMap

**Key enforcement rules (server-side):**
- Winner selection hard-blocks non-eligible participants (`participant.status !== 'eligible'` → throws error)
- All winner selections logged in `giveaway_winner_logs` collection + `audit_logs` with CRITICAL severity
- Eligibility requires all required tasks completed + points threshold (task_gated mode)
- Giveaways locked after winner selection (status = `winner_selected`)
- Draft giveaways only can be deleted

**MongoDB collections:** `giveaways`, `giveaway_tasks`, `giveaway_participants`, `giveaway_winner_logs`

---
*Updated: Feb 10, 2026*

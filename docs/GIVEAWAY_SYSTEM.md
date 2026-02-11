# Giveaway System — Design Document

**Project:** Luvrix (Next.js + MongoDB)  
**Created:** Feb 10, 2026  
**Last Updated:** Feb 10, 2026 (Session 2)  
**Status:** ✅ COMPLETED

---

## 1. Overview

A fully legal, SEO-safe, task-based Giveaway system with:
- Free entry (no purchase required)
- Task-based eligibility (not money-based)
- Random winner selection from eligible users only
- Admin controls for creation, management, and winner selection
- Audit logging for all winner selections
- Physical rewards only
- Homepage integration + SEO structured data

### Non-Negotiable Rules
- Joining is FREE
- Tasks + invites determine eligibility, NOT money
- Support is OPTIONAL and does NOT affect eligibility or winning
- Rewards are PHYSICAL ITEMS ONLY
- Winners selected RANDOMLY from ELIGIBLE users
- Admin manual selection allowed ONLY from ELIGIBLE users
- All winner selections logged
- No paid actions influence eligibility or outcome

---

## 2. Database Collections (MongoDB) ✅

### 2.1 `giveaways`
```js
{
  _id: ObjectId,
  title: String,              // required
  slug: String,               // unique, auto-generated from title
  description: String,        // rich text
  imageUrl: String,           // required — hero image
  prizeDetails: String,       // what the winner gets (physical item)
  mode: String,               // "random" | "task_gated"
  requiredPoints: Number,     // points needed for eligibility (task_gated mode)
  targetParticipants: Number, // goal participant count
  startDate: Date,
  endDate: Date,
  maxExtensions: Number,      // days the end date can be extended (0 = no extension)
  winnerSelectionMode: String, // "SYSTEM_RANDOM" | "ADMIN_RANDOM"
  sponsors: [                  // optional sponsor banners
    { bannerUrl: String, redirectUrl: String, name: String }
  ],
  extensionsUsed: Number,     // default 0
  invitePointsEnabled: Boolean, // whether invite-based points are active
  invitePointsCap: Number,    // max invite points per user
  invitePointsPerReferral: Number, // points per successful invite
  status: String,             // "draft" | "active" | "ended" | "winner_selected"
  winnerId: String,           // userId of winner (set after selection)
  createdBy: String,          // admin userId
  createdAt: Date,
  updatedAt: Date,
}
```
**Indexes:** `{ slug: 1 }` (unique), `{ status: 1, startDate: -1 }`, `{ endDate: 1 }`

### 2.2 `giveaway_tasks`
```js
{
  _id: ObjectId,
  giveawayId: String,         // references giveaways._id
  type: String,               // "quiz" | "visit" | "follow" | "invite" | "custom"
  title: String,
  description: String,
  points: Number,             // points awarded on completion
  required: Boolean,          // must complete for eligibility
  metadata: Object,           // type-specific data (quiz answers, URLs, etc.)
  createdAt: Date,
}
```
**Indexes:** `{ giveawayId: 1 }`

### 2.3 `giveaway_participants`
```js
{
  _id: ObjectId,
  giveawayId: String,
  userId: String,
  points: Number,             // total earned points
  inviteCount: Number,        // successful invites
  completedTasks: [String],   // array of task _ids completed
  status: String,             // "participant" | "eligible" | "winner"
  inviteCode: String,         // unique per user per giveaway
  joinedAt: Date,
  eligibleAt: Date,           // when they became eligible (null if not)
}
```
**Indexes:** `{ giveawayId: 1, userId: 1 }` (unique compound), `{ giveawayId: 1, status: 1 }`, `{ inviteCode: 1 }` (unique)

### 2.4 `giveaway_winner_logs`
```js
{
  _id: ObjectId,
  giveawayId: String,
  winnerUserId: String,
  selectionMode: String,      // "SYSTEM_RANDOM" | "ADMIN_RANDOM"
  selectedByAdminId: String,  // null for SYSTEM_RANDOM
  reason: String,             // optional note
  selectedAt: Date,
}
```
**Indexes:** `{ giveawayId: 1 }`

---

## 3. API Routes ✅

All routes under `/pages/api/giveaways/`:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/giveaways` | Public | List active giveaways |
| GET | `/api/giveaways/[id]` | Public | Get giveaway by id or slug |
| POST | `/api/giveaways` | Admin | Create giveaway |
| PUT | `/api/giveaways/[id]` | Admin | Update giveaway |
| DELETE | `/api/giveaways/[id]` | Admin | Delete giveaway (draft only) |
| POST | `/api/giveaways/[id]/join` | User | Join giveaway (free) |
| POST | `/api/giveaways/[id]/tasks/[taskId]/complete` | User | Complete a task |
| GET | `/api/giveaways/[id]/participants` | Admin | List participants |
| POST | `/api/giveaways/[id]/winner` | Admin | Select winner |
| GET | `/api/giveaways/[id]/my-status` | User | Get current user's participation status |
| POST | `/api/giveaways/[id]/invite` | User | Validate invite code + award points |
| GET | `/api/giveaways/my-giveaways` | User | Get user's joined giveaways |
| GET | `/api/giveaways/[id]/winner-info` | Public | Get winner name/photo for display |
| POST | `/api/giveaways/[id]/shipping` | Winner | Submit shipping details |
| GET/POST | `/api/giveaways/[id]/support` | User/Admin | Record/view support amounts |

### Auth Pattern (follows existing project pattern)
```js
const token = req.headers.authorization?.replace('Bearer ', '');
const decoded = verifyToken(token);
// For admin routes: check user.role === 'ADMIN'
```

### Eligibility Logic (server-enforced)
```js
function isEligible(participant, giveaway, tasks) {
  // 1. Check all required tasks are completed
  const requiredTasks = tasks.filter(t => t.required);
  const allRequiredDone = requiredTasks.every(t => participant.completedTasks.includes(t._id.toString()));
  if (!allRequiredDone) return false;
  
  // 2. In task_gated mode, check points threshold
  if (giveaway.mode === 'task_gated' && participant.points < giveaway.requiredPoints) return false;
  
  return true;
}
```

### Winner Selection (server-enforced)
```js
// Hard block: MUST be eligible
if (participant.status !== 'eligible') {
  throw new Error('Cannot select non-eligible participant as winner');
}
```

---

## 4. Pages ✅

### 4.1 Public Pages
| Route | File | Description |
|-------|------|-------------|
| `/giveaway` | `pages/giveaway/index.js` | List all active giveaways |
| `/giveaway/[slug]` | `pages/giveaway/[slug].js` | Giveaway detail page |
| `/giveaway-terms` | `pages/giveaway-terms.js` | Legal terms page |

### 4.2 Admin Pages
| Route | File | Description |
|-------|------|-------------|
| `/admin/giveaways` | `pages/admin/giveaways.js` | Admin giveaway management |

---

## 5. Admin Panel Features ✅

Located in `pages/admin/giveaways.js`:
- [x] **List view:** All giveaways with status badges
- [x] **Create/Edit form:** Title, image, prize, mode, required points, target participants, dates, end date extension days
- [x] **Winner selection mode:** Auto Random (system) or Manual by Admin — configurable per giveaway
- [x] **Sponsor banners:** Add/remove sponsor banners with image URL, optional redirect URL, and optional name
- [x] **Task manager:** Add/remove tasks with type, title, description, points, required flag
- [x] **Invite settings:** Enable/disable invite points, set cap, set points per referral
- [x] **Participants tab:** View all participants, search by email/username, filter eligible only
- [x] **Winner selection:** Toggle auto-random vs admin-random, select from eligible only, audit logged
- [x] **Lock after winner:** Giveaway locked after winner selected (status = "winner_selected")
- [x] **Admin sidebar:** Giveaways link added to AdminSidebar.js with FiGift icon

---

## 6. Public Giveaway Detail Page ✅

### Sections:
1. [x] **Hero:** Full-width image with title overlay
2. [x] **Prize details:** What the winner gets
3. [x] **Countdown timer:** Live countdown to endDate
4. [x] **Participant progress bar:** current / target participants
5. [x] **Join CTA:** "Join Giveaway" button (free, requires login)
6. [x] **Eligibility status:** Shows user's current status (participant/eligible)
7. [x] **Tasks section:** List of tasks with completion status (if task_gated)
8. [x] **Invite section:** Referral link + invite count (if invites enabled)
9. [x] **Legal notice:** Mandatory fairness text
10. [x] **Sponsor banners:** Multiple sponsor banners with optional redirect URL (admin-configurable)
11. [x] **Support PayU payment:** Inline payment form with preset amounts (₹50, ₹100, ₹200, ₹500) + manual input, direct PayU integration
12. [x] **Winner shipping form:** Winner can submit shipping details to claim prize

### Mandatory Legal Text:
> "Joining is free. Completing required tasks is mandatory for eligibility. Supporting Luvrix does not affect chances of winning."

---

## 7. Homepage Integration ✅

Add a "Giveaways" section on the homepage (`pages/index.js`):
- [x] Show only `status === "active"` giveaways (section hidden entirely when no active giveaways)
- [x] Display: image, title, prize summary, countdown timer
- [x] CTA: "View Giveaway" → links to `/giveaway/[slug]`
- [x] Positioned after categories section, before CTA section
- [x] Responsive grid layout
- [x] "View All Giveaways" button links to `/giveaway`

---

## 8. Navigation ✅

- [x] Added to Header.js defaultMenuData (Manga + Giveaways always appended after admin-managed menus)
- [x] Removed hardcoded "Technology" menu item from defaults
- [x] When admin saves custom menus, Manga (if visible) and Giveaways are always preserved
- [x] Added FiGift to iconMap
- [x] Added to AdminSidebar.js menuItems

---

## 9. SEO & Structured Data ✅

### Meta Tags (giveaway detail page):
- `<title>` — giveaway title
- `<meta name="description">` — prize details
- `<meta name="robots" content="index, follow">`
- Open Graph tags (og:title, og:image, og:description)

### Structured Data (JSON-LD):
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "giveaway title",
  "description": "prize details",
  "image": "imageUrl",
  "startDate": "startDate ISO",
  "endDate": "endDate ISO",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
  "organizer": {
    "@type": "Organization",
    "name": "Luvrix",
    "url": "https://luvrix.com"
  }
}
```

---

## 10. Legal Terms Page (`/giveaway-terms`) ✅

Content:
1. [x] **Free Entry** — No purchase necessary
2. [x] **No Purchase Required** — Separate from support features
3. [x] **Task-Based Eligibility** — Free tasks, not payment-based
4. [x] **Random Winner Selection** — From eligible pool, audit logged
5. [x] **Physical Prizes Only** — No cash equivalent
6. [x] **Platform Discretion** — Luvrix reserves right to modify/cancel
7. [x] **Support Disclaimer** — Supporting Luvrix does not affect chances
8. [x] **Data Usage** — Participant data used only for giveaway purposes
9. [x] **Eligibility** — Open to registered users, compliant with Indian law
10. [x] **Contact** — Links to contact page

---

## 11. Files to Create/Modify

### New Files:
- [x] `lib/giveaway.js` — Server-side DB operations
- [x] `pages/api/giveaways/index.js` — List + Create
- [x] `pages/api/giveaways/[id].js` — Get + Update + Delete
- [x] `pages/api/giveaways/[id]/join.js` — Join giveaway
- [x] `pages/api/giveaways/[id]/tasks.js` — Manage tasks
- [x] `pages/api/giveaways/[id]/complete-task.js` — Complete a task
- [x] `pages/api/giveaways/[id]/participants.js` — List participants
- [x] `pages/api/giveaways/[id]/winner.js` — Select winner
- [x] `pages/api/giveaways/[id]/my-status.js` — User's status
- [x] `pages/api/giveaways/[id]/invite.js` — Validate invite
- [x] `pages/giveaway/index.js` — Public list page
- [x] `pages/giveaway/[slug].js` — Public detail page
- [x] `pages/giveaway-terms.js` — Legal terms
- [x] `pages/admin/giveaways.js` — Admin management
- [x] `components/GiveawayCard.js` — Card component for list/homepage

### Modified Files:
- [x] `pages/index.js` — Add giveaways section (hidden when no active giveaways)
- [x] `components/Header.js` — Add navigation item, remove Technology, always append Manga+Giveaways
- [x] `components/AdminSidebar.js` — Add Giveaways link to admin sidebar
- [x] `lib/api-client.js` — Add giveaway API wrappers (my-giveaways, winner-info, shipping, support, initiatePayment)
- [x] `pages/api/giveaways/my-giveaways.js` — User's joined giveaways
- [x] `pages/api/giveaways/[id]/winner-info.js` — Public winner display
- [x] `pages/api/giveaways/[id]/shipping.js` — Winner shipping form
- [x] `pages/api/giveaways/[id]/support.js` — Support amount recording
- [x] `components/ConfettiWinner.js` — Winner confetti celebration component
- [x] `components/AnimatedCTA.js` — Animated call-to-action button with states
- [x] `utils/email.js` — Winner email notification template
- [x] `pages/profile.js` — My Giveaways tab

---

## 12. Implementation Order

1. [x] `lib/giveaway.js` — DB operations
2. [x] API routes (all under `/api/giveaways/`)
3. [x] `lib/api-client.js` — Client wrappers
4. [x] `pages/admin/giveaways.js` — Admin panel (uses `admin-layout` CSS class)
5. [x] `components/GiveawayCard.js` — Reusable card with live countdown
6. [x] `pages/giveaway/index.js` — Public list page
7. [x] `pages/giveaway/[slug].js` — Public detail with JSON-LD structured data
8. [x] `pages/giveaway-terms.js` — Legal page (10 sections)
9. [x] `pages/index.js` — Homepage section (always visible, empty-state when no active giveaways)
10. [x] `components/Header.js` — Nav item
11. [x] `components/AdminSidebar.js` — Admin sidebar link
12. [x] Build & verify — passes with exit code 0

---

## 13. Session 2 Updates (Feb 10, 2026)

### Bug Fixes
- [x] **Slug→ID resolution:** Fixed critical bug where `my-status`, `tasks`, and `participants` APIs received URL slug but queried by giveaway ObjectId. All three APIs now resolve slug→giveaway first.
- [x] **Join state display:** After joining, user now correctly sees "Joined" state instead of "Join" button.

### New Features
- [x] **Support PayU payment:** Replaced simple link with inline payment form — preset amounts (₹50, ₹100, ₹200, ₹500), manual input, direct PayU form submission.
- [x] **Sponsor banners:** Admin can add multiple sponsor banners per giveaway (banner image URL, optional redirect URL, optional sponsor name). Displayed on detail page with click-through tracking.
- [x] **Winner Selection Mode:** Added "Auto Random" (SYSTEM_RANDOM) and "Manual by Admin" (ADMIN_RANDOM) toggle in admin giveaway create/edit form.
- [x] **End Date Extension:** Renamed "Max Extensions" to "End Date Extension (days)" with clear description.
- [x] **Winners Hall:** New section on giveaway list page showing all past winners with their names.
- [x] **Homepage conditional:** Giveaway section only renders when active giveaways exist (no empty state on homepage).

### Menu Management
- [x] Removed hardcoded "Technology" menu from Header defaults.
- [x] Manga and Giveaways links always appended after admin-managed navigation menus.
- [x] Admin menu page (`/admin/menus`) has full CRUD for all dropdown menus.

### Files Modified (Session 2)
- `pages/api/giveaways/[id]/my-status.js` — slug→ID fix
- `pages/api/giveaways/[id]/tasks.js` — slug→ID fix
- `pages/api/giveaways/[id]/participants.js` — slug→ID fix
- `pages/giveaway/[slug].js` — Support PayU, sponsor banners, imports
- `pages/giveaway/index.js` — Winners Hall section
- `pages/admin/giveaways.js` — Winner selection mode, sponsor CRUD, extension label
- `pages/index.js` — Conditional giveaway section
- `components/Header.js` — Remove Technology, always append Manga+Giveaways

---

## 14. Session 3 Updates (Feb 10, 2026)

### Full UI Revamp — Dark Theme
- [x] **Giveaway list page** (`pages/giveaway/index.js`): Complete dark theme (`bg-[#0a0a0f]`), animated gradient mesh background, floating particles, parallax scroll hero, shimmer text animation, quick stats pills (Active/Winners/Free).
- [x] **Giveaway detail page** (`pages/giveaway/[slug].js`): Full dark theme, all cards converted to `bg-[#12121a]` with `border-white/5`, animated gradient orbs in hero, dark form inputs, dark sidebar.
- [x] **Ended giveaway state**: Animated rotating trophy icon, gradient text "Winner Announced!", purple overlay on hero image, shimmer border on winner banner.
- [x] **Loading/error states**: Dark themed with purple spinner and dark backgrounds.

### New Features
- [x] **View All Winners button**: Added to giveaway detail page hero, links to `/giveaway#winners`. Winners Hall section on list page has `id="winners"` anchor.
- [x] **Donors list per giveaway**: New "Supporters" section on detail page showing up to 20 donors with name, photo, and amount. Scrollable list with stagger animation.
- [x] **Total donation amount**: Displayed in sidebar card (green gradient) showing total ₹ and supporter count. Also shown in the donors section header.
- [x] **Admin dashboard donations**: New "Giveaway Donations" stat card (₹ total + donor count). New per-giveaway donation breakdown table with image, title, donation count, and total amount.

### API Changes
- [x] **`GET /api/giveaways/[id]/support`**: Now public (no auth required for GET). Returns `{ total, count, supporters[] }` with enriched user names and photos. Also resolves slug→ID.
- [x] **`GET /api/giveaways/donation-stats`**: New admin-only endpoint returning `{ grandTotal, grandCount, perGiveaway[] }` with giveaway titles, slugs, images, and per-giveaway donation totals.

### Database Functions Added (`lib/giveaway.js`)
- [x] `getGiveawaySupporters(giveawayId)` — Returns supporters with enriched user names and photos.
- [x] `getAllDonationStats()` — Aggregates all donations grouped by giveaway with grand totals.

### Files Modified (Session 3)
- `pages/giveaway/index.js` — Complete dark theme revamp with animated background
- `pages/giveaway/[slug].js` — Dark theme, donors list, donation total, View All Winners button
- `pages/admin/dashboard.js` — Donation stat card + per-giveaway breakdown section
- `pages/api/giveaways/[id]/support.js` — Public supporters list, slug→ID resolution
- `pages/api/giveaways/donation-stats.js` — New admin-only donation stats endpoint
- `lib/giveaway.js` — Added `getGiveawaySupporters()` and `getAllDonationStats()`

---

## 15. Session 4 Updates

### Bug Fixes
- [x] **Slug encoding:** All fetch calls in `[slug].js` now use `encodeURIComponent(slug)` to handle slugs with spaces or special characters. Hardened all fetch `.then()` chains with `.ok` checks and fallback error objects.
- [x] **FiTrophy icon:** Replaced all `FiTrophy` references with `FiAward` — `FiTrophy` doesn't exist in installed `react-icons` version.

### New Features
- [x] **Live / Upcoming / Completed tabs** on giveaway list page (`/giveaway`). Users can now filter giveaways by status. Tab bar with pill counts and animated transitions.
- [x] **Admin: Shipping details tab.** New "Shipping" tab in admin giveaway detail view shows winner's submitted shipping info (full name, phone, address, city, state, pincode, country, submission date).
- [x] **Admin: Donations tab.** New "Donations" tab in admin giveaway detail view shows per-giveaway donors with name, email (admin-only), amount, anonymous flag, and date.
- [x] **Donor system overhaul:**
  - Donors can now provide name and email during donation (optional).
  - "Show as Anonymous publicly" checkbox — hides donor name on public page, admin still sees real name + email.
  - `recordGiveawaySupport()` now stores `donorName`, `donorEmail`, `isAnonymous`.
  - `getGiveawaySupporters()` accepts `{ isAdmin }` flag — admin sees full details, public sees anonymous-respecting names.
- [x] **Admin Donations page** (`/admin/donations`):
  - Stats cards: Total ₹, unique donors count, total transactions.
  - "All Donations" tab: Full list with donor name, email, giveaway, amount, date, anonymous badge.
  - "Top Donors" tab: Aggregated by email — ranked with gold/silver/bronze badges, donation count, total ₹.
  - Search by name, email, or giveaway title.
- [x] **Admin sidebar:** Added "Donations" link with FiHeart icon.

### API Changes
- [x] **`POST /api/giveaways/[id]/support`**: Now accepts `donorName`, `donorEmail`, `isAnonymous` in request body.
- [x] **`GET /api/giveaways/[id]/support`**: Detects admin via auth token; returns full donor details for admin, anonymous-respecting names for public.
- [x] **`GET /api/giveaways/[id]/shipping-details`**: New admin-only endpoint returning winner shipping data.
- [x] **`GET /api/giveaways/all-donors`**: New admin-only endpoint returning all donations + top donors aggregation.

### Database Functions Added/Updated (`lib/giveaway.js`)
- [x] `recordGiveawaySupport()` — Updated to accept `{ donorName, donorEmail, isAnonymous }`.
- [x] `getGiveawaySupporters()` — Updated with `{ isAdmin }` flag for access control.
- [x] `getWinnerShipping(giveawayId)` — New function to retrieve winner shipping details.
- [x] `getAllDonors()` — New function returning all donations enriched with user/giveaway info + top donors by email.

### Files Modified (Session 4)
- `pages/giveaway/[slug].js` — Encode slug, donor name/email/anonymous UI fields, FiTrophy→FiAward
- `pages/giveaway/index.js` — Live/Upcoming/Completed tabs, FiTrophy→FiAward, FiClock import
- `pages/admin/giveaways.js` — Shipping tab, Donations tab in detail view
- `pages/admin/donations.js` — New full donation management page
- `pages/admin/dashboard.js` — (from session 3, already has donation stats)
- `pages/api/giveaways/[id]/support.js` — Donor fields, admin detection
- `pages/api/giveaways/[id]/shipping-details.js` — New admin-only endpoint
- `pages/api/giveaways/all-donors.js` — New admin-only endpoint
- `lib/giveaway.js` — Updated support functions, new getWinnerShipping, getAllDonors
- `components/AdminSidebar.js` — Added Donations link + FiHeart import

---

## 16. Session 5 Updates — Bug Fixes & Favorites

### Bug Fixes
- [x] **Completed tab empty:** `GET /api/giveaways` was returning only `status: 'active'` for public users. Changed to `$in: ['active', 'ended', 'winner_selected']` so Completed and Live tabs both have data.
- [x] **Upcoming tab operator precedence:** Filter `g.status === "active" && new Date(g.startDate) > now || ...` had no parentheses, producing wrong results. Fixed with proper grouping and null-safe `startDate` checks.
- [x] **Donation data not showing:** Old donations without `donorName`/`donorEmail` fields now display correctly because `getGiveawaySupporters()` falls back to user profile name/email.
- [x] **Favorites check API:** `check.js` was querying by `{ itemId, userId, itemType }` with default `itemType='manga'`, breaking giveaway checks. Now uses composite `_id: ${userId}_${itemId}` matching how favorites are stored.

### New Features
- [x] **Winner shipping: edit mode.** If a winner has already submitted shipping details:
  - Shows a summary of submitted details (name, phone, address) with an **"Edit Details"** button.
  - Clicking Edit opens the same form pre-filled with existing data.
  - Button text changes to "Update" instead of "Submit".
  - Shipping API `GET /api/giveaways/[id]/shipping` now returns existing shipping data to the winner (was POST-only before).
- [x] **Favorite/unfavorite giveaways:**
  - Added a **Save/Saved** button to the giveaway detail page header.
  - Created `POST /api/favorites/toggle` endpoint that atomically toggles a favorite (add or remove).
  - Favorite state is checked on page load via `/api/favorites/check`.
  - Button uses `FiHeart` icon with fill when favorited.
- [x] **Favorites page giveaway support:**
  - Favorites page now fetches and displays giveaway favorites alongside blog favorites.
  - Added **"Giveaways"** filter tab to the filter bar.
  - Giveaway cards show image, title, status badge (Live/Winner/Ended), and prize details.
  - Hero stats show separate counts for Articles and Giveaways.

### API Changes
- [x] **`GET /api/giveaways`**: Public users now receive active, ended, and winner_selected giveaways (not just active).
- [x] **`GET /api/giveaways/[id]/shipping`**: New method — returns existing shipping details for the winner.
- [x] **`POST /api/favorites/toggle`**: New endpoint — toggles favorite on/off, returns `{ favorited: true/false }`.
- [x] **`GET /api/favorites/check`**: Fixed to use composite `_id` lookup instead of field-based query with wrong default `itemType`.

### Files Modified (Session 5)
- `pages/api/giveaways/index.js` — Return all non-draft giveaways for public users
- `pages/giveaway/index.js` — Fixed upcoming filter operator precedence, null-safe startDate
- `pages/giveaway/[slug].js` — Shipping edit mode, favorite button + toggle logic, fetch existing shipping
- `pages/api/giveaways/[id]/shipping.js` — Added GET method for winner to fetch existing shipping
- `pages/api/favorites/toggle.js` — New toggle endpoint
- `pages/api/favorites/check.js` — Fixed composite _id lookup
- `pages/favorites.js` — Added giveaway support: fetch, filter tab, card rendering, counts

---

## 17. Session 6 Updates — Timer Enhancement & Unlimited Extension

### Enhancements
- [x] **Countdown timer redesign:**
  - Each time unit (Days/Hours/Min/Sec) now has its own gradient background color (purple/blue/pink/amber).
  - Font size increased to `text-2xl sm:text-3xl font-black` with `font-mono tracking-tight`.
  - Spring animation on each digit change for a satisfying bounce effect.
  - Animated purple glow orb behind the timer card with pulsing opacity.
  - Live green pulsing dot in the header indicating the timer is running.
  - Staggered entrance animation on each time box.
- [x] **Unlimited End Date Extension (`maxExtensions: -1`):**
  - Admin form: End Date Extension replaced with preset pill buttons (None, 3d, 7d, 14d, 30d, **♾ Unlimited**). Custom input shown for non-preset values.
  - When Unlimited is selected, description changes to explain the giveaway runs indefinitely.
  - Backend `createGiveaway` / `updateGiveaway`: Fixed `|| 0` fallback that was converting `-1` to `0`. Now uses proper `!= null` check.
  - Frontend detail page: When `maxExtensions === -1` and countdown has ended:
    - `isActive` remains `true` (giveaway stays joinable).
    - Timer shows animated **♾** infinity symbol with "No Time Limit" text instead of "Ended".
    - Header shows **"♾ OPEN"** purple badge instead of "ENDED" red badge.
    - Glow effect and pulsing dot remain active.

### Files Modified (Session 6)
- `pages/giveaway/[slug].js` — Enhanced countdown timer UI, unlimited extension display logic
- `pages/admin/giveaways.js` — Replaced extension input with preset pill buttons + Unlimited option
- `lib/giveaway.js` — Fixed `maxExtensions` storage for `-1` in `createGiveaway` and `updateGiveaway`

---

## 18. Session 7 Updates — Multi-Task System & SEO Verification

### Multi-Task System Enhancement
- [x] **Expanded TASK_TYPES** with 14 specific presets:
  - `facebook_like`, `facebook_follow` (📘)
  - `instagram_follow` (📸)
  - `youtube_like`, `youtube_subscribe` (🎬)
  - `twitter_follow`, `twitter_like` (🐦)
  - `visit_website` (🌐)
  - `join_telegram` (✈️), `join_discord` (💬)
  - `share_post` (🔗), `invite` (👥), `quiz` (❓)
  - `custom` (⚡) — admin enters custom title
- [x] **Admin task form redesign:**
  - Quick-add preset grid — click a preset to auto-fill type + title
  - URL input field shown dynamically for social/URL-based tasks with platform-specific placeholders
  - Type dropdown, points, title, description, required checkbox
  - URL stored in `task.metadata.url`
- [x] **Admin task list** shows task type icon, label, points, URL link
- [x] **User-facing task UI** enhanced:
  - Platform-specific icons (emoji) for each task type
  - "Visit" button opens the task URL in new tab before marking complete
  - Points display per-giveaway: "Your points: X / Y required"
  - "Done ✓" button to mark task complete
- [x] **Per-giveaway points verified:** Points stored in `giveaway_participants.points` scoped by `giveawayId`. `completeTask()` awards points, checks eligibility, and updates status to `eligible` when threshold met.

### SEO Verification & Fixes
- [x] **robots.txt:** Added `Allow: /giveaway`, added `Sitemap: .../sitemap-giveaways.xml`
- [x] **Sitemap:** Created `pages/api/sitemap/giveaways.js` — generates XML sitemap with all non-draft giveaways + index page. Active giveaways get `priority=0.9`, ended get `priority=0.6`.
- [x] **Sitemap index** (`pages/api/sitemap/index.js`): Added giveaway sitemap entry
- [x] **Static pages sitemap** (`pages/api/sitemap/pages.js`): Added `/giveaway` with `priority=0.8`
- [x] **next.config.js:** Added rewrite `/sitemap-giveaways.xml` → `/api/sitemap/giveaways`
- [x] **.htaccess:** Added giveaway SPA fallback rewrite, HTTPS force, www→non-www redirect, enhanced security headers (HSTS with preload, Referrer-Policy, Permissions-Policy)
- [x] **Page-level SEO verified:**
  - `/giveaway` index: `<Head>` with OG tags, canonical, robots index/follow ✅
  - `/giveaway/[slug]`: Dynamic OG tags, canonical, structured data (JSON-LD Event schema), robots index/follow ✅
  - `_document.js`: Organization JSON-LD, theme-color, manifest, preconnect hints ✅
  - `next.config.js`: Security headers (CSP, HSTS, X-Frame-Options, etc.), compression, cache headers ✅

### Files Modified (Session 7)
- `pages/admin/giveaways.js` — Expanded TASK_TYPES, redesigned task form with presets + URL, enhanced task list display
- `pages/giveaway/[slug].js` — Enhanced user-facing task UI with icons, Visit links, points display
- `public/robots.txt` — Added giveaway Allow + sitemap entry
- `public/.htaccess` — Added giveaway SPA fallback, HTTPS redirect, www removal, enhanced security headers
- `pages/api/sitemap/giveaways.js` — New giveaway sitemap endpoint
- `pages/api/sitemap/index.js` — Added giveaway sitemap to index
- `pages/api/sitemap/pages.js` — Added /giveaway to static pages
- `next.config.js` — Added giveaway sitemap rewrite

---

*All items completed. Build passes (exit code 0). End of design document.*

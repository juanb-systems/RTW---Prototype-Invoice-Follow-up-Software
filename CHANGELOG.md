# CollectPilot — Change Log

---

## v2.29.0 — Inbox Detail Panel (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.29.0

### Changed

**Inbox layout — two-panel split (Gmail/Outlook style):**
- Clicking a message no longer expands a large block inline inside the list.
- Desktop: left panel (inbox list, ~380px fixed) + right panel (message detail, `flex-1`). Each panel scrolls independently. The list height never changes when a message is opened.
- Mobile: tapping a message switches to a full-screen detail view. "Back" / "← Inbox" button returns to the list. Filter and search state is preserved when navigating back.
- The selected row is highlighted with a blue left-border accent and blue tint (`bg-blue-50`).
- Empty state placeholder on desktop when no message is selected.

**New `MessageDetail` component:**
- Header bar: back/close button + communication type badge (Email Reply / AI Call Transcript / Voicemail) + unread indicator.
- Subject heading + sender name + company + formatted date.
- Invoice summary card: invoice number, amount, company, direct "View invoice →" link.
- **Combined status alert** — one box only (not multiple stacked banners). If dispute + needs_review occur together, both bullets appear in a single red box. Removes the previous pattern of 2–3 stacked warning banners.
- **Recommended action** — one blue box with a single plain-English sentence. Appears after the status alert.
- Message body or transcript in a clean, readable panel (not a cramped `<pre>` textarea).
- Sticky action footer: Pause Automation button, Reply button (email only), Back to inbox button.

**New `TranscriptView` component:**
- Parses AI call transcript lines for speaker labels (`AI caller:` / `Customer:`).
- Renders as a two-column chat format: left column (speaker label in colored text), right column (message text).
- Falls back to plain text if no speaker labels are detected.
- Fixed max-height with scroll so long transcripts don't push content off screen.

**`InboxRow` simplified:**
- Removed `ChevronDown`/`ChevronUp` toggle entirely.
- No expanded section — row is just the summary (sender, subject, preview, badge, date).
- `onClick` prop replaces the old `onSelect` / `onPatch` pattern; message reads are handled in `InboxPageContent`.

**Deep links preserved:**
- `?message=<id>` query param still opens the correct message in the detail panel on initial load.
- On mobile, deep link also switches to the detail view automatically.

**`patchMessage` updated:**
- Now also updates `selectedMessage` state (not just the `messages` array), so pausing automation or marking as replied reflects immediately in the detail panel without a re-fetch.

---

## v2.28.0 — Simplified Daily Workflow (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.28.0

### Navigation

**Sidebar restructured into 2 groups:**
- **Daily Work:** Dashboard, Invoices, Inbox, Actions
- **Setup:** Automations, Templates, Contacts, Onboarding

**Renamed nav items:**
- "Scheduled Actions" → "Actions" (shorter, task-focused label)
- "Call Templates" → "Templates" (broader scope, less jargon)

### Dashboard

**Simplified language throughout:**
- KPI label updated to "Outstanding Balance" for plain-English clarity
- Activity feed section labelled "System Activity" for unambiguous context
- Needs Attention copy rewritten in plain English — no automation/lookup jargon; each card reads as a direct action prompt

### Invoices

**Plain-English primary status on mobile cards:**
- Mobile invoice cards show one single plain-English status label (e.g. "Overdue 23 days", "Disputed", "Awaiting approval") instead of multiple competing badges
- Status is derived from the most actionable signal on the invoice, not the raw data field name

**Automation column renamed:**
- "Flow" column header renamed to "Automation" on the desktop invoice table for clarity

### Actions page (formerly Scheduled Actions)

**Renamed from Scheduled Actions to Actions.**

**Plain-English tab labels:**
- Tab labels rewritten to plain English (e.g. "Pending", "Sent", "Skipped", "Blocked") — removed internal status code language

**Safety check language:**
- "Run Lookup & Fire" button and related copy updated to "Run Safety Check & Send" — replaces lookup jargon with language that reflects what the check actually does

---

## v2.27.0 — Inbox Layout Refinement (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.27.0

### Changed

**Row structure simplified to 3 clean lines:**
- **Line 1:** `Sender · Company` on the left; `[Badge — desktop only]` + `Date` on the right. Badge and date are right-aligned as a unit, never buried in the content area.
- **Line 2:** Subject line only — no metadata competing on this line.
- **Line 3:** Preview text (desktop only, muted, truncated).
- **Mobile:** Badge shown below subject (hidden on desktop). Date always right-aligned on Line 1 on both mobile and desktop — it doesn't move to a separate line.

**Badge moved to right column:**
Removed the separate "Line 3: Type · Invoice# · Badge" row that was cluttering every row. Badge now sits alongside the date on the right, which is where Gmail puts secondary metadata. This frees up the content area to show only sender → subject → preview.

**Type label row removed:**
The explicit "Email Reply" / "AI Call Transcript" / "Voicemail" text row has been removed. The left-side icon (Mail / Phone / Voicemail) communicates the type visually. The subject line itself already says "AI Call Transcript — Invoice INV-2026-013" or "RE: Friendly reminder — ...". The separate text label was redundant and added a line of noise.

**Company inline on Line 1:**
`message.contact?.company` is now rendered inline after the sender name as `· Company` text in `text-gray-400`. Previously it was a separate flex item that could wrap or compete with other line-1 elements.

**Uniform row backgrounds:**
All rows now use `hover:bg-gray-50` on mouse-over. Selected row: `bg-blue-50/30` + left accent. No more different background tints per read/unread state — unread is communicated entirely by text weight (bold vs normal) and the blue dot.

**Unread/read contrast:**
- Unread: sender `font-semibold text-gray-900`, subject `font-semibold text-gray-800`, date `font-medium text-gray-700`
- Read: sender `font-medium text-gray-600`, subject `text-gray-500`, date `text-gray-400`

**Mobile badge placement:**
On mobile screens the badge is hidden from Line 1's right column (to keep date visible without crowding). The badge instead appears below the subject line as a small compact chip. This ensures the date is always prominent on mobile.

---

## v2.26.0 — Gmail-style Inbox Clarity Pass (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.26.0

### Changed

**Row structure — 4 clear lines instead of one crowded line:**
- **Line 1:** Sender name (left, bold if unread) + date/time (right, `text-gray-600` if unread / `text-gray-500` if read — no longer the too-faint gray-400)
- **Line 2:** Subject (bold/semibold if unread, normal if read)
- **Line 3:** Type label (`Email Reply` / `AI Call Transcript` / `Voicemail` with source icon) + invoice number link + single primary badge
- **Line 4:** Preview text, truncated, muted — desktop only

**Visual hierarchy — read vs unread:**
- Unread rows: `bg-white`, semibold sender, semibold subject, date `text-gray-600`
- Read rows: `bg-gray-50/30` (subtle tint so "seen" items visually recede), normal weight, date `text-gray-500`
- Selected/open rows: `bg-blue-50/40` + blue left-border accent (`border-l-2 border-l-blue-500`) spanning both header and expanded section

**Row separation:** Changed `divide-y divide-gray-50` to `divide-y divide-gray-100` for clearer row boundaries.

**Type labels:** Replaced the generic source icon (Mail/Phone) with an explicit labelled tag on Line 3 — "Email Reply", "AI Call Transcript", or "Voicemail" — so the content type is unambiguous at a glance.

**Expanded section improvements:**
- Added **Recommended action** banner at the top (blue info box) — contextual guidance per classification (dispute, promise, needs review, OOO, voicemail, payment query).
- Added **Invoice summary** card showing invoice#, amount, and company with a direct link — replaces the bare "View Invoice →" button.
- Body/transcript section now has an explicit section label ("Message" or "Call Transcript") in small caps.
- Removed the separate "View Invoice →" link button from action row (invoice is now surfaced in the summary card above).

**Mobile layout:**
- Date is hidden from the right-column on mobile (would compete with sender name on small screens).
- Date is shown instead on a dedicated line below Line 3 content at `text-[11px] text-gray-400`.
- Company name hidden on mobile (`hidden sm:inline`) to reduce line-1 crowding.

**TopBar subtitle:** Changed from "N unread · N emails · N AI calls" to "Customer replies & call transcripts" (shows unread count only when non-zero) — reinforces that Inbox is for customer communications, not system activity.

---

## v2.25.0 — Simplified Daily Workflow UX (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.25.0

### Changed

#### Inbox — Gmail-style redesign
- Flat list layout replacing the previous card-heavy design; unified `InboxRow` component handles both email replies and AI call records in a single consistent row.
- Single primary badge per row (classification or call status) — removed secondary indicator clutter.
- Sender-first layout: sender name is the dominant label, subject line secondary, date right-aligned in the row header.
- Removed info banners (dispute detected, promise-to-pay) that appeared inline within expanded messages; status context is conveyed by the classification badge and reply detail only.
- 7 filter tabs retained: All / Emails / AI Calls / Unread / Promise to Pay / Dispute / Out of Office.

#### Dashboard — Needs Attention improvements
- **Needs Attention section moved above KPIs** — now the first element on the Dashboard so urgent items are seen before headline numbers.
- Section is always visible (not conditionally hidden when count is zero); shows a clean "All clear" state when nothing needs attention.
- Two new overdue buckets added: **30–60 days overdue** and **60+ days overdue** — each shows count and total value with plain-language copy ("X invoices 30–60 days overdue, $Y outstanding").
- Existing attention cards (disputes, blocked, awaiting approval, paused, unread replies, promises to pay) retain their links and counts; copy simplified to be more direct.

#### Invoices — status clarity
- **Mobile card layout** — needs-attention flag banner added to mobile invoice cards when the invoice has a dispute, blocked action, or awaiting-approval state; renders above the status/flow row.
- **Richer status context** — status chip in the mobile card and invoice detail now includes a short plain-language descriptor alongside the badge (e.g. "Overdue · 23 days", "Disputed · awaiting review").
- **Desktop Flow column decluttered** — removed the secondary "Next: {type} · {date}" sub-row from the Flow column on desktop; next action date is still visible on the invoice detail Status Overview panel.

---

## v2.24.0 — Functional Dark Mode (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.24.0

### Added

- **Dark mode** — app-wide dark theme applied via a global CSS override strategy in `globals.css`. Non-`@layer` CSS rules beat `@layer utilities` in the cascade, meaning `.dark .bg-white { ... }` overrides Tailwind's `.bg-white` without modifying any component files.
- **System mode** — follows `prefers-color-scheme` via `next-themes` `ThemeProvider` (already wired). Stored as `"system"` in localStorage.
- **Preferences restored** — Light / System / Dark all clickable. `useTheme()` from `next-themes` manages selection. Preference persists in localStorage and survives refresh.

### Dark mode coverage

**Neutral surfaces:** `bg-white` → slate-800, `bg-gray-50` → slate-900, `bg-gray-100/200/300` scaled accordingly.

**Colored tints (badges, alerts, status chips):** All `bg-*-50` and `bg-*-100` variants for blue, green, red, orange, amber, purple, teal, indigo, yellow converted to low-opacity dark equivalents (e.g. `bg-blue-50` → `rgba(29,78,216,0.15)`). Corresponding text and border colors updated to their lighter counterparts (`text-blue-700` → blue-300, etc.).

**Text:** `text-gray-900/800/700/600/500/400` all remapped to readable slate equivalents.

**Borders + dividers:** `border-gray-100/200/300` → dark slate. `divide-gray-50/100` → dark.

**Hover states:** All `hover:bg-gray-50/100` and key colored hover variants converted.

**Form elements:** Input, textarea, select get dark backgrounds/text/borders via element selector.

**Shadows:** Deepened in dark mode for better surface separation.

**Toggle thumb:** `[role="switch"] > span` gets a targeted override (higher specificity than the broad `bg-white` rule) to keep toggle thumbs light against colored or dark tracks.

### Pages checked in dark mode
Dashboard, Invoices, Invoice Detail, Contacts, Contact Detail, Inbox, Notifications, Automations, Automation Builder, Scheduled Actions, Call Templates, Settings, Preferences, Setup & Onboarding, mobile 390px.

### Known limitations
- **Recharts charts** (Dashboard aging bar chart + collections trend line chart): SVG fill/stroke colors are set as Recharts props, not CSS classes, so they do not adapt to dark mode. Chart containers go dark but chart elements (bars, lines, axis labels, tooltips) retain their original colors.
- **Solid action buttons** (`bg-blue-600`, `bg-green-600` etc.) are intentionally unchanged — they look correct on dark backgrounds without modification.
- The sidebar (zinc-900) is already dark and unchanged.

---

## v2.23.0 — Fix Preferences Appearance Options (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.23.0

### Fixed

- **Preferences appearance selector** — Dark and System options were selectable but had no effect, creating a broken/misleading UX. Both are now rendered as non-interactive `div` elements with `cursor-not-allowed`, `select-none`, greyed-out icons and text, and a "Coming soon" label. Clicking them does nothing.
- **Light mode tile** — rendered as a `cursor-default` active tile (blue border/background). Not a button since there is nothing else to switch to.
- **Copy updated** — removed misleading "your preference is saved" amber notice. Replaced with plain grey text: *"Dark mode and system theme are coming soon. Light mode is currently the only supported theme in this prototype."*
- **Removed unused imports** — `useEffect`, `useState`, and `useTheme` from next-themes are no longer imported in the preferences page (no longer needed since the theme selector is now static).

---

## v2.22.0 — Preferences Page (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.22.0

### Added

- **`/preferences` page** — new page accessible from the sidebar account menu. Sections:
  - **Appearance** — Light / System / Dark theme selector using `next-themes`. Selection is persisted. Includes an amber notice that dark mode component theming is in progress and Light mode is the current supported theme.
  - **Layout** — Compact mode toggle (persisted to `localStorage` via Zustand).
  - **Notifications** — Notification sounds toggle and Email digest toggle (both persisted).
- **`lib/preferences-store.ts`** — new Zustand `persist` store for non-theme preferences (`compactMode`, `notificationSounds`, `emailDigest`). Persists to `localStorage` under key `collectpilot-preferences`.
- **`app/providers.tsx`** — `ThemeProvider` client wrapper from `next-themes`. Wired into root layout. Attribute `class`, default theme `light`, system detection enabled.

### Changed

- **`app/layout.tsx`** — wrapped with `<Providers>` to enable `next-themes` ThemeProvider. Added `suppressHydrationWarning` to `<html>` to prevent hydration mismatch on theme class.
- **Sidebar account menu** — Preferences changed from a disabled "Coming soon" div to an active `<Link href="/preferences">` with hover state. Account remains disabled. Settings remains active.

---

## v2.21.0 — Sidebar Account Menu Polish (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.21.0

### Changed

- **Account menu disabled states** — Account, Preferences, and Sign out are now static `div` elements (not buttons) with `cursor-default select-none`. No hover background, no pointer cursor — they are visually inert and cannot be mistaken for clickable items.
- **Clearer prototype labels** — "Soon" → "Coming soon" on Account and Preferences; "Demo only" → "Disabled in demo" on Sign out.
- **Demo mode row** — converted from a disabled `<button>` to a plain informational `div`. Retains the "Active" badge. Not interactive.
- **Settings** — remains the sole active/clickable item with hover state, pointer cursor, and full text color.
- **Disabled text color** — reduced from `zinc-300/zinc-400` (medium) to `zinc-600` (dim) on disabled items so the contrast difference from the active Settings item is immediately apparent.

---

## v2.20.0 — Sidebar Profile Account Menu (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.20.0

### Fixed

- **Sidebar profile block behavior** — removed direct navigation to `/settings` when clicking the "James Cooper" profile block at the bottom of the sidebar. The profile block now opens an account popover menu instead of navigating immediately.

### Added

- **Account popover menu** — clicking the profile block opens a small card/popover above the block containing prototype-safe menu items:
  - **Account** — disabled with "Soon" label (placeholder for future profile page)
  - **Preferences** — disabled with "Soon" label (placeholder for future preferences)
  - **Settings** — active link, navigates to `/settings` and closes the menu
  - **Demo mode** — disabled, shows "Active" badge indicating prototype context
  - **Sign out** — disabled with "Demo only" label
- **ChevronUp indicator** — rotates to show open/closed state of the popover.
- **Click-outside to close** — `mousedown` listener closes the menu when clicking anywhere outside the profile block.

### Notes

- The **Settings nav item** in the sidebar remains separate and fully functional — it is not affected by this change.
- The account menu works identically in both the desktop sidebar and the mobile drawer (both use the same `Sidebar` component).
- Popover uses `bottom-full` positioning so it always appears above the profile block, `z-50` to float above page content, and is not clipped by any `overflow-hidden` ancestor.

---

## v2.19.0 — Notifications Page & Dropdown (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.19.0

### Added

- **`/notifications` page** — dedicated notifications page with 15 seeded notifications, 7 filter tabs (All / Unread / Invoices / Replies / Automations / Calls / System), per-category icon badges (ShieldX, CheckCircle2, AlertTriangle, MessageSquare, Phone, PauseCircle, Settings), read/unread status (blue dot indicator + bold text + blue background for unread), detail text beneath each item, timestamp labels, and action links to relevant pages. Includes prototype info banner.
- **Sidebar nav entry** — "Notifications" (Bell icon) added to the Daily Work group in the sidebar.
- **TopBar bell dropdown** — now shows top 3 notifications (PREVIEW_NOTIFICATIONS) with unread count badge (UNREAD_COUNT), uses `timeLabel` for timestamps, and "See all notifications →" link at the bottom navigating to `/notifications`.
- **`lib/notifications-data.ts`** — shared notification data module (15 items, `NotifCategory` type, `AppNotification` interface, `UNREAD_COUNT` export) used by both the TopBar dropdown and the notifications page.

---

## v2.18.0 — Mobile Responsiveness Overhaul (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.18.0

### Added

- **Invoices page — mobile card layout** — at viewport widths < 640px (`sm` breakpoint) the desktop table is hidden and replaced with a stacked card list. Each card shows: invoice number + amount on one row, contact name/company, status badge + days overdue + reply classification badge, due date + flow name + automation status badge, and a "View invoice →" link. The desktop table (`hidden sm:block`) is unchanged.
- **Contacts page — mobile card layout** — same pattern. Mobile cards show: avatar + name + status badge + company, email with `break-all` wrapping, phone number, invoice count + overdue count + total owed, and a "View contact →" link. Desktop table unchanged.

### Fixed

- **Scheduled Actions TopBar "Refresh" button** — icon-only on mobile (`hidden sm:inline` text, `title` tooltip). Prevents "Scheduled Actions" title from truncating on 360–390px screens.
- **Inbox TopBar "Refresh" button** — same fix; prevents "Inbox" title from being crowded.
- **Call Templates TopBar "Create Call Template" button** — icon-only on mobile. Prevents "Call Templates" title truncation and the button overflowing the header.
- **ScheduledActionCard action buttons** — `flex-wrap` added to the buttons row so "Approve & Run Lookup" + "Skip" can stack on 320px screens instead of overflowing.

### Notes

- All desktop layouts (sm+) are fully preserved — `hidden sm:block` for tables, `sm:hidden` for cards.
- Widths audited: 320px, 360px, 375px, 390px, 414px, 768px.
- Empty states are now pulled out of `<tbody>` to shared `<div>` elements above both layouts.

---

## v2.17.0 — Mobile Dashboard Fix (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.17.0

### Fixed

- **KPI cards — currency overflow** — restructured `KpiCard` layout: title and icon now share a top row, the value paragraph sits below and spans the full card inner width with no icon competing for space. This eliminates the `$227,400.00` overflow at all tested widths (360/390/430/768px). Card padding reduced to `p-3 sm:p-5`; value text `text-xl sm:text-2xl`; icon `h-7 w-7 sm:h-10 sm:w-10`. Card has `overflow-hidden` as a safety net.
- **Dashboard TopBar title truncation** — `DemoScenarioButton` now shows icon-only on mobile (`<span className="hidden sm:inline">`). On screens < 640px the button is just the play-circle icon (~32px) instead of full-text (~130px), giving the title room to render "Dashboard" without truncation.
- **DemoScenarioButton result popup** — popup width changed from fixed `w-72` to `w-[min(18rem,calc(100vw-2rem))]` so it never exceeds the viewport width on narrow screens.
- **Invoice detail amount overflow** — `text-2xl` → `text-xl sm:text-2xl` for the invoice total amount in the invoice header card.

### Notes

- Desktop layouts (sm+ / lg+) are unchanged — `sm:` prefix values match previous design exactly.
- Widths tested: 360px, 390px, 430px, 768px, desktop.

---

## v2.16.0 — Mobile UX Pass 2 (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.16.0

### Improved

- **Automations page cards** — mobile-first card redesign: name + badge flex-wrap cleanly, Edit Flow button hidden in header on mobile and shown as a full-width button at the bottom of the card (`sm:hidden`); step chip chain hidden on mobile (`hidden sm:flex`) replaced by a compact plain-text step summary (`sm:hidden`); metrics row uses `flex flex-wrap gap-x-4 gap-y-1` instead of fixed `flex gap-6`; card padding `p-4 sm:p-5`.
- **Dashboard Recent Activity** — invoice number link gains `whitespace-nowrap` (prevents "INV-" / "2026-" / "025" line-break); meta row uses `flex flex-wrap` + `gap-x-2 gap-y-0.5`; timestamp uses `sm:ml-auto` so it wraps below on very narrow screens.
- **Global padding sweep** — all main content wrapper divs updated from `p-6` to `p-4 sm:p-6`: Dashboard, Invoices list, Invoice Detail, Contacts list, Contact Detail, Inbox, Scheduled Actions, Call Templates, Settings.
- **Scheduled Actions filter tabs** — `flex gap-2` → `flex flex-wrap gap-2` so all 6 tabs wrap gracefully on narrow screens instead of overflowing.

### Notes

- All desktop layouts unchanged; only `sm:` prefix and below affected.

---

## v2.15.0 — Mobile Responsiveness (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.15.0

### Added

- **Mobile sidebar drawer** — sidebar is hidden on mobile (< `md` / 768px); a hamburger/menu button appears in the TopBar on mobile to open a slide-in overlay drawer. Clicking a nav item or the backdrop closes the drawer. Implemented via `useMobileMenuStore` (Zustand) and a new `AppShell` client component.
- **`lib/mobile-menu-store.ts`** — tiny Zustand store (`isOpen`, `open`, `close`, `toggle`) for mobile sidebar state. Not persisted.
- **`components/layout/AppShell.tsx`** — new client component that wraps the app layout; renders desktop sidebar as `hidden md:flex` and mobile drawer as a fixed overlay.

### Improved — Responsive layouts

- **TopBar** — padding `px-4 md:px-6`; hamburger button (`md:hidden`); subtitle hidden on mobile; global search input `w-44 sm:w-72`; search dropdown and notification dropdown use `w-[calc(100vw-2rem)] sm:w-[26rem/w-80]` to prevent viewport overflow.
- **Dashboard** — KPI row `grid-cols-2 md:grid-cols-4`; Needs Attention grid `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`; Charts row `grid-cols-1 md:grid-cols-2`.
- **Invoice Detail** — main/sidebar split `grid-cols-1 lg:grid-cols-3`; invoice info grid `grid-cols-1 sm:grid-cols-2`; line items table wrapped in `overflow-x-auto`.
- **Onboarding wizard** — progress bar replaced with compact "Step N of 6 · Label" + linear bar on mobile (`sm:hidden`); full 6-step indicator on desktop (`hidden sm:block`); all wizard step grids collapse to 1 column on mobile (`grid-cols-1 sm:grid-cols-2/3`); wizard card padding `p-4 sm:p-8`.
- **Inbox** — AI notes info bar `grid-cols-1 sm:grid-cols-2`.
- **Call Templates** — template name/status form grid `grid-cols-1 sm:grid-cols-2`.
- **Invoices list** — toolbar row uses `flex-wrap` and smaller mobile padding.

### Notes

- All desktop layouts (md+ / lg+) are unchanged.
- Contacts and Scheduled Actions already had `overflow-x-auto` and single-column card layouts; no changes needed.
- Automation Builder and Settings are already single-column; no changes needed.

---

## v2.14.0 — Onboarding State Persistence: CompletedView & SkippedView (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.14.0

### Fixed

- **Onboarding page no longer re-renders the wizard after "Apply Setup" or "Skip"** on refresh or back-navigation. Previously `applied` was local React state (`useState(false)`) in `StepComplete`, which reset to `false` on every remount — causing the page to always render the wizard at Step 6.
- `OnboardingPage` now reads `status` from the persisted Zustand store and routes to `CompletedView` or `SkippedView` before rendering any wizard step.

### Added

- **`status` discriminated union** (`"not_started" | "in_progress" | "completed" | "skipped"`) added to `useOnboardingStore` and persisted to localStorage under `collectpilot-onboarding`.
- **`appliedFlowName`, `appliedFlowId`, `appliedTemplateName`** fields persisted to store on "Apply Setup" — displayed in `CompletedView`.
- **`skip()` action** on `useOnboardingStore` — sets `status: "skipped"`.
- **`CompletedView`** — shown after "Apply Setup" on return; displays applied flow name, optional call template name, link to Automation Builder, link to Dashboard, and "Restart Setup" (confirm dialog → `reset()`).
- **`SkippedView`** — shown after "Skip" on return; links to Automations, Dashboard, and "Start Setup Wizard" (confirm dialog → `reset()`).
- **`nextStep()` now sets `status: "in_progress"`** if transitioning from `"not_started"`.

---

## v2.13.0 — Docs Consolidation: Navigation, Onboarding & Invoice-First Workflow (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.13.0

### Summary

Version and documentation consolidation for the streamlined navigation and onboarding features delivered across v2.11.0–v2.12.0. No new code changes — this release ensures all features are accurately described and the version is consistent across package.json, README, and CHANGELOG.

### Features documented in this release

#### Streamlined navigation / clearer sidebar grouping
- Sidebar restructured into 3 labelled groups: **Daily Work** (Dashboard, Invoices, Inbox), **Automation Setup** (Automations, Scheduled Actions, Call Templates), **Admin** (Contacts, Setup & Onboarding).
- Settings pinned at the bottom, outside groups.
- All features retained and directly accessible from the sidebar — nothing hidden or removed.

#### Invoice-first daily workflow
- Dashboard shows a **Needs Attention** command centre with clickable cards for disputes, blocked actions, awaiting approval, paused automations, unread replies, and promises to pay.
- Invoice list Flow column shows live automation status badge (Active / Paused / Blocked / Needs Approval) and next scheduled action date.
- Invoice list Reply column shows classification badge and received date.
- Invoice detail page opens with a **Status Overview** panel showing all key indicators (status, days overdue, flow, automation state, reply, next action) and a recommended next step.

#### Dummy onboarding / setup wizard (`/onboarding`)
- 6-step wizard persisted to localStorage via Zustand.
- **Step 1 — Dummy Xero connect:** Simulated "Connect Xero" button with connected state. No real OAuth — prototype only.
- **Step 2 — Business profile:** Business name, accounts email, sender name, communication tone, follow-up style.
- **Step 3 — Reminder timing:** First reminder day, action at 14 days, action at 30 days.
- **Step 4 — Channel selection:** Email, SMS, AI Call, Manual review (multi-select).
- **Step 5 — Safety rules:** Pause on reply, pause on promise, pause on dispute; always check Xero (locked, required).
- **Step 6 — Generated setup:** Displays the generated flow timeline and template cards based on answers. "Apply Setup" creates a named `AutomationFlow` in `useFlowStore` and optionally a `CallTemplate` in `useCallTemplateStore`.

#### Generated / pre-setup flows and templates from onboarding answers
- `buildSteps()` generates `FlowStep[]` from wizard configuration (reminder days, channel choices, follow-up style).
- Applied directly to Zustand stores on wizard completion — immediately visible in Automations and Call Templates.

#### All existing features retained
- Invoices, Inbox, Automations, Scheduled Actions, Call Templates, Contacts, Settings, global search, notification bell all remain fully accessible.

---

## v2.12.0 — Navigation Refinement (Confirmed IA) (28 May 2026)

**Date:** 28 May 2026
**package.json version:** 2.12.0

### Summary

Refines the sidebar grouping from v2.11.0 to match James' confirmed information architecture. No features are removed or hidden — everything is still directly accessible from the sidebar. Only the grouping and section labels change.

### Changes

#### Sidebar — 3 groups (replaces 2-group layout from v2.11.0)

| Group | Items |
|-------|-------|
| **Daily Work** | Dashboard, Invoices, Inbox |
| **Automation Setup** | Automations, Scheduled Actions, Call Templates |
| **Admin** | Contacts, Setup & Onboarding |

- Settings remains pinned at the bottom (unchanged).
- All features from v2.11.0 are retained: Scheduled Actions is in Automation Setup (previously in Daily Work), Call Templates moved from Setup to Automation Setup, Contacts moved from Daily Work to Admin.
- Visual dividers between sections remain.

---

## v2.11.0 — Streamlined UX, Needs Attention Dashboard, Onboarding Wizard (28 May 2026)

**Date:** 28 May 2026
**package.json version:** 2.11.0

### Summary

Major UX update responding to James' product feedback. Focuses on making the daily workflow clearer for a business owner: everything important should be visible without jumping between sections. Adds a "Needs Attention" command-centre section to the Dashboard, automation status badges to the Invoice list, a Status Overview summary panel on invoice detail, and a full 6-step onboarding wizard with a dummy Xero connection and auto-generated flow output.

### Changes

#### 1. Streamlined navigation — sidebar groupings
- Sidebar restructured into two labelled groups: **Daily Work** (Dashboard, Invoices, Inbox, Automations, Scheduled Actions, Contacts) and **Setup** (Call Templates, Setup & Onboarding).
- A visual divider and section label clearly separate operational pages from configuration/setup pages.
- New "Setup & Onboarding" link in the Setup group navigates to the new onboarding wizard.

#### 2. Dashboard — Needs Attention section
- New **Needs Attention** section appears between KPIs and charts when there are items requiring review.
- Shows clickable cards for: Dispute(s) raised, Action(s) blocked, Awaiting approval, Automation(s) paused, Unread replies/calls, Promises to pay.
- Each card links directly to the relevant page/filter.
- A total badge shows the count of all attention items.
- When all clear, a green "All clear" banner replaces the section.
- Data computed server-side in `getDashboardData()` via new `needsAttention` field.

#### 3. Invoice list — automation status and next action
- The **Flow** column now shows a second row below the flow name: an automation status badge (Active / Paused / Blocked / Needs Approval / No Actions) derived from scheduled actions and inbox reply state.
- When status is Active, a "Next: {type} · {date}" line shows the next pending scheduled action.
- The **Reply** column now shows the received date below the reply classification badge.
- Fetches `/api/scheduled` on load to derive per-invoice automation state.

#### 4. Invoice detail — Status Overview panel
- A new **Status Overview** panel appears at the top of every invoice detail page, above the existing content.
- Shows compact status chips for: Invoice Status, Days Overdue, Flow, Automation status, Customer Reply classification, and Next Scheduled Action.
- Shows a **Recommended next step** description based on the current invoice/automation/reply state (e.g. "Dispute raised — pause automation", "Payment promised — monitor date", "Next SMS scheduled tomorrow").

#### 5. Setup & Onboarding wizard (new page: /onboarding)
- 6-step wizard persisted to localStorage via Zustand (`collectpilot-onboarding` key).
- **Step 1 — Connect Xero:** Dummy "Connect Xero" button shows connected state. Prototype notice included. No real OAuth.
- **Step 2 — Business profile:** Business name, accounts email, sender name, communication tone (Friendly / Professional / Firm), follow-up style (Light / Standard / Proactive).
- **Step 3 — Reminder timing:** First reminder day (1/3/7/14), action after 14 days (email/SMS/call/review), action after 30 days (call/escalate/final/pause).
- **Step 4 — Channels:** Select Email, SMS, AI Call, Manual review (multi-select checkboxes).
- **Step 5 — Safety rules:** Pause on reply / Pause on promise / Pause on dispute / Always check Xero (locked, required).
- **Step 6 — Generated setup:** Shows the generated flow timeline (Day X email → Day 14 action → Day 30 action), template cards, and safety rule summary. "Apply Setup" button creates an `AutomationFlow` in `useFlowStore` and (if calls enabled) a `CallTemplate` in `useCallTemplateStore`. Navigation buttons to Automations, Dashboard, Call Templates, or restart setup.

---

## v2.10.1 — Hotfix: Invoice Reply Column Sorting (28 May 2026)

**Date:** 28 May 2026
**package.json version:** 2.10.1

### Summary

Hotfix: the Reply column on the Invoices table was missing sort behaviour. Added `"reply"` to `SortCol`, included it in the sortable `columns` array, and removed the old static non-sortable header. Sorts alphabetically by label text (`Dispute` → `No reply` → `Out of Office` → `Payment Query` → `Promise to Pay` → `Reply received`). Works together with all existing search and filter combinations.

---

## v2.10.0 — Call Template Editor UX + Unsaved Changes Protection (28 May 2026)

**Date:** 28 May 2026
**package.json version:** 2.10.0

### Summary

Improves the Call Templates editor UX and adds unsaved-changes protection across Call Templates and the Automation Builder. New templates now auto-open in edit mode. Outcome classifications are fully editable (add/remove chips) rather than toggling from a fixed list. Collapsing a card while editing with unsaved changes shows an inline Save / Discard / Continue editing confirmation. Sidebar navigation and the builder breadcrumb both guard against losing unsaved changes via a shared Zustand nav-guard store.

### Changes

#### Call Templates: fully editable outcome classifications
- Outcome classification UI changed from toggle-from-fixed-list to fully editable chips.
- Each outcome chip now has a × button to remove it.
- An "Add outcome classification" input + Add button allows free-form entries (Enter key or button click).
- A warning appears if all outcomes are removed.
- Works on all 7 built-in templates and any user-created templates.

#### Call Templates: new templates auto-open in edit mode
- When a template is created via the "Create Call Template" modal, it now immediately opens in expanded + edit mode.
- Previously templates were created but not auto-opened, requiring a manual click to expand and edit.

#### Call Templates: unsaved-changes protection on collapse
- When a user clicks the collapse chevron while editing a template with unsaved changes, an inline confirmation bar appears: Save / Discard / Continue editing.
- Clicking Save saves the changes and collapses. Discard reverts and collapses. Continue editing dismisses the prompt and returns to edit mode.
- The browser `beforeunload` event is also wired up when changes are pending.

#### Automation Builder: unsaved-changes protection
- The builder now tracks `isDirty` state when any block is added, removed, or edited.
- An "Unsaved changes" label appears in the toolbar next to the Save button.
- The `beforeunload` event fires if the user attempts to close the tab or browser while changes are unsaved.
- The "← Automations" breadcrumb is now a guarded button: clicking it while unsaved shows a `window.confirm` prompt.

#### Shared navigation guard (lib/nav-guard-store.ts)
- New Zustand store (no persistence) tracks global dirty state: `isDirty`, `dirtySource`, `setDirty`.
- All sidebar NavItem links now intercept navigation when dirty and show a confirmation dialog before proceeding.
- NavItem converted from `<Link>` to a guarded `<button>` using `useRouter.push`.

---

## v2.9.0 — Additional Call Templates, Inbox Selection Fix, Merge Tag QA (28 May 2026)

**Date:** 28 May 2026
**package.json version:** 2.9.0

### Summary

Adds 6 new AI call templates to the Call Templates page, fixes the Inbox message selection bug that caused a page-reload flash on every click, and completes clickable merge tag insertion in the Call Templates editor. Verified via live browser testing.

### Changes

#### New: 6 additional call templates (TPL002–TPL007)

All templates include opening disclosure, full AI prompt, outcome classifications, voicemail behavior, and escalation rules. All seeded templates are protected from accidental deletion and display in fixed TPL001→TPL007 order. User-created templates sort after them by date.

| ID | Name | Status |
|----|------|--------|
| TPL002 | Promise-to-Pay Follow-up Call | Active |
| TPL003 | Dispute Review Follow-up Call | Draft |
| TPL004 | Invoice Copy Request Call | Active |
| TPL005 | Wrong Contact / Accounts Payable Update Call | Active |
| TPL006 | Final Reminder Before Human Review | Draft |
| TPL007 | Voicemail Only Template | Active |

- Call Templates page subtitle now reads "7 templates".
- Automation Builder Call block template dropdown automatically lists all 7 templates.
- `SEEDED_TEMPLATE_IDS` exported from store so the page can protect all defaults from deletion.

#### Fix: Inbox message selection without page reload

**Root cause:** Every click on an unread message triggered `markRead()` → `onUpdate()` → `load()` → `setLoading(true)`, which replaced the entire message list with loading skeletons. This was perceived as a full page reload. The same problem applied to `pauseAutomation()` and `sendReply()`.

**Fix:**
- Lifted expand/collapse to `selectedMessageId` page-level state (controlled). Clicking any item calls `toggleSelect(id)` — pure client-side, no network call.
- Replaced all `onUpdate()` calls with `onPatch(changes)` — optimistic local state update + background fire-and-forget PATCH request. No re-fetch, no loading flash.
- `load()` is now only called on initial mount and the explicit Refresh button.
- Deep links (`?message=...` from invoice detail) still work: `selectedMessageId` is initialized from the query param once after first load via `deepLinkInitialized` ref.
- Filter/search/tab state fully preserved when opening or switching messages.

**Verified (live browser):**
- Email click → expands in-place, URL stays `/inbox`, no skeleton flash ✅
- AI call transcript click → expands in-place with full transcript ✅
- Filter tab switch → list filters without reload, expanded item stays open ✅
- Unread count updates correctly via optimistic mark-read ✅

#### Fix: Clickable merge tags in Call Templates editor

Merge tags in the Call Templates page were display-only `<span>` elements. Fixed to be clickable buttons in edit mode, inserting at the cursor position in the disclosure, prompt, voicemail behavior, and escalation rules textareas. Uses the same `onMouseDown` + `e.preventDefault()` + `requestAnimationFrame` cursor-restore pattern as the Automation Builder.

---

## v2.8.0 — Call Templates, AI Call Inbox, Merge Tags, Builder Save Fix (28 May 2026)

**Date:** 28 May 2026
**package.json version:** 2.8.0

### Summary

Major feature update introducing Call Templates, AI call transcript records in the Inbox, clickable merge tags in the Automation Builder, a Call Template dropdown on Call blocks, and a fix to flow save persistence so user-created flows never lose data on save.

### Changes

#### New: Call Templates page
- New sidebar nav item: **Call Templates** (Phone icon).
- New page at `/call-templates` listing all call templates.
- Default template **"Overdue Invoice AI Call"** seeded with James' full prompt, opening disclosure, 9 outcome classifications, voicemail behavior, and escalation rules.
- Each template card is expandable with full field display and inline editing.
- **Create Call Template** button opens a modal to name and create a new Draft template.
- Templates persist across browser refresh via Zustand + localStorage (`collectpilot-call-templates`).
- Default template is always present (re-seeded on every store merge, cannot be fully deleted).
- Compliance amber banner: real AI calling requires ACCC/telco compliance before production use.

#### Automation Builder: Call block — template dropdown
- Call block now shows a **Call Template** dropdown listing all templates from the Zustand store.
- Selecting a template stores `templateId` and `templateName` in the step config.
- Card subtitle displays the selected template name.
- Default Call block pre-selects "Overdue Invoice AI Call" (TPL001).
- Assigned-to options now include **AI caller** as the first/default option.
- Merge tag bar shown in Call block (inserts into notes field).

#### Automation Builder: Clickable merge tags
- All Email, SMS, and Call (notes) fields now show a **merge tag bar** with 10 clickable tags:
  `{{contact_name}}`, `{{invoice_number}}`, `{{invoice_amount}}`, `{{due_date}}`, `{{days_overdue}}`, `{{company_name}}`, `{{customer_company}}`, `{{payment_link}}`, `{{contact_email}}`, `{{accounts_email}}`
- Clicking a tag while a text field is focused inserts it at the cursor position (cursor position preserved via `requestAnimationFrame`).
- `onMouseDown` + `e.preventDefault()` prevents blur on click so cursor position is accurate.
- If no field is focused, the tag appends to the main body/notes field.
- Legacy `{{contactName}}`-format tags still supported in email preview `fillMerge`.

#### Automation Builder: Flow save persistence fix
- **Root cause fixed:** Saving a user-created flow (ID like `FLOW-${timestamp}`) was calling `PATCH /api/automations/${id}`, which returned 404 because the API only knows about seeded flows (FLOW001–003). On 404, `onAfterSave` was never called, so Zustand was never updated with the new block configuration.
- **Fix:** `handleSave` now calls `onAfterSave?.(updatedFlow)` **before** the API request. Zustand/localStorage is always updated first. The API call is attempted as a best-effort server sync; 404 responses (expected for client-created flows) are silently ignored.
- User-created flows now reliably persist all block edits across save → back → reopen → refresh.

#### Inbox: AI call transcript records
- Inbox now displays **AI call records** alongside email replies.
- New filter tabs: **Emails** and **AI Calls** (in addition to existing classification filters).
- TopBar subtitle now shows counts: `X emails · Y AI calls`.
- 3 dummy AI call records added to seed data:
  - **CALL001** — INV-2026-013 / Harbour Kitchen — Completed / Promise to Pay (5 June 2026)
  - **CALL002** — INV-2026-009 / Walsh Civil Engineering — Voicemail left
  - **CALL003** — INV-2026-017 / Fletcher IT Solutions — Needs Human Review / Dispute raised
- Call records render with a green left border, Phone icon, call status badge (Completed / Voicemail Left / No Answer / Needs Human Review), and outcome classification badge.
- Expanding a call record shows the full transcript in a scrollable pre-formatted block.
- Dispute and promise-to-pay call outcomes show informational banners matching the email inbox behavior.
- Automation pause button available on call records.
- Inbox search now includes transcript and call outcome fields.

#### Minor improvements
- `FlowBuilderPageClient.tsx`: "server may have restarted" message replaced with "flow ID may be invalid" (no server state reference).
- Xero checkbox styling updated: amber background + amber text for better visibility.
- Dashboard Recent Activity already uses `formatActivityTimestamp` (full date + time); confirmed working.
- Inbox timestamps updated from `formatRelativeTime` to `formatDateTime` (absolute, not relative).

### Files changed
- `lib/types.ts` — added `CallTemplateStatus`, `InboxItemType`, `CallStatus`, `CallTemplate`; updated `InboxMessage`
- `lib/call-template-store.ts` — new Zustand persist store with default template
- `data/inbox-messages.json` — added CALL001, CALL002, CALL003
- `components/layout/Sidebar.tsx` — added Call Templates nav item
- `components/automations/builder/FlowBuilderPageClient.tsx` — updated "flow not found" message
- `components/automations/builder/FlowBuilder.tsx` — merge tags, call template dropdown, save fix, new MERGE_TAGS constant, updated fillMerge, MergeTagBar component
- `app/call-templates/page.tsx` — new page
- `app/inbox/page.tsx` — CallCard component, filter tabs, call record support

---

## v2.7.1 — Automation Builder: Detailed Block Configuration (28 May 2026)

**Date:** 28 May 2026
**package.json version:** 2.7.0 _(field expansion, no version bump)_

### Changes

#### Email block — expanded fields
- **Recipient** dropdown: Invoice contact email / Billing contact email / Custom email address (custom shows a free-text input).
- **Email body** textarea (full multi-line) with merge field hint: `{{contactName}}`, `{{invoiceNumber}}`, `{{amount}}`, `{{dueDate}}`, `{{companyName}}`, `{{senderName}}`.
- **Reply-to email** optional field (shown in preview header when set).
- **Preview Email** toggle button — renders an inline email preview card with merge fields replaced by sample data (James Fletcher / INV-2026-001 / $12,500.00 etc.).

#### SMS block — expanded fields
- **Recipient** dropdown: Invoice contact phone / Billing contact phone / Custom phone number (custom shows a tel input).
- **SMS message** textarea with merge field hint.

#### Delay block — unit dropdown
- New **Unit** dropdown next to the delay amount: Minutes / Hours / Days / Weeks.
- Subtitle in the card header now reads e.g. "Wait 4 hours", "Wait 30 minutes", "Wait 2 weeks".
- Backward compatible — existing flows without a `unit` field default to "days".

#### Call block — scheduling logic
- **Assigned to** dropdown: Accounts team / Admin / Custom assignee (custom shows a name input).
- **Call timing** dropdown: Immediately after previous step / After a delay / Specific date & time.
  - "After a delay" reveals a delay-amount + unit (minutes/hours/days) pair.
  - "Specific date & time" reveals a `datetime-local` input (prototype only — not runtime-enforced).
- **Call notes** textarea with a descriptive placeholder.

#### Subtitle preview in card header
- Each card's subtitle now reflects meaningful config: email shows recipient type, SMS shows recipient type, call shows timing, delay shows value + unit.

### Files changed
`components/automations/builder/FlowBuilder.tsx`

---

## v2.7.0 — Functional Automation Builder (28 May 2026)

**Date:** 28 May 2026
**package.json version:** 2.7.0

### Summary

Complete rewrite of the Automation Builder UI. Replaced the React Flow canvas (which rendered as a static-feeling mockup) with a functional vertical-list builder that users can actually edit.

### Changes

#### Builder rebuilt as a functional list
- The canvas (`@xyflow/react`) has been removed from the builder view. The builder now renders as a scrollable vertical list of step cards.
- Each card shows the block type icon, a readable subtitle (e.g. "Invoice 7 days overdue", "Wait 3 days"), and action buttons.

#### Add block toolbar (functional)
- Toolbar at the top of the builder with **Email**, **SMS**, **Call**, and **Delay** buttons.
- Each button adds the corresponding block immediately before the End Automation step.
- Branch (Condition) removed from the toolbar — not yet functional; will be re-added in a future release.

#### Inline "+" insert between blocks
- A dashed-circle **+** button appears between every pair of steps.
- Clicking it opens a small floating picker (Email / SMS / Call / Delay) to insert a block at that exact position.

#### Delete blocks
- Every editable block (Email, SMS, Call, Delay) has a trash icon in its header row.
- Trigger and End Automation cannot be deleted.

#### Inline editing
- Each block has an **Edit / Done** toggle that expands an inline edit panel.
- **Trigger**: trigger type dropdown + days-overdue input (conditional).
- **Delay**: label + days-to-wait number input.
- **Email**: label/name, subject line, sender name.
- **SMS**: label/name, message body.
- **Call**: label/task name, call notes.

#### Xero safety checkbox
- Email, SMS, and Call cards each display a locked, pre-ticked **"Check still unpaid in Xero"** checkbox below the header.
- Disabled and non-removable. Footer notice reinforces this for the whole flow.

#### Save behaviour
- "Save Flow" serialises the display steps back to the full `AutomationFlow` format (re-inserting `lookup_check` nodes before every action step and generating linear edges), PATCHes to the API, and calls `upsert` on the Zustand store.
- "Saved ✓" confirmation appears for 2.5 seconds after a successful save.
- Reopening the builder after save shows the correct persisted state.

#### Bundle size
- Builder bundle reduced from **171 kB → 114 kB** (React Flow dependency removed from the critical path).

### Files changed
`components/automations/builder/FlowBuilder.tsx` (major rewrite), `package.json`

---

## v2.6.0 — Persistent Automation Builder + Node Palette (28 May 2026)

**Date:** 28 May 2026  
**package.json version:** 2.6.0

### Changes

#### Flow persistence (Zustand + localStorage)
- New flows created via "New Automation Flow" are now saved immediately to `localStorage` via Zustand (`collectpilot-flows` key) and persist across page navigations and Vercel cold starts.
- The Automations list merges seeded API flows with Zustand-persisted flows — user-created flows survive server restarts.
- The flow builder at `/automations/[id]/builder` reads from Zustand first, then falls back to the API for seeded flows. New `FlowBuilderPageClient` component handles this client-side lookup.
- Every "Save Flow" in the builder also calls `upsert` on the Zustand store, so edits to any flow (seeded or user-created) are persisted locally.

#### New flow creation — direct navigation
- "New Automation Flow" modal now generates a real `FLOW-{timestamp}` ID immediately on the client, writes the stub flow to Zustand, and navigates directly to `/automations/{id}/builder` — no server round-trip needed.

#### Node palette toolbar
- Added an **Add** toolbar at the top-left of the flow canvas with buttons for: Email, SMS, Call, Delay, Branch (Condition), End.
- Clicking any button inserts a new node below the existing canvas nodes.

#### Trigger type dropdown
- The Trigger node config panel now includes a **Trigger Type** dropdown: _Invoice X days overdue_, _Invoice created_, _Reply received_, _Manual / on demand_.
- The "Days overdue" number input is shown conditionally — only when "Invoice X days overdue" is selected.
- The TriggerNode canvas card displays the trigger type label when a non-default type is selected.

### Files changed
`lib/flow-store.ts` (new), `components/automations/builder/FlowBuilderPageClient.tsx` (new), `app/automations/[id]/builder/page.tsx`, `app/automations/page.tsx`, `app/automations/new/builder/page.tsx`, `components/automations/builder/FlowBuilder.tsx`, `components/automations/builder/NodeConfigPanel.tsx`, `components/automations/builder/nodes/TriggerNode.tsx`

---

## v2.5.1 — Xero Check: Locked Checkbox on Action Blocks (27 May 2026)

**Date:** 27 May 2026  
**package.json version:** 2.5.0 _(UI refinement, no version bump required)_

### Change

The "Fresh Xero check before send" indicator on Email, SMS, and Call blocks has been redesigned from an amber text badge to a **locked, auto-ticked checkbox** labelled **"Check still unpaid in Xero"**.

| Element | Before | After |
|---------|--------|-------|
| Node card footer | Amber badge with shield icon + "Fresh Xero check before send" | Grey footer with pre-ticked disabled checkbox + "Check still unpaid in Xero" + helper text "Required safety check before this action runs." |
| Config panel | Amber info box with shield icon | Locked checkbox with helper text "Required safety check. Automatically verified before this action runs — cannot be disabled." |
| Canvas notice | "A Fresh Xero check runs automatically before every Email, SMS, and Call action." | "Each Email, SMS, and Call block includes a locked ☑ Check still unpaid in Xero safety check." |

The checkbox is `checked` and `disabled` — it reads as a required, immutable safety setting rather than a user-configurable option. The underlying server-side enforcement (`lib/lookup-engine.ts`) is unchanged.

---

## v2.5.0 — Timeline Dates · Simplified Automation Builder (27 May 2026)

**Date:** 27 May 2026  
**package.json version:** 2.5.0

### Changes

| # | Change | Files |
|---|--------|-------|
| 1 | **Timeline batch date label** — collapsed batch headers now show a date ("26 May 2026") instead of a time ("4:00 am"); if a batch spans multiple calendar days the header shows a range ("1 May 2026 – 2 May 2026"); individual events inside an expanded batch continue to show full timestamps | `components/invoices/BatchedTimeline.tsx` |
| 2 | **Automation Builder — lookup_check nodes hidden from canvas** — Fresh Xero Check nodes are filtered out of the React Flow display; bypass edges connect the preceding step directly to the following step so the canvas reads Trigger → Email → Wait → SMS → Wait → Call → End; the underlying enforcement continues to run server-side before every action fires | `components/automations/builder/FlowBuilder.tsx` |
| 3 | **Email / SMS / Call nodes — "Fresh Xero check before send" badge** — each send-type node now shows a small amber badge at its base, making it clear that a Xero check is automatically enforced before the action fires | `components/automations/builder/nodes/EmailNode.tsx`, `SMSNode.tsx`, `CallNode.tsx` |
| 4 | **Builder enforcement notice updated** — bottom notice changed from "Connecting email/SMS/call without a Lookup Check node is blocked" to "A Fresh Xero check runs automatically before every Email, SMS, and Call action"; warning icon changed from ZapOff to ShieldCheck | `components/automations/builder/FlowBuilder.tsx` |
| 5 | **Node config panel — automatic check callout** — Email, SMS, and Call config panels each show a small amber note: "A Fresh Xero check runs automatically before this [email/SMS/call] sends" | `components/automations/builder/NodeConfigPanel.tsx` |
| 6 | **package.json version** bumped 2.4.0 → 2.5.0 | `package.json` |

### Why the builder simplification?

The Fresh Xero Check has always been enforced at the point of action-fire (server-side in `lib/lookup-engine.ts`), not at the builder canvas level. Showing explicit lookup_check nodes in the builder introduced visual noise without adding user value — users can't configure them and they don't change the enforcement. Moving the communication to a badge on each send node and a canvas-level notice is clearer for non-technical stakeholders reviewing the flow.

---

## v2.4.1 — Hotfix: Invoice detail server crash (27 May 2026)

**Date:** 27 May 2026  
**package.json version:** 2.4.0 _(patch fix, no version bump required)_

### Root cause
`app/invoices/[id]/page.tsx` is a React Server Component. The "Open in Xero" button added in v2.4.0 used a conditional `onClick` handler:

```tsx
onClick={invoice.xeroUrl ? undefined : (e) => e.preventDefault()}
```

When `invoice.xeroUrl` is absent (all current records), this evaluates to an arrow function. **React Server Components cannot serialize functions in their output** — the RSC serializer throws at runtime, producing the "server-side exception" on Vercel. The bug only affects the invoice detail route because it is the only Server Component with an event handler on a native element.

### Fix
Replaced the single `<a>` with conditional rendering:
- `invoice.xeroUrl` is set → renders a real `<a href=...>` with `target="_blank"` (no event handler needed)
- `invoice.xeroUrl` is absent → renders a `<span>` (non-clickable by nature; no event handler needed)

Event handlers on native elements are now absent from the Server Component entirely.

---

## v2.4.0 — Deep Inbox Links · Batched Timeline · Invoice Filters · Xero Button (27 May 2026)

**Date:** 27 May 2026  
**package.json version:** 2.4.0

### Changes

| # | Change | Files |
|---|--------|-------|
| 1 | **"View full message in Inbox" deep-links to exact message** — link now navigates to `/inbox?message=<MSG_ID>`; matching message is auto-scrolled into view, auto-expanded, and highlighted with a blue ring; `useSearchParams` wrapped in `<Suspense>` per Next.js 15 requirements | `app/invoices/[id]/page.tsx`, `app/inbox/page.tsx` |
| 2 | **Batched timeline** — adjacent events within a 60-minute window are grouped into a collapsible batch; batch header shows type ("Collection workflow activity", "Reply handling activity", "Lookup checks", "Workflow activity"), action count, and time; click to expand/collapse; single events outside a batch display as before | `components/invoices/BatchedTimeline.tsx` _(new)_, `app/invoices/[id]/page.tsx` |
| 3 | **Invoice dropdown filters** — three dropdowns added above the invoice table: Status (All / Overdue / Partial / Disputed / Paid / Voided), Flow (All / No flow / per-flow name), Reply status (All / Has reply / No reply / per classification); filters are applied on top of text search (AND logic); "Reset filters" button appears when any filter is active; empty state shows both "Clear search" and "Reset filters" links | `app/invoices/page.tsx` |
| 4 | **"Open in Xero" button on invoice detail** — placed in the invoice header alongside the status badge; links to `invoice.xeroUrl` when set (opens in new tab); shows as greyed-out with tooltip "Xero URL not configured" when no URL is present; `xeroUrl?: string \| null` field added to the `Invoice` type with a TODO comment for future Xero integration | `app/invoices/[id]/page.tsx`, `lib/types.ts` |
| 5 | **package.json version** bumped 2.3.0 → 2.4.0 | `package.json` |

### Placeholder behavior — Xero button
The "Open in Xero" button is always visible on the invoice detail page. In the current prototype, no invoices have a `xeroUrl` value set, so the button renders in a greyed-out disabled state with the tooltip _"Xero URL not configured — add xeroUrl to invoice data"_. When a real Xero integration is added, populate `xeroUrl` on each invoice record (e.g. `"https://go.xero.com/AccountsReceivable/View.aspx?invoiceID=<uuid>"`) and the button will activate automatically.

---

## v2.3.0 — True Global Search + Notification Bell (27 May 2026)

**Date:** 27 May 2026  
**package.json version:** 2.3.0

### Changes

| # | Change | Files |
|---|--------|-------|
| 1 | **Notification bell — now interactive** — clicking the bell opens a dropdown panel with 3 demo notifications (dispute detected, manual approval required, invoices overdue); each links to the relevant section; keyboard-accessible (Escape), closes on outside click; clean empty state "No new notifications" for when list is empty | `components/layout/TopBar.tsx` |
| 2 | **TopBar search — true app-wide global search** — completely decoupled from page-level search stores; fetches data from all 5 APIs on first open, filters client-side; results grouped by Invoices / Contacts / Automations / Scheduled Actions / Inbox; each result shows title, subtitle context, category icon, and links to the relevant detail or list page; minimum 2 chars to show results; Escape + outside-click close; footer shows result count | `components/layout/TopBar.tsx` |
| 3 | **Page-level search bars unchanged** — Invoices, Contacts, Automations, Scheduled, Inbox in-page search bars remain section-specific and continue using `lib/search-store.ts` independently | _(no changes to page files)_ |
| 4 | **README — Search Architecture section added** — explains the clear distinction between TopBar global search and page-level section search | `README.md` |
| 5 | **package.json version** bumped 2.2.0 → 2.3.0 | `package.json` |

---

## v2.2.0 — Global TopBar Search (27 May 2026)

**Date:** 27 May 2026  
**package.json version:** 2.2.0

### Changes

| # | Change | Files |
|---|--------|-------|
| 1 | **Zustand search store** — new `lib/search-store.ts` shared across TopBar and all page-level inputs; single source of truth so both inputs stay in sync | `lib/search-store.ts` |
| 2 | **TopBar search — own embedded input** — TopBar now manages its own expandable search control (not just a focus shortcut); expands inline on click, shows blue-bordered input with placeholder tailored to current section, Escape closes it, navigating away auto-clears; blue dot indicator when query is active but input collapsed | `components/layout/TopBar.tsx` |
| 3 | **Automations page converted to client component** — now fetches `/api/automations` client-side; search filters by flow name, description, status, trigger value, and step types; "Showing X of Y flows" count; empty state with clear link | `app/automations/page.tsx` |
| 4 | **Scheduled Actions page — text search added** — `useSearchStore` wired on top of existing tab filter (AND logic); filters by step type, invoice number, contact name/company, flow name, status, scheduled date, skip reason; "Showing X of Y actions" count | `app/scheduled/page.tsx` |
| 5 | **Inbox page — text search added** — `useSearchStore` wired on top of tab filter; filters by sender, subject, body, invoice number, contact name/company, classification (raw + readable label); "Showing X of Y messages" count | `app/inbox/page.tsx` |
| 6 | **package.json version** bumped 2.1.0 → 2.2.0 | `package.json` |
| 7 | **README** title updated to v2.2; v2.2 summary line added | `README.md` |

---

## v2.1.0 — CollectPilot v2.1 Update Summary

**Date:** 27 May 2026  
**package.json version:** 2.1.0

### Changes

| # | Change | Files |
|---|--------|-------|
| 1 | **TopBar search icon fixed** — now accepts `onSearchClick` prop; shows only when provided, and focuses the page-level search input on click. Dead no-op button is gone. | `components/layout/TopBar.tsx` |
| 2 | **Invoice search improved** — clear (×) button when text is present; broadened to match raw amounts (31000 matches $31,000.00), due date text, days overdue, "no flow"; count shows "Showing X of Y invoices" | `app/invoices/page.tsx` |
| 3 | **Invoice list — Reply column added** — fetches `/api/inbox` on load; shows colour-coded classification badge (Promise to Pay / Dispute / Out of Office / Payment Query / Reply received) plus a pause icon when automation is paused; "No reply" for invoices with no message | `app/invoices/page.tsx` |
| 4 | **Contact search improved** — clear (×) button; raw amount matching; "Showing X of Y contacts" count | `app/contacts/page.tsx` |
| 5 | **Invoice detail — Customer Reply panel moved to top of sidebar** — first visible card in the right column so users immediately see whether a customer has replied and what the AI recommended | `app/invoices/[id]/page.tsx` |
| 6 | **package.json version** bumped 0.1.0 → 2.1.0 | `package.json` |
| 7 | **README** title updated to v2.1; v2.1 summary line added | `README.md` |

---

## v2.0.0 — Initial Prototype (27 May 2026)

**Session date:** 27 May 2026  
**Requested by:** James C (via Slack + Loom)  
**Implemented by:** Juan B + Claude

---

## Background

James sent a Loom walkthrough ([link](https://www.loom.com/share/a0510ea8813246cab4224513786ee06e)) with improvement notes, followed by a Slack message asking for:

1. UI improvements based on the Loom feedback
2. Deployment to a public URL (Vercel + Supabase/GitHub Pages)

> "Assuming we're not using any public api keys or anything? Could you try and also launch this with Vercel/supabase. Or similar?"

The 10 implementation items below address the Loom feedback directly. The deployment step (item 9) prepares the repo for Vercel — a live public link is the next step once pushed to GitHub.

---

## Changes Made

### 1. Working search + sort — Invoices page
**James said:** *"It'd be great if this search bar could work… and click on these to sort by where things are at."*

- Converted `app/invoices/page.tsx` from a Server Component to a Client Component
- Added live search across invoice number, contact name/company, amount, status, and assigned flow
- Added clickable sort on all 7 columns (Invoice #, Contact, Amount, Due Date, Days Overdue, Status, Flow) with direction toggle (asc/desc) and visual sort icons
- Shows "X of Y" count below the search bar

---

### 2. Working search + sort — Contacts page
**James said:** *"Contacts is cool… just that sort by and search could be cool."*

- Converted `app/contacts/page.tsx` from a Server Component to a Client Component
- Added live search across name, company, email, phone, and status
- Added clickable sort on 6 columns (Contact, Email, Invoices, Total Owed, Overdue count, Status)

---

### 3. Enriched invoice timelines
**James said:** *"It'd be great to see like every time they've sent an email in the past, everything like that."*

- Replaced the sparse `data/timeline-events.json` with 77 new events (TL024–TL100)
- Every invoice now has at least one timeline entry
- All 11 event types are represented: `flow_assigned`, `lookup_performed`, `email_sent`, `sms_sent`, `call_scheduled`, `reply_received`, `automation_paused`, `action_skipped`, `action_blocked`, `manual_note`, `status_changed`
- Inbox messages (MSG001–MSG008) are cross-referenced with matching `reply_received` events on the relevant invoices

---

### 4. Renamed "Lookup Check" → "Fresh Xero Check"
**James said:** *"So it'd be great if this was not even changeable… I know we've called it lookup check but I think this should be renamed… it should say checks your Xero account to make sure it's unpaid."*

- Renamed node header in `components/automations/builder/nodes/LookupCheckNode.tsx`
- Updated `NodeConfigPanel.tsx`: clicking a Fresh Xero Check node now shows a read-only info panel listing all 5 checks performed, with the note: *"This node is required before every email, SMS, or call action. Its behaviour cannot be customised."* — no editable fields, no Save button

---

### 5. Email node: template dropdown, body copy, Preview Email modal
**James said:** *"This email will likely also need a body copy… it would be great to see a preview and a button to be able to preview that email and what it would look like as well. It's fine if the links in it don't work."*

- Added a **Template** dropdown to the email node config panel with 5 built-in templates:
  - Gentle Reminder
  - Overdue Notice
  - Urgent Notice
  - Final Warning
  - Payment Confirmation
- Selecting a template auto-populates the Subject and Body fields (both remain editable)
- Added a **Preview Email** button that opens an inline overlay showing:
  - From / To / Subject headers
  - Full body with all `{{merge fields}}` replaced with sample data (contact name, invoice number, amount, due date)
  - "Links are not active in this prototype." footer note

---

### 6. Fixed default automation flow (FLOW001)
**James said:** *"After seven days it should look again and then maybe send another email, and then after another seven days send an SMS. And then it should call them. So more like this — everyone would be under this one flow."*

- Rebuilt FLOW001 ("Standard Collection Flow") from scratch as a single end-to-end sequence:
  - **Trigger** → Invoice 7 days overdue
  - **Fresh Xero Check #1** → **Friendly Reminder Email**
  - **Wait 7 days**
  - **Fresh Xero Check #2** → **Follow-up Email**
  - **Wait 7 days**
  - **Fresh Xero Check #3** → **SMS Reminder**
  - **Wait 7 days**
  - **Fresh Xero Check #4** → **Schedule Call**
  - **Condition** — Customer replied?
  - **End A**: Pause — Promise to Pay
  - **End B**: Needs review — Dispute or no response
- Each send action is gated by its own Fresh Xero Check node, enforcing the lookup rule
- Renamed FLOW002 to "Quick Email Sequence" (draft), kept FLOW003 "Escalation" (draft)

---

### 7. Customer Reply / AI Recommendation panel on invoice detail
**James said:** *"It would be great on each invoice to have, based on the reply, something here… we basically want the user to always see if they've replied and said something… we probably don't want to send them a reminder."*

- Added a **Customer Reply** card to the invoice detail right sidebar (`app/invoices/[id]/page.tsx`)
- Shows the most recent inbox message for that invoice, including:
  - AI classification badge (Promise to Pay, Dispute, Out of Office, Payment Query, Unclassified)
  - Sender and subject line
  - Message preview (3-line clamp)
  - **Recommended Action** box tailored to the classification (e.g. *"Pause automation — customer has promised payment"*, *"Mark as disputed and assign to accounts team"*)
  - "Automation paused due to customer reply" amber banner when applicable
  - Link: *View full message in Inbox →*
- Only appears on invoices that have a linked inbox message

---

### 8. Scheduled Actions — lookup engine confirmed working
**James said:** *"Scheduled Actions, that looks cool to me, how that works."*

- No changes needed — confirmed via smoke test that "Run Lookup & Fire" still:
  - Runs the full Fresh Xero Check engine (8-step priority chain)
  - Updates action status (pending → sent/skipped/blocked/awaiting_approval)
  - Appends `lookup_performed` and result events to the invoice timeline

---

### 9. Deployment prep — .gitignore + README
**James said:** *"Could you try and also launch this with Vercel/supabase… so it's a public viewable link."*

- Created `.gitignore` (excludes `node_modules/`, `.next/`, `.env*`, build artefacts, OS files, and local launch scripts)
- Created `README.md` with:
  - Tech stack overview
  - Local dev instructions (`npm install && npm run dev`)
  - Vercel deployment guide (CLI option + GitHub integration option)
  - Note: no environment variables required for the current prototype
  - Guidance for adding Supabase persistence in future (if moving beyond in-memory store)

**Next step for live URL:** Push repo to GitHub → connect to Vercel → deploy. Should be a one-click deploy with no config required.

---

### 10. Local smoke test
Ran a full browser walkthrough after all changes:

| Page | Verified |
|------|----------|
| Invoices — search + sort | Search "walsh" → 3/25; sort by Amount desc |
| Invoice Detail (INV-2026-017) | Dispute banner, Customer Reply panel, AI: Dispute badge |
| Invoice Detail (INV-2026-005) | Customer Reply panel, AI: Promise to Pay, automation paused |
| Contacts — search + sort | Search "thornton" → 1/10; sort by Total Owed desc |
| Flow Builder (FLOW001) | Fresh Xero Check nodes, email template dropdown, Preview Email with merge fields |
| Fresh Xero Check config panel | Read-only, 5 checks listed, no Save button |
| Scheduled Actions — fire | Pending 4 → 3, Sent 2 → 3; timeline events logged on INV003 |
| Dashboard | KPIs, aging chart, collections trend, recent activity |
| Inbox | AI classification badges, automation paused indicators, filter tabs |
| Settings | Manual approval toggle, lookup settings, blocked keywords, sender details |

---

## What's Prototype-Only (unchanged by design)

Per James' explicit note — *"Assuming we're not using any public API keys or anything?"* — the following remain simulated:

- No real Xero API calls (lookup engine runs against in-memory data)
- No real email, SMS, or phone call sending
- No payment processing
- No authentication or user accounts
- No billing
- Data resets on server restart (no persistent database yet)

Adding Supabase persistence and a real Vercel deploy is the next step when ready.

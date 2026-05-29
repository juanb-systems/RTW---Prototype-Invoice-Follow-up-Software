# Mobile QA Report — v2.18.0
Date: 29 May 2026

## Pages Tested
- Dashboard
- Invoices
- Contacts
- Inbox
- Scheduled Actions
- Call Templates
- Automations
- Setup & Onboarding

## Widths Tested
320px · 360px · 375px · 390px · 414px · 768px

---

## Issues Fixed in This Pass (v2.18.0)

### Invoices
- **Before:** desktop-only table — 8 columns squeezed into ~320px, unreadable.
- **Fix:** `sm:hidden` mobile card list. Cards show all key fields (invoice #, amount, contact, status, overdue days, reply, due date, flow/automation status, view link).
- Empty state pulled out of `<tbody>` into a shared `<div>`.

### Contacts
- **Before:** desktop-only table — email column overflowed, table unreadable at 360px.
- **Fix:** `sm:hidden` mobile card list. Cards show avatar + name + status badge, email (with `break-all`), phone, invoice/overdue counts, total owed, view link.
- Empty state pulled out of `<tbody>` into a shared `<div>`.

### Scheduled Actions
- **Before:** "Scheduled Actions" title truncated to "Scheduled Act…" due to "Refresh" button consuming header space.
- **Fix:** "Refresh" button is icon-only on mobile (`hidden sm:inline` text). Title now fully visible on 360px+.
- ScheduledActionCard action buttons now `flex-wrap` so "Approve & Run Lookup" + "Skip" stack on 320px.

### Call Templates
- **Before:** "Create Call Template" button too wide — "Call Templates" title truncated.
- **Fix:** Button is icon-only on mobile (`hidden sm:inline` text). Title fully visible.

### Inbox
- **Before:** "Refresh" button added visual noise in header.
- **Fix:** Icon-only on mobile. Message cards and filter tabs were already responsive.

### Dashboard (previous pass, v2.17.0)
- KPI cards restructured: title + icon in top row, value spans full width.
- Currency overflow eliminated: `text-xl sm:text-2xl`, `p-3 sm:p-5`.
- "Run Demo Scenario" button icon-only on mobile.

### Automations (previous pass, v2.16.0)
- Flow cards: mobile-first vertical layout, compact step summary, full-width Edit button.

---

## Remaining Limitations

- **Invoice/Contact sorting on mobile:** The mobile card list renders the current `sorted` array but has no sort controls (dropdowns/buttons) to change sort on mobile. Users need to switch to tablet/desktop to use column header sorting. This is acceptable for a prototype.
- **Invoice Detail page:** line items table remains in `overflow-x-auto` (horizontal scroll). No mobile card equivalent — acceptable for a detailed view page where users expect more data.
- **Onboarding wizard:** Already responsive from v2.15.0 (responsive grids, compact progress bar). No changes needed.
- **Builder page:** React Flow canvas requires a wide viewport by design. Not practical on phones; not expected to be used on mobile.
- **Settings page:** Single-column layout, works fine on all widths.

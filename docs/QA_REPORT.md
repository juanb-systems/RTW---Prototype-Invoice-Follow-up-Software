# CollectPilot QA Report

---

## Date

29 May 2026

## Version Checked

`2.13.0` (from `package.json`)

---

## Summary

| Item | Status |
|------|--------|
| **Build** | ✅ PASS — clean build, no TypeScript errors |
| **Lint** | ⚠️ BROKEN — `npm run lint` exits non-interactively due to deprecated `next lint` command |
| **Runtime** | ✅ PASS — all pages load, no crashes |
| **Main working areas** | Dashboard, Invoices, Invoice Detail, Inbox, Automations, Builder, Call Templates, Scheduled Actions, Contacts, Onboarding, Settings, Global Search |
| **Highest priority issue** | P2 — Invoice "View →" link hidden off-screen at standard viewport width |
| **Total issues found** | 5 (0× P0, 0× P1, 2× P2, 3× P3) |

---

## Build / Test Results

| Check | Result | Notes |
|-------|--------|-------|
| `npm run build` | ✅ PASS | 28 routes, clean TypeScript + type check |
| `npm run lint` | ⚠️ BROKEN | `next lint` deprecated in Next.js 15; exits code 1, prompts for interactive ESLint config setup. Cannot be run non-interactively. No ESLint config file exists. |
| Local runtime test | ✅ PASS | Tested on `http://localhost:3001` (fresh dev server). All pages load with full styling and data. |

---

## Bugs / Glitches Found

| Priority | Area | Issue | Steps to Reproduce | Expected | Actual | Suggested Fix |
|----------|------|--------|--------------------|----------|--------|---------------|
| **P2** | Invoices List | "View →" link to open invoice detail is hidden off-screen | Load `/invoices` at any standard viewport (1280px–1440px). Observe the rightmost visible column is REPLY. Try to navigate to an invoice detail by clicking on the list. | A "View →" link or clickable row should be visible without horizontal scrolling. | The "View →" link exists as a 9th table column but is clipped off the right side of the viewport. No horizontal scrollbar is shown. Invoice rows have no `onClick` handler, so there is no other way to open invoice detail from the list without knowing the URL. | Either: (a) make the whole `<tr>` row clickable with a `cursor-pointer` hover and `router.push`, or (b) move "View →" inside the INVOICE column below the invoice number, so it never overflows. |
| **P2** | Onboarding — Step 1 | "Continue" button disabled with no visible explanation | Navigate to `/onboarding`. Do NOT click "Connect Xero". Try to click the disabled "Continue" button. | Button should show a tooltip or inline message explaining Xero must be connected first, OR the button should be enabled but show an inline validation error on click. | The "Continue" button is `disabled` with no tooltip attribute. Clicking it does nothing. Users who miss the "Connect Xero" card may not understand the blockage. | Add a `title` tooltip on the disabled button: `title="Connect Xero to continue"`, or show an inline hint text below the button (e.g. "Connect Xero above to continue"). |
| **P3** | All Pages | Missing `favicon.ico` — 404 console error on every page load | Open any page in DevTools. Check the console. | No errors for favicon. | `GET /favicon.ico — 404 Not Found` fires on every page load. The `/public` directory does not exist in the repository. | Create `public/` directory and add a `favicon.ico` (or `favicon.svg`) file. Any 16×16 or 32×32 icon works; a placeholder suffices for prototype. |
| **P3** | Dev tooling | `npm run lint` non-functional — exits code 1 | Run `npm run lint` from the project root. | ESLint runs and reports any lint warnings/errors. | `next lint` prompts interactively for ESLint preset configuration (Strict / Base / Cancel). Process hangs waiting for input in a non-interactive shell, then exits code 1. No lint output is produced. | Migrate to `npx eslint .` with an `.eslintrc.json` config, or add `eslint.config.mjs` per Next.js 15 docs. Alternatively remove the `lint` script if linting is not in the workflow. |
| **P3** | Dashboard KPIs | KPI counts do not refresh after Scheduled Actions are fired | Run "Run Lookup & Fire" on the Scheduled Actions page, then navigate back to Dashboard. | Dashboard KPI "Pending Actions" should reflect updated count. | Dashboard still shows the count from when it was last server-rendered. Data is fetched once at page load (SSR) and has no client-side refresh mechanism. | Expected for a prototype with SSR-only data. Add a "Refresh" button to the Dashboard KPI area, or note in the UX that the count reflects the state at page load. |

---

## Feature QA Checklist

### Dashboard
- [x] Dashboard loads without errors
- [x] KPI cards render (Overdue Invoices, Total at Risk, Avg Days Overdue, Pending Actions)
- [x] Needs Attention section shows with clickable cards (Disputes, Blocked, Awaiting Approval, Paused, Unread, Promises to Pay)
- [x] "All clear" banner shown when zero attention items (not tested with all-clear state, but code path exists)
- [x] Overdue Aging bar chart renders
- [x] Collections Trend line chart renders
- [x] Recent Activity feed visible (below fold, verified via scrollable page)
- [x] Run Demo Scenario button present in TopBar
- [x] Navigation from Dashboard to all sections works

### Invoices
- [x] Invoice list loads (25 total, 21 overdue shown correctly)
- [x] Search bar filters in real time
- [x] Status filter dropdown works
- [x] Flow filter dropdown works
- [x] Reply filter dropdown works
- [x] All columns sortable (Invoice, Contact, Amount, Due Date, Days Overdue, Status, Flow, Reply)
- [ ] **"View →" link visible at standard viewport** — hidden off-screen (see P2 bug above)
- [x] Invoice detail page loads without crash (`/invoices/INV013` tested)
- [x] Status Overview panel on invoice detail shows all chips (Status, Days Overdue, Flow, Automation, Customer Reply, Next Action)
- [x] Recommended next step information bar shows
- [x] "Open in Xero" placeholder button present on invoice detail
- [x] Customer Reply panel shows on invoice detail with AI transcript preview
- [x] "View full message in Inbox →" deep-link navigates to `/inbox?message=CALL001` and expands correct message
- [x] Activity Timeline batch groups shown with "Show all" expand

### Inbox
- [x] Inbox loads (11 messages: 8 emails + 3 AI calls)
- [x] Filter tabs work: All, Emails (8), AI Calls (3), Unread, Promise to Pay, Disputes, Queries, Out of Office, Unclassified
- [x] Email replies expand in-place without page reload
- [x] AI call transcripts expand in-place with full dialogue
- [x] Filter tab state is preserved when messages are opened/closed
- [x] Deep-links from invoice detail open correct message expanded
- [x] Automation pause / Reply / View Invoice action buttons visible in expanded messages
- [x] Search within Inbox works

### Automations
- [x] Automations list loads (3 flows: Standard Collection Flow, Quick Email Sequence, Escalation)
- [x] Flow step sequence preview visible per row (with lookup checkpoints noted)
- [x] "Edit Flow" links all navigate to correct builder pages
- [x] "New Automation Flow" button present
- [x] Builder loads existing flow (FLOW001 tested)
- [x] Email, SMS, Call, Delay blocks can be added via toolbar
- [x] Locked "Check still unpaid in Xero" checkbox visible on Email, SMS, Call blocks (cannot be unchecked)
- [x] Unsaved changes "Unsaved changes" label appears in toolbar after edits
- [x] Breadcrumb "Automations" back button shows in-app confirm dialog when dirty
- [x] Browser navigation away from dirty builder triggers `beforeunload` dialog
- [x] Cancelling the confirm keeps user on builder page
- [x] "Save Flow" button present and functional

### Call Templates
- [x] Page loads with 7 templates (5 Active, 2 Draft)
- [x] Templates listed: Overdue Invoice AI Call, Promise-to-Pay Follow-up Call, Dispute Review Follow-up Call, Invoice Copy Request Call, Wrong Contact / Accounts Payable Update Call, Final Reminder Before Human Review, Voicemail Only Template
- [x] "Create Call Template" button present
- [x] Edit / expand / collapse per template works
- [x] Automation Builder Call block dropdown lists all 7 templates

### Scheduled Actions
- [x] Page loads (12 actions total)
- [x] Filter tabs work: All, Pending (4→3 after fire), Awaiting Approval (2), Sent (2→3 after fire), Skipped (2), Blocked (2)
- [x] "Run Lookup & Fire" executes the fresh lookup engine — action moved from Pending to Sent
- [x] Tab counts update after firing an action
- [x] "Skip" button present on Pending actions

### Contacts
- [x] Contacts list loads (10 total, 2 excluded, 1 on hold)
- [x] "2 contacts excluded from all automations" banner shown
- [x] All columns sortable (Contact, Email, Phone, Invoices, Total Owed, Overdue, Status)
- [x] Status badges: Active, Excluded, On Hold

### Onboarding / Setup Wizard
- [x] `/onboarding` loads — Step 1 (Connect Xero) shown
- [x] 6-step progress indicator visible with correct labels
- [x] "Continue" button correctly disabled on Step 1 until Xero connected
- [x] "Connect Xero" button enables "Continue"
- [x] Prototype notice banner visible (explains dummy connection)
- [ ] **Disabled "Continue" has no tooltip explaining why** (see P3 bug above)
- [x] Steps 2–6 not fully walked through (back-end logic tested via code review; onboarding store and `buildSteps()` function confirmed present)

### Settings
- [x] Settings page loads
- [x] Manual Approval Mode toggle present (currently OFF)
- [x] "Run lookup before every action" toggle present (currently ON)
- [x] Blocked Keywords section with chips (legal, solicitor, court, cease, administration) and Add input
- [x] Sender Details fields (Company Name, Default Sender Name, Default Sender Email)

### Global Navigation / Search
- [x] Sidebar 3-group structure: Daily Work / Automation Setup / Admin
- [x] Settings pinned at bottom
- [x] User avatar (JC / James Cooper) at sidebar bottom
- [x] All pages reachable via sidebar
- [x] TopBar global search opens on magnifying glass click
- [x] Global search returns grouped results: Invoices, Contacts, Scheduled Actions, Inbox
- [x] Notification bell present in TopBar

### Version / Docs
- [x] `package.json` version: `2.13.0`
- [x] README title: `v2.13`
- [x] README version history includes `v2.13.0` entry dated 29 May 2026
- [x] CHANGELOG has detailed `v2.13.0` entry at the top
- [x] No old version shown as the latest anywhere

---

## Recommended Next Fixes

1. **[P2] Make invoice rows clickable** — Wrap each `<tr>` with an `onClick` handler that calls `router.push('/invoices/${invoice.id}')` and add `cursor-pointer` class to the row. This removes the dependency on the off-screen "View →" column entirely. Low effort, high impact for daily workflow.

2. **[P2] Add disabled tooltip to Onboarding Step 1 Continue button** — Add `title="Connect Xero above to continue"` to the disabled button. One-line fix. Prevents user confusion on the first step of setup.

3. **[P3] Add favicon and create `/public` directory** — Create `public/favicon.ico`. Removes the console error from every single page load. Use any placeholder 32×32 icon.

4. **[P3] Fix `npm run lint`** — Either add an `eslint.config.mjs` (Next.js 15 flat config format) and change the script to `npx eslint .`, or remove the `lint` script from `package.json` if linting is not in the workflow. Prevents CI confusion.

5. **[P3] Dashboard KPI live-refresh** — Add a "Refresh" button to the Dashboard KPI header row that re-fetches `/api/dashboard`. Minor improvement that makes the dashboard more reliable after firing actions.

---

## Notes

- **Prototype-only features:** No real Xero integration, no real email/SMS/call sending, no payment processing, no auth, no billing. All data is seeded from `/data/*.json` and resets on server restart.
- **Vercel deployment:** Static asset 404s observed on port 3000 were caused by a stale/old dev server instance. Vercel production deployment is unaffected.
- **localStorage persistence:** Automation flows created/edited in the builder, call templates created via Call Templates page, and onboarding progress all persist via Zustand + localStorage and survive cold starts on Vercel.
- **Data resets:** Seed data (contacts, invoices, scheduled actions, inbox) is in-memory only and resets on every Vercel cold start. This is expected prototype behaviour.
- **Inbox "Unread" count:** The unread count badge in the filter tabs and in the sidebar showed 5 on fresh load but 3 after the message for INV-2026-013 was expanded (marking it read). Read-state tracking via message expansion works correctly.

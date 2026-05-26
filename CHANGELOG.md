# CollectPilot — Change Log

---

## v2.3.0 — True Global Search + Notification Bell (26 May 2026)

**Date:** 26 May 2026  
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

## v2.2.0 — Global TopBar Search (26 May 2026)

**Date:** 26 May 2026  
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

**Date:** 26 May 2026  
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

## v2.0.0 — Initial Prototype (26 May 2026)

**Session date:** 26 May 2026  
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

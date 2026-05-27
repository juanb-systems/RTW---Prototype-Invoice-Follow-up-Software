# CollectPilot — Change Log

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

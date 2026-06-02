# CollectPilot — AI Receivables Assistant · v2.63

A Next.js 15 prototype for an AI-powered B2B receivables follow-up platform. Demonstrates automated invoice collection workflows with "Fresh Xero Check" safety gates before every customer contact.

**Live demo:** [https://rtw-prototype-invoice-follow-up-sof.vercel.app/dashboard](https://rtw-prototype-invoice-follow-up-sof.vercel.app/dashboard)

> **Prototype only.** No real Xero integration, no real email/SMS/calls, no payment processing, no auth, no billing, no real customer data. Data resets on Vercel cold start.

---

## What's in the prototype

| Section | What it shows |
|---------|---------------|
| **Dashboard** | KPIs (total outstanding, overdue, collection rate), **Needs Attention** section (disputes, blocked actions, awaiting approval, paused automations, unread replies, promises to pay), aging breakdown chart, collections trend, recent activity feed |
| **Invoices** | Searchable + sortable table with Status / Flow / Reply filters; Flow column shows automation status badge (Active/Paused/Blocked/Needs Approval) and next scheduled action date; Reply column shows reply type and received date; invoice detail adds a **Status Overview** panel showing all key indicators and a recommended next step |
| **Contacts** | Searchable + sortable table (all columns sortable including Phone); contact detail with exclusion controls and invoice history |
| **Automation Builder** | Functional vertical-list builder; add/insert/delete blocks; inline config per block — Email (recipient, subject, body with clickable merge tags, sender, reply-to, live preview), SMS (recipient, body with clickable merge tags), Delay (amount + unit: minutes/hours/days/weeks), Call (template dropdown, timing: immediate/after delay/specific time, notes, merge tags); locked ☑ "Check still unpaid in Xero" on every Email/SMS/Call block; flows persist across refresh via Zustand + localStorage |
| **Scheduled Actions** | Run Lookup & Fire (executes full Fresh Xero Check engine), manual approve/skip per action |
| **Inbox** | Unified feed for email replies and AI call transcripts; filter tabs: All / Emails / AI Calls / Unread / by classification; AI-classified replies (Promise to Pay / Dispute / Out of Office / Payment Query); call records with status (Completed / Voicemail / No Answer / Needs Review) and full transcript; messages expand in-place with no page reload; automation pause control; deep-link from invoice detail |
| **Call Templates** | 7 built-in AI calling script templates (Active and Draft); each includes opening disclosure, AI prompt, fully editable outcome classifications (add/remove chips), voicemail behavior, escalation rules, and clickable merge tag insertion; new templates auto-open in edit mode; unsaved-changes protection on collapse; Automation Builder Call block dropdown lists all templates; create/edit/manage custom templates; prototype only — no real calls |
| **Settings** | Manual approval mode toggle, blocked keywords, sender name/email config |
| **Setup & Onboarding** | 6-step wizard: dummy Xero connection step (simulated OAuth), business profile (name, sender, tone, follow-up style), reminder timing (first reminder day, actions at 14/30 days), channel selection (Email / SMS / AI Call / Manual), safety rules (pause on reply / promise / dispute; locked Xero check), generated setup summary with a prebuilt automation flow and call template applied to the Zustand store on completion. After "Apply Setup" the page shows a persistent **CompletedView** (survives refresh and back-navigation) with the applied flow name, link to builder, and "Restart Setup" option. "Skip" redirects to Dashboard and shows a **SkippedView** on return. Status persisted via Zustand (`"not_started" \| "in_progress" \| "completed" \| "skipped"`). |

---

## Fresh Xero Check (Lookup Engine)

Before every email, SMS, or call action fires, the engine checks:

1. Invoice is not paid or voided
2. Contact is not excluded from automations
3. Invoice is not manually excluded
4. No active dispute on the invoice
5. No recent promise-to-pay (within last 7 days)
6. Manual approval mode status

Outcome: **proceed**, **skip**, **block**, **hold**, or **awaiting_approval** — all logged to the invoice timeline.

In the Automation Builder, this check is represented as a locked, pre-ticked checkbox on each Email, SMS, and Call block. It cannot be disabled — it is enforced server-side regardless of the flow configuration.

---

## Search Architecture

CollectPilot has two independent search mechanisms:

**TopBar Global Search** (magnifying glass, top-right)
- Searches across all sections simultaneously from any page
- Returns grouped results: Invoices · Contacts · Automations · Scheduled Actions · Inbox
- Fetches all section data once on first open, then filters client-side
- Minimum 2 characters to trigger; Escape or click-outside to close

**Page-level Section Search** (search bar inside each list page)
- Filters only the current section in real time
- Available on: Invoices, Contacts, Automations, Scheduled Actions, Inbox
- State managed independently via Zustand (`lib/search-store.ts`)
- Completely separate from TopBar global search

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v3 + Radix UI primitives
- **Icons:** Lucide React
- **Charts:** Recharts v2
- **Flow Builder:** @xyflow/react v12
- **State:** Zustand v5 (client-side search store + flow persistence store)
- **Data:** In-memory JSON store (seeded from `/data/*.json`, resets on server restart) + localStorage for user-created/edited flows

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables required.

```bash
npm run build   # production build check
npm start       # serve production build locally
```

---

## Deployment

The app is deployed to Vercel via GitHub integration. Any push to `main` triggers a redeploy automatically.

**Live URL:** [https://rtw-prototype-invoice-follow-up-sof.vercel.app/dashboard](https://rtw-prototype-invoice-follow-up-sof.vercel.app/dashboard)

No environment variables are required for the current prototype. All data is seeded from `/data/*.json` files.

> **Note on data persistence:** Seeded data (contacts, invoices, scheduled actions, inbox) uses an in-memory store and resets on every Vercel cold start — this is expected for a prototype. **Automation flows** created or edited in the builder are persisted to `localStorage` via Zustand and survive cold starts. For full persistence, replace the JSON store with Supabase or similar.

---

## Project Structure

```
/app          — Next.js App Router pages + API routes
/components   — UI components (layout, invoices, contacts, automations, etc.)
/data         — JSON seed files (contacts, invoices, flows, timeline events, inbox, etc.)
/lib          — Types, in-memory store, lookup engine, server-data utilities
/public       — Static assets
```

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| v2.63.0 | 02 Jun 2026 | Fix inbox detail order to match James' exact request — AI Overview moved back to first position (above message body), email/transcript content back in collapsed accordion ("View email content"/"View call transcript") |
| v2.62.0 | 02 Jun 2026 | Simplify Dashboard Needs Attention — badge shows category count not total items (5 not 25); two overdue buckets merged into one "X overdue 30+ days" card; promises to pay removed from alerts and shown as a separate green "good news" banner below |
| v2.61.0 | 02 Jun 2026 | Language simplification pass — Actions: "Run Lookup & Fire"→"Send Now", "Approve & Run Lookup"→"Approve & Send", "Sending...", "Safety check passed", "Needs your approval to send"; action cards: removed "Invoice:"/"Contact:" prefixes, removed "Was scheduled:" label; Invoices: "Flow: All"→"Automation: All", "Reply: All"→"Response: All", "Payment Query"→"Payment Question"; Actions banner simplified |
| v2.60.0 | 02 Jun 2026 | Contacts page — add Status filter dropdown (Active/Excluded/On Hold), full-width search bar on mobile, count row shows active filter label |
| v2.59.0 | 02 Jun 2026 | Fix dark mode text readability — text-gray-400 remapped from slate-600 (1.7:1 contrast, unreadable) to slate-400 (5:1, readable); text-gray-500 also bumped to slate-400; bg-gray-50/70 opacity variant added |
| v2.58.0 | 02 Jun 2026 | Invoice Detail Automation section — collapsed by default with flow name in label, tap to expand summary, Edit opens full form, Save/Cancel collapses back |
| v2.57.0 | 02 Jun 2026 | Fix Inbox message box visibility — changed from invisible border-gray-100/bg-white to border-gray-200/bg-gray-50/shadow-sm card with white label bar |
| v2.56.0 | 02 Jun 2026 | Contact detail Automation Status — moved below Invoices on mobile, collapsed by default with chevron toggle; tap to expand, shows current status in collapsed label; Edit opens full form; Save/Cancel collapses back |
| v2.55.0 | 02 Jun 2026 | Reorder Inbox detail panel — subject+sender+message body shown first, AI Overview and recommended action moved below the message content so user reads the actual email before the analysis |
| v2.54.0 | 02 Jun 2026 | Inbox email content always visible — removed accordion toggle from message detail; email body and call transcript now show directly below AI Overview without requiring a click |
| v2.53.0 | 02 Jun 2026 | Fix Invoice Detail Status Overview — removed duplicate Automation flow-name chip (already shown in sidebar), renamed remaining Automation label to "Auto Status" so all labels are unique |
| v2.52.0 | 02 Jun 2026 | Make Dashboard Needs Attention item rows fully clickable — entire row is now a Link (not just the "View →" button); hover state added; all three row types updated (invoice, action, message) |
| v2.51.0 | 02 Jun 2026 | Fix Invoices Automation column — flow name and status badge now stack vertically (flex-col) instead of running together inline |
| v2.50.0 | 02 Jun 2026 | Fix AI call transcript speaker labels — "Contact:" recognised alongside "Customer:" so seeded transcripts display with distinct AI Caller (green bg) and Customer (blue bg) blocks instead of raw italic text |
| v2.49.0 | 02 Jun 2026 | Dashboard "View all →" links now pre-filter destination pages — Invoices reads ?status=, Actions reads ?filter=, Inbox reads ?filter= from URL; all pages wrapped in Suspense for useSearchParams support |
| v2.48.0 | 02 Jun 2026 | Fix Invoice Detail Customer Reply panel — skip call-type messages (AI call transcripts no longer in Inbox); Status Overview still captures call classification and recommendation |
| v2.47.0 | 02 Jun 2026 | Remove redundant Automation section on Invoice Detail — static "Assigned flow" card removed, InvoiceDetailActions summary view now shows automation name + description; edit controls remain hidden until Edit is clicked |
| v2.46.0 | 02 Jun 2026 | Remove expand/collapse from Invoice Detail Line Items and Activity Timeline — both sections are now always visible with static header (title + count badge, no chevron); unused CollapsibleSection import removed |
| v2.45.0 | 02 Jun 2026 | Fix mobile Invoice Detail line items — hidden sm:block table + sm:hidden stacked cards; each item shows description, qty, unit price, line total; invoice total row at bottom; Status Overview chips get max-w + truncate for long automation names and dates |
| v2.44.0 | 02 Jun 2026 | Inbox is now email-only — all call-type messages removed from every filter path; "Call Transcripts" filter tab removed; Inbox counts and footer reflect email replies only; AI call outcomes visible in Actions page and Invoice Detail |
| v2.43.0 | 02 Jun 2026 | Clarify Inbox call transcripts — filter tab renamed "AI Calls" → "Call Transcripts", MessageDetail type badge changed to "Customer call transcript", empty state shows "No customer call transcripts to review", description updated to clarify voicemail/no-answer live in Actions |
| v2.42.0 | 02 Jun 2026 | Remove voicemail/no-answer from Inbox completely — isSystemOutcome guard applied to ALL filter paths (all, calls, unread, needs_action), callMessages count excludes them, footer counts reflect only email replies + meaningful AI call transcripts, subtitle shows unread-only when non-zero |
| v2.41.0 | 29 May 2026 | Progressive disclosure completion — Dashboard charts/activity in collapsed accordions, Templates AI prompt hidden by default behind accordion toggle, Contact ExclusionControls shows summary+Edit by default with full radio controls only in edit mode |
| v2.40.0 | 29 May 2026 | Complete progressive disclosure — voicemail/no-answer filtered out of Inbox "All" view (accessible via "AI Calls" filter), unread count excludes system outcomes, Invoice Detail Line Items and Activity Timeline wrapped in CollapsibleSection accordions (collapsed by default) |
| v2.39.0 | 29 May 2026 | Progressive disclosure in Inbox and Invoice detail — AI Overview at top of every message detail view, email/transcript content moved into accordion (collapsed by default), AI call transcript uses distinct AI Caller/Customer speaker blocks with left-border indicators, Invoice detail Automation section shows summary+Edit button by default, edit controls only visible in edit mode |
| v2.38.0 | 29 May 2026 | Simplify Inbox filters — 7 visible filter tabs replaced by single Filter dropdown button; search and filter combined into one row; active filter shown in button label; Clear filter option in dropdown; changing filter clears detail panel to avoid stale state |
| v2.37.0 | 29 May 2026 | Expandable Needs Attention cards — each card collapses to count+label+description, expands on click to show up to 3 related items (invoice#/contact/amount for overdue+disputes; action type/invoice/reason for blocked+approval; contact/invoice/subject for inbox items) with "View all N →" overflow link; accordion behavior keeps only one card open; server data function getAttentionDetails() provides flat serializable item lists |
| v2.36.0 | 29 May 2026 | Fix mobile Contact detail layout — responsive single-column stacked layout on mobile, email/phone stack vertically, Total Owed uses break-all + smaller text, Automation Status appears inline between stats and invoices on mobile, invoice table replaced by mobile cards (< sm) |
| v2.35.0 | 29 May 2026 | Fix sidebar navigation — NavItem converted from button+router.push to Next.js Link component; sidebar aside gets z-10 and desktop wrapper gets z-20 to ensure navigation is never covered by page-level overlays |
| v2.34.0 | 29 May 2026 | Simplify Automations page — removed step chip chains from flow cards, replaced with "Sends via: Email · SMS · AI Call" + "Safety check before every send" summary line; renamed all user-facing "Flow" labels to "Automation" (New Automation, Edit Automation, All Automations, Automation name); safety-check language replaces "Fresh lookup" in the page banner |
| v2.33.0 | 29 May 2026 | Refined clickable card interactions — Actions cards expand historical details on click (buttons never trigger expand); Templates card header area (icon + info) now clickable to expand/collapse; stopPropagation on Edit/Chevron/Delete buttons; Run Lookup and Skip buttons safe from accidental card clicks |
| v2.32.0 | 29 May 2026 | Clickable list cards — Automation flow cards, Invoice table rows and mobile cards, Contact table rows and mobile cards all navigate on click; cursor-pointer + hover states added; button/link click propagation stopped to prevent double-trigger; Notifications already used Link wrappers; Inbox rows already had onClick |
| v2.31.0 | 29 May 2026 | Add simplified page descriptions — helper text under page titles on all main sections (Dashboard, Invoices, Inbox, Notifications, Actions, Automations, Templates, Contacts, Settings, Preferences, Onboarding, Invoice Detail) using new TopBar description prop |
| v2.30.0 | 29 May 2026 | Add Contact creation — "Add Contact" button in Contacts header opens a modal form (name, company, email, phone, status, notes); validates required fields and email format; POSTs to API and appends to list immediately; persists within server session; mobile-friendly bottom-sheet modal |
| v2.29.0 | 29 May 2026 | Inbox detail panel — clicking a message now opens a side detail panel (desktop) or full-screen view (mobile) instead of expanding inline; inbox list stays clean and scannable; AI call transcripts shown in readable chat format (AI / Customer speaker labels); one combined status alert per message instead of stacked boxes; recommended action surfaced prominently; deep links still work |
| v2.28.0 | 29 May 2026 | Simplify daily workflow — sidebar restructured to Daily Work (Dashboard/Invoices/Inbox/Actions) and Setup (Automations/Templates/Contacts/Onboarding), Scheduled Actions renamed to Actions, Call Templates renamed to Templates in nav, dashboard language simplified (Outstanding Balance, System Activity label, plain-English attention copy), invoice mobile cards show one plain-English primary status, safety check language replaces lookup jargon |
| v2.27.0 | 29 May 2026 | Gmail-style Inbox clarity refinement — badge moved to right side next to date (no longer on a separate row), company name inline with sender on Line 1, type label row removed (icon + subject communicate type), all rows use uniform hover:bg-gray-50 (no read/unread background differences), badge hidden on mobile (date stays clear), mobile badge shown below subject instead |
| v2.26.0 | 29 May 2026 | Improve Gmail-style Inbox clarity — 4-line row structure (sender+date / subject / type·invoice·badge / preview), read rows visually dimmed, unread rows bold+white, selected rows get blue left-border accent, type labels explicit (Email Reply / AI Call Transcript / Voicemail), date text-gray-500/600 not gray-400, stronger row dividers, expanded section adds invoice summary card and recommended action, mobile date shown under content |
| v2.25.0 | 29 May 2026 | Simplify daily workflow UX - Gmail-style Inbox (flat list, single primary badge, sender-first, date right-aligned), removed info banners, Dashboard Needs Attention moved above KPIs with 30-60d and 60+ overdue buckets, Invoices mobile needs-attention flags and richer status context, desktop Flow column decluttered |
| v2.24.0 | 29 May 2026 | Add functional dark mode — global CSS override strategy (non-@layer rules beat Tailwind utilities); covers all neutral surfaces, colored tints (blue/green/red/orange/amber/purple/teal/yellow/indigo), text, borders, dividers, hover states, form inputs, shadows; Light/Dark/System all active in Preferences; theme persists in localStorage |
| v2.23.0 | 29 May 2026 | Fix preferences appearance options — Dark and System are now visually disabled with "Coming soon" labels and cannot be selected; Light is shown as the current active theme; copy updated to clearly state only Light is supported in this prototype |
| v2.22.0 | 29 May 2026 | Enable Preferences — new /preferences page (appearance/theme via next-themes, compact mode, notification toggles persisted to localStorage via Zustand); ThemeProvider wired up in root layout; Preferences activated as clickable link in sidebar account menu |
| v2.21.0 | 29 May 2026 | Polish sidebar account menu — disabled items (Account, Preferences, Sign out) use static divs with no hover, clearer labels ("Coming soon", "Disabled in demo"); Demo mode is an informational status row; Settings remains the only interactive item |
| v2.20.0 | 29 May 2026 | Fix sidebar profile block — removed direct /settings navigation from profile block; profile block now opens a prototype-safe account popover menu (Account, Preferences, Settings, Demo mode, Sign out) above the block; Settings nav item remains separate; menu closes on outside click; works in desktop sidebar and mobile drawer |
| v2.19.0 | 29 May 2026 | Notifications feature — dedicated /notifications page with 7 filter tabs (All/Unread/Invoices/Replies/Automations/Calls/System), read/unread status, category badges, detail text, timestamps, action links; bell dropdown shows top 3 with unread count badge and "See all notifications" link; Notifications added to sidebar nav |
| v2.18.0 | 29 May 2026 | Mobile responsiveness overhaul — Invoices and Contacts mobile card layouts (sm:hidden cards, hidden sm:table), icon-only TopBar buttons on mobile for Scheduled/Inbox/Call Templates, ScheduledActionCard flex-wrap action buttons |
| v2.17.0 | 29 May 2026 | Fix mobile dashboard — KPI card layout restructure (value full-width, no icon competition), text-xl sm:text-2xl values, p-3 sm:p-5 cards, DemoScenarioButton icon-only on mobile, invoice detail amount responsive text |
| v2.16.0 | 29 May 2026 | Mobile UX pass 2 — automations card vertical layout with full-width Edit button on mobile, compact step summary, flex-wrap metrics; RecentActivityFeed whitespace-nowrap invoice numbers; global p-4 sm:p-6 padding sweep; scheduled filter tabs flex-wrap |
| v2.15.0 | 29 May 2026 | Mobile responsiveness — collapsible sidebar drawer, hamburger menu, responsive grids on Dashboard/Invoice Detail/Onboarding/Inbox/Call Templates |
| v2.14.0 | 29 May 2026 | Fix onboarding page state persistence — CompletedView and SkippedView survive refresh and back-navigation; status discriminated union persisted in Zustand |
| v2.13.0 | 29 May 2026 | Version and docs consolidation: streamlined navigation (3-group sidebar), invoice-first daily workflow, dummy onboarding wizard with Xero connect, reminder timing, channel and safety-rule setup questions, generated prebuilt flow/template from onboarding answers |
| v2.12.0 | 28 May 2026 | Navigation refinement per confirmed IA: 3-group sidebar (Daily Work / Automation Setup / Admin), all features retained and accessible |
| v2.11.0 | 28 May 2026 | Streamlined UX: sidebar groups (Daily Work / Setup), Needs Attention dashboard section, invoice automation status badges, Status Overview panel on invoice detail, 6-step onboarding wizard with Xero placeholder and flow generation |
| v2.10.1 | 28 May 2026 | Hotfix: Invoice Reply column now sortable (was static/non-clickable) |
| v2.10.0 | 28 May 2026 | Editable outcome classifications in Call Templates, new templates auto-open in edit mode, unsaved-changes protection (Call Templates collapse + Automation Builder breadcrumb/sidebar), nav guard store |
| v2.9.0 | 28 May 2026 | 6 additional call templates (TPL002–TPL007), Inbox message selection without page reload, clickable merge tags in Call Templates editor |
| v2.8.0 | 28 May 2026 | Call Templates page, AI call transcripts in Inbox, clickable merge tags in builder, Call block template dropdown, flow save persistence fix |
| v2.7.1 | 28 May 2026 | Builder block config expanded: Email (recipient, body, reply-to, preview), SMS (recipient, body), Delay (unit dropdown), Call (assignee, timing, date/time) |
| v2.7.0 | 28 May 2026 | Functional builder rewrite: add/insert/delete blocks, inline editing, Xero checkbox, Save ✓ feedback; React Flow canvas removed |
| v2.6.0 | 28 May 2026 | Flow persistence via Zustand + localStorage; direct builder navigation without server round-trip |
| v2.5.2 | 27 May 2026 | New Automation Flow button on Automations page — opens modal, creates blank draft flow, navigates directly to builder |
| v2.5.1 | 27 May 2026 | Xero check on action blocks changed from amber badge to locked auto-ticked checkbox |
| v2.5.0 | 27 May 2026 | Timeline batch headers show date not time; Automation Builder simplified (lookup nodes hidden, send blocks show Xero check checkbox) |
| v2.4.1 | 27 May 2026 | Hotfix: RSC serialization crash on invoice detail page (onClick on server component) |
| v2.4.0 | 27 May 2026 | Inbox deep-links, batched timeline, invoice dropdown filters, Open in Xero button |
| v2.3.0 | 27 May 2026 | True global TopBar search (all sections), interactive notification bell |
| v2.2.0 | 27 May 2026 | Zustand search store, TopBar embedded search, search on Automations/Scheduled/Inbox |
| v2.1.0 | 27 May 2026 | Invoice/contact search improvements, Reply column on invoice list |
| v2.0.0 | 27 May 2026 | Initial prototype (James C feedback: search, sort, timelines, flow builder, inbox) |

Full details in [CHANGELOG.md](CHANGELOG.md).

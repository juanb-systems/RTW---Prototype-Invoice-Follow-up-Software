# CollectPilot — AI Receivables Assistant · v2.20

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

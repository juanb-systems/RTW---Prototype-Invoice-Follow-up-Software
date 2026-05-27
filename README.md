# CollectPilot — AI Receivables Assistant · v2.6

A Next.js 15 prototype for an AI-powered B2B receivables follow-up platform. Demonstrates automated invoice collection workflows with "Fresh Xero Check" safety gates before every customer contact.

**Live demo:** [https://rtw-prototype-invoice-follow-up-sof.vercel.app/dashboard](https://rtw-prototype-invoice-follow-up-sof.vercel.app/dashboard)

> **Prototype only.** No real Xero integration, no real email/SMS/calls, no payment processing, no auth, no billing, no real customer data. Data resets on Vercel cold start.

---

## What's in the prototype

| Section | What it shows |
|---------|---------------|
| **Dashboard** | KPIs (total outstanding, overdue, collection rate), aging breakdown chart, collections trend, recent activity feed |
| **Invoices** | Searchable + sortable table with Status / Flow / Reply status dropdown filters; invoice detail with line items, collapsible batched timeline, customer reply panel, upcoming actions |
| **Contacts** | Searchable + sortable table; contact detail with exclusion controls and invoice history |
| **Automation Builder** | Visual drag-and-drop flow builder (Trigger → Email → Delay → SMS → Delay → Call → End); each send block shows a locked ☑ "Check still unpaid in Xero" safety checkbox; create new flows from the Automations list; node palette toolbar to add Email/SMS/Call/Delay/Branch/End blocks; trigger type dropdown (days overdue, invoice created, reply received, manual) |
| **Scheduled Actions** | Run Lookup & Fire (executes full Fresh Xero Check engine), manual approve/skip per action |
| **Inbox** | AI-classified customer replies (Promise to Pay / Dispute / Out of Office / Payment Query); automation pause control; deep-link from invoice detail |
| **Settings** | Manual approval mode toggle, blocked keywords, sender name/email config |

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
| v2.6.0 | 27 May 2026 | Flow persistence via Zustand + localStorage; node palette toolbar (add Email/SMS/Call/Delay/Branch/End); trigger type dropdown; direct builder navigation without server round-trip |
| v2.5.2 | 26 May 2026 | New Automation Flow button on Automations page — opens modal, creates blank draft flow, navigates directly to builder |
| v2.5.1 | 26 May 2026 | Xero check on action blocks changed from amber badge to locked auto-ticked checkbox |
| v2.5.0 | 26 May 2026 | Timeline batch headers show date not time; Automation Builder simplified (lookup nodes hidden, send blocks show Xero check checkbox) |
| v2.4.1 | 26 May 2026 | Hotfix: RSC serialization crash on invoice detail page (onClick on server component) |
| v2.4.0 | 26 May 2026 | Inbox deep-links, batched timeline, invoice dropdown filters, Open in Xero button |
| v2.3.0 | 26 May 2026 | True global TopBar search (all sections), interactive notification bell |
| v2.2.0 | 26 May 2026 | Zustand search store, TopBar embedded search, search on Automations/Scheduled/Inbox |
| v2.1.0 | 26 May 2026 | Invoice/contact search improvements, Reply column on invoice list |
| v2.0.0 | 26 May 2026 | Initial prototype (James C feedback: search, sort, timelines, flow builder, inbox) |

Full details in [CHANGELOG.md](CHANGELOG.md).

# CollectPilot — AI Receivables Assistant · v2.3

A Next.js 15 prototype for an AI-powered B2B receivables follow-up platform. Demonstrates automated invoice collection workflows with "Fresh Xero Check" safety gates before every customer contact.

> **v2.3 update:** TopBar search is now true app-wide global search — returns grouped results from Invoices, Contacts, Automations, Scheduled Actions, and Inbox simultaneously, regardless of the current page. Notification bell is now interactive with a dropdown panel. See [Search architecture](#search-architecture) below.

> **v2.2 update:** Global TopBar search and page-level search bars share state via Zustand across all 5 sections.

> **v2.1 update:** Working search + clear on Invoices and Contacts; reply visibility column on invoice list; Customer Reply panel promoted to top of invoice detail sidebar.

> **Prototype only.** No real Xero integration, no real email/SMS/calls, no payment processing, no auth, no billing, no real customer data.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v3 + Radix UI primitives
- **Icons:** Lucide React
- **Charts:** Recharts v2
- **Flow Builder:** @xyflow/react v12
- **Data:** In-memory JSON store (resets on server restart — no database)

---

## Local Development

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

---

## Deploy to Vercel (Recommended)

This is a standard Next.js app — deploy with one command or via the Vercel dashboard.

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel will auto-detect Next.js and configure the build.

### Option B — GitHub Integration

1. Push this repository to GitHub (ensure `.gitignore` excludes `node_modules/` and `.next/`).
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the GitHub repository.
4. Leave all build settings at default (Vercel auto-detects Next.js).
5. Click **Deploy**.

### Environment Variables

This prototype requires **no environment variables** for the current version. All data is seeded from `/data/*.json` files on server startup.

If you add Supabase or another database in future:
- Store `SUPABASE_URL` and `SUPABASE_ANON_KEY` (public/publishable) in Vercel's Environment Variables UI.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only — never expose it to the client.
- Enable Row Level Security (RLS) on all Supabase tables.

### Important Notes for Vercel Deployment

- **In-memory data resets on each serverless function cold start.** This is expected for a prototype. For persistence, replace the JSON store with a database (Supabase, PlanetScale, etc.).
- The `/api/*` routes use `export const dynamic = "force-dynamic"` to prevent static caching. This is correct for the in-memory store pattern.
- No secrets or API keys are required. Do not commit `.env` files.

---

## Project Structure

```
/app          — Next.js App Router pages + API routes
/components   — UI components (layout, invoices, contacts, automations, etc.)
/data         — JSON seed files (contacts, invoices, flows, timeline events, etc.)
/lib          — Types, store, lookup engine, server-data utilities
/public       — Static assets
```

## Search Architecture

CollectPilot has two distinct and independent search mechanisms:

### 1. TopBar Global Search (magnifying glass icon, top-right)
- Searches **across all sections simultaneously** from any page
- Returns grouped results: Invoices · Contacts · Automations · Scheduled Actions · Inbox
- Each result shows the item title, short context, and links directly to the detail page
- Fetches all section data once on first open, then filters client-side
- Minimum 2 characters to trigger results
- Keyboard: Escape closes; clicking outside dismisses

### 2. Page-level Section Search (search bar inside each list page)
- Filters **only the current section** in real time as you type
- Available on: Invoices, Contacts, Automations, Scheduled Actions, Inbox
- State managed independently via Zustand (`lib/search-store.ts`)
- Has no connection to the TopBar global search — they are completely separate

**In short:** Use the TopBar search to find anything, anywhere. Use the page search bar to narrow down what you're already looking at.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | KPIs, aging chart, collections trend, recent activity feed |
| **Invoices** | Searchable + sortable table, invoice detail with timeline |
| **Contacts** | Searchable + sortable table, exclusion controls |
| **Automation Builder** | Visual flow builder with Fresh Xero Check enforcement |
| **Scheduled Actions** | Run lookup & fire, approve/skip actions |
| **Inbox** | Classified customer replies, automation pause control |
| **Settings** | Manual approval mode, blocked keywords, sender config |

## Fresh Xero Check (Lookup Engine)

Before every email, SMS, or call action fires, the engine checks:

1. Invoice is not paid or voided
2. Contact is not excluded from automations
3. Invoice is not manually excluded
4. No active dispute on the invoice
5. No recent promise-to-pay (last 7 days)
6. Manual approval mode status

Outcome: **proceed**, **skip**, **block**, **hold**, or **awaiting_approval** — all logged to the invoice timeline.

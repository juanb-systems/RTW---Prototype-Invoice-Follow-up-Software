# CollectPilot — Change Log

---

## v2.75.0 — Financial Label Clarity Audit (03 Jun 2026)

**Date:** 03 Jun 2026
**package.json version:** 2.75.0

### Fixed

**Invoice Detail — Contact card customer balance label (`app/invoices/[id]/page.tsx`):**

When a contact had multiple overdue invoices, the Contact card showed "Total Overdue: $42,000" alongside the current invoice amount of $31,000 — making it look like a data inconsistency rather than helpful context.

**Changes:**
- Label renamed from "Total Overdue" → **"Customer Overdue Balance"** — clearly scoped to the customer, not this invoice
- Sub-label changed from "N overdue invoices" → **"Across N overdue invoices"** — always shown (since block is only rendered when N > 1)
- Condition changed from `contactTotalOverdue > 0` → `contactOverdueInvoices.length > 1` — customer balance is only surfaced when the contact has multiple overdue invoices. When only 1 overdue invoice exists (the current one), the customer total equals the invoice amount, making a separate display redundant and misleading.

---

## v2.68.0 — Remove Redundant Inbox Detail Summaries (03 Jun 2026)

**Date:** 03 Jun 2026
**package.json version:** 2.68.0

### Fixed

**Inbox `MessageDetail` — removed duplicate summary sections (`app/inbox/page.tsx`):**

The detail panel was showing the same information in three separate boxes for normal outcomes:
1. AI Overview: "Customer promised to pay... automation on hold... monitor payment"
2. Green status banner: "Customer promised to pay — automation on hold for 7 days."
3. Blue Recommended box: "Monitor payment. If unpaid after the promised date..."

All three said essentially the same thing.

**What was removed:**
- `statusItems` array and green/amber status banner — completely removed
- `recommendedAction` string and blue "Recommended" box — completely removed
- `isUrgent` variable — no longer needed

**What replaced them:**
- Single `exceptionWarning` — only rendered for genuinely high-risk exceptions:
  - `dispute`: "Dispute raised — review this invoice before sending more reminders. Automation is paused."
  - `needs_review`: "This call needs human review. Automation is paused until you decide on the next step."

**For all normal outcomes** (promise to pay, payment query, out of office, paused automation): the AI Overview is the only summary panel. No separate banners.

**Result:** For a `promise_to_pay` message, the detail panel now shows:
1. Subject + sender + date
2. AI Overview (covers what happened + why + next step)
3. Invoice link
4. Email content accordion
5. Action buttons (no duplicate summary boxes)

---

## v2.66.0 — Visual Redesign: Hero Summary Cards & Invoice Row Polish (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.66.0

### Changed

**Dashboard — KPI row replaced with large hero summary cards:**

The four small KPI metric cards have been replaced with large, visually prominent hero summary cards. Each hero card covers a single key metric (Total Overdue, Avg Days Overdue, Actions Pending, Critical Alerts) with a larger value display, supporting context text, and clearer visual hierarchy. The hero layout makes the most important numbers immediately scannable at a glance without requiring users to parse small dense cards.

**Invoice rows — improved hierarchy and spacing:**

Invoice list rows have been polished with better typographic hierarchy — primary information (customer name, invoice number, amount) is more prominent, secondary information (dates, automation status) is visually de-emphasised. Row padding and spacing tightened for a cleaner, less cluttered list.

---

## v2.64.0 — Invoices Filter Simplification (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.64.0

### Changed

Replaced the 3 separate filter dropdowns on the Invoices page (Status, Automation, Response) with a single unified **Filter** dropdown. All filter logic is preserved — the combined dropdown exposes the same status, automation, and response filter values as before, reducing visual clutter and making the filter controls easier to use on both desktop and mobile.

---

## v2.50.0 — Fix AI Call Transcript Speaker Labels (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.50.0

### Fixed

**`TranscriptView` — "Contact:" speaker label now recognised (`app/inbox/page.tsx`):**

The seeded transcript data uses `Contact:` as the speaker prefix for customer responses (e.g. `Contact: Yeah, sure. Look, I know it's overdue.`), but `TranscriptView` only matched `Customer:`. Lines starting with `Contact:` fell through to the plain italic catch-all, making them visually identical to system notes — which was why the customer side of the transcript appeared faint and hard to read.

**Regex fixes:**
- `hasSpeakers` check: added `Contact` → `/^(AI( caller)?|Customer|Contact):/i`
- `custMatch`: added `Contact` → `/^(Customer|Contact): /i`

**Visual improvements (James: "the caller should be much more obvious"):**
- AI Caller blocks: `bg-green-50 border border-green-100` rounded card with `AI CALLER` label
- Customer blocks: `bg-blue-50 border border-blue-100` rounded card with `Customer` label and italic body text
- Colour-block cards replace the previous left-border-only style — the two sides of the conversation are now clearly distinct at a glance
- Max height increased from `max-h-72` to `max-h-96` to show more of longer transcripts without scrolling

---

## v2.49.0 — Dashboard "View all" Links Pre-Filter Destination Pages (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.49.0

### Fixed

**Dashboard Needs Attention "View all →" links now land on pre-filtered pages.**

Previously all links went to the root URL of each destination page with no filter applied, so clicking "View all 4 overdue 60+ days" landed on the full invoice list showing all 25 invoices.

**Changes:**

`components/dashboard/NeedsAttentionSection.tsx` — updated `viewAllHref` values:

| Card | Old href | New href |
|------|----------|----------|
| Disputes | `/invoices?status=disputed` | unchanged ✓ |
| Blocked actions | `/scheduled` | `/scheduled?filter=blocked` |
| Overdue 60+ days | `/invoices` | `/invoices?status=overdue` |
| Overdue 30–60 days | `/invoices` | `/invoices?status=overdue` |
| Needs approval | `/scheduled` | `/scheduled?filter=awaiting_approval` |
| Automations paused | `/inbox` | `/inbox?filter=needs_action` |
| Unread replies | `/inbox` | `/inbox?filter=unread` |
| Promises to pay | `/inbox?filter=promise_to_pay` | unchanged ✓ |

**Destination pages updated to read URL params:**

- `app/invoices/page.tsx` — `useSearchParams` added; `statusFilter` initialised from `?status=` param; wrapped in Suspense.
- `app/scheduled/page.tsx` — `useSearchParams` added; `filter` initialised from `?filter=` param; wrapped in Suspense.
- `app/inbox/page.tsx` — `filter` state now initialised from `?filter=` param (already had Suspense + useSearchParams for deep-link support).

**Invoices overdue note:** `/invoices?status=overdue` shows all overdue invoices. The default sort is already `daysPastDue desc`, so 60+ day items appear at the top of the list automatically.

---

## v2.48.0 — Fix Invoice Detail Customer Reply Panel (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.48.0

### Fixed

**Invoice Detail — "Customer Reply" panel no longer shows AI call transcripts (`app/invoices/[id]/page.tsx`):**

`getLatestInboxMessageForInvoice` returns the most recent inbox message for an invoice, which can be a call-type message (e.g. an AI call transcript with `type: "call"`). Since Inbox was made email-only in v2.44.0, showing a call record in the "CUSTOMER REPLY" sidebar panel was inconsistent — the label "Customer Reply" was wrong, and the "View full message in Inbox →" link would lead nowhere since calls are not in the Inbox.

**Fix:** Added `latestMessage.type !== "call"` guard on the `CustomerReplyPanel`:

```tsx
{latestMessage && latestMessage.type !== "call" && (
  <CustomerReplyPanel message={latestMessage} />
)}
```

The **Status Overview** section at the top of the Invoice Detail page continues to use `latestMessage` (including call-type) for its classification chips and recommended-action banner — so the useful outcome data (e.g. "Promise to Pay" from a call) is still surfaced there.

---

## v2.47.0 — Remove Redundant Automation Section on Invoice Detail (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.47.0

### Fixed

**Invoice Detail right sidebar — removed duplicate Automation display:**

The right sidebar had two separate sections both showing the assigned automation:
1. A static "Assigned flow" card (always visible, showed name + description)
2. `InvoiceDetailActions` component summary view (showed name + Edit button)

This created the redundancy James flagged: the automation name appeared twice, and the full edit form (dropdown, exclude button, Save) appeared as a separate "ACTIONS" card below.

**Fix:**
- Removed the static "Assigned flow" card from `app/invoices/[id]/page.tsx`
- Added `assignedFlowDescription` prop to `InvoiceDetailActions` and displayed it in the summary view beneath the automation name
- The right sidebar now has ONE automation section: name + description + Edit button
- Clicking **Edit** reveals: dropdown to reassign automation + exclude toggle + Save/Cancel
- Clicking **Cancel** or **Save** returns to the summary view

**Result:** The automation section is clean by default — name + description only. All edit controls hidden until requested.

---

## v2.46.0 — Remove Expand Controls from Invoice Detail Sections (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.46.0

### Changed

**Line Items and Activity Timeline — static sections, no chevron (`app/invoices/[id]/page.tsx`):**

Both sections previously used `<CollapsibleSection>` (which renders a chevron toggle button). The user requested these sections remain always visible with no expand/collapse UI.

Both sections are now rendered as plain `<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">` cards with:
- A static header row: title text + count badge (no chevron, no click handler)
- Content always visible beneath

The mobile stacked card layout for Line Items (from v2.45.0) is preserved exactly. The Activity Timeline `<BatchedTimeline>` is preserved exactly.

**Cleanup:** `CollapsibleSection` import removed from `app/invoices/[id]/page.tsx` — it is no longer used on this page (the component itself remains available for other uses).

---

## v2.45.0 — Fix Mobile Invoice Detail Line Items (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.45.0

### Fixed

**Invoice Detail Line Items mobile layout (`app/invoices/[id]/page.tsx`):**

The `overflow-x-auto` table with `min-w-[360px]` caused horizontal scroll and cut-off totals on mobile. The fix uses the same `hidden sm:block` / `sm:hidden` dual-layout pattern used throughout the app:

- **Desktop (sm+):** `hidden sm:block` — existing table layout unchanged (4 columns: Description, Qty, Unit Price, Total)
- **Mobile (< sm):** `sm:hidden` — stacked card layout:
  - Each item shows: description (full width), then a 2-column grid for Qty + Unit Price, then a border-separated "Line total" row
  - Invoice Total shown as a full-width footer row with `bg-gray-50/70`
  - No horizontal overflow, all amounts visible, text wraps cleanly

**Status Overview chip overflow prevention (`app/invoices/[id]/page.tsx`):**
- Automation name chip: added `max-w-[180px] truncate` — long automation names no longer push content outside the container
- Next Action chip: added `max-w-[200px]` with `truncate` span — step type + date string is capped

**Other sections checked:** Invoice summary header (amount uses `text-xl sm:text-2xl` — fine), Activity Timeline (BatchedTimeline scrolls internally — fine), Customer Reply panel (existing layout is column-based — fine), Automation summary (`InvoiceDetailActions` uses full-width layout — fine).

---

## v2.44.0 — Inbox is Email-Only (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.44.0

### Changed

**Inbox now shows email replies only (`app/inbox/page.tsx`):**

All call-type messages (`m.type === "call"`) are excluded from the Inbox at every filter path. The `isCallMessage` guard fires first, before any category-specific logic:

```js
if (isCallMessage(m)) return false;  // always — no call record appears in Inbox
```

This removes:
- Voicemail records
- No-answer records
- Completed AI call transcripts (even with dispute/promise outcomes)

**Why:** James specifically said he does not need call-related records in the Inbox. Call items (even when the customer spoke) look like automated/AI-system records to a business owner, not like "things the customer sent back." Email replies are the clear, familiar customer communication format.

**Where call outcomes appear instead:**
- Invoice Detail page → "Customer Reply" sidebar panel shows the latest inbox message (email only now), and the AI Overview + recommended action remain
- Actions page → `ScheduledActionCard` shows lookup/call results (voicemail, no-answer, completed) in the expandable detail section

**"Call Transcripts" filter tab removed** from `FILTER_OPTIONS` since it would always be empty.

**New filter options:** Unread | Disputes | Promises | Payment Questions | Needs Action

**Counts updated:** `emailMessages`, `unread`, footer total — all use email-only messages.

---

## v2.43.0 — Clarify Inbox Call Transcript Labels (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.43.0

### Changed

**Inbox call transcript clarity (`app/inbox/page.tsx`):**

After v2.42.0 ensured voicemail/no-answer never reach the Inbox list, the UI labels still said "AI Calls" and "AI Call Transcript" which made users unsure whether voicemail items were included. These label changes make it unambiguous:

| Before | After |
|--------|-------|
| Filter tab: "AI Calls" | Filter tab: "Call Transcripts" |
| MessageDetail badge: "AI Call Transcript" | MessageDetail badge: "Customer call transcript" |
| Empty state (calls filter): "No messages in this category." | "No customer call transcripts to review." |
| Page subtitle (0 unread): "Customer replies and call transcripts" | "All caught up" |
| Page description | "Customer email replies and call transcripts where the customer spoke. Voicemail and no-answer outcomes appear in Actions." |

**Context:** Any call transcript that now appears in the Inbox has `callStatus !== "voicemail"` and `callStatus !== "no_answer"` — guaranteed by the `isSystemOutcome` gate added in v2.42.0. Renaming the label to "Customer call transcript" accurately describes what is shown: calls where the customer actually spoke and there is a meaningful outcome (dispute, promise to pay, needs review, etc.).

---

## v2.42.0 — Remove Voicemail / No-Answer from Inbox (02 Jun 2026)

**Date:** 02 Jun 2026
**package.json version:** 2.42.0

### Fixed

**The root bug:** `isSystemOutcome` (voicemail + no_answer) was only applied to the `"all"` filter in v2.40. Every other filter path still showed these items, and `callMessages` count still included them.

**Comprehensive fix applied to `app/inbox/page.tsx`:**

The exclusion now happens at the top of the filter chain — **before** any category filter is evaluated:

```js
// First gate: reject system outcomes from ALL filter paths
if (isSystemOutcome(m)) return false;

// Then apply category-specific logic
if (filter === "all")          return true;
if (filter === "calls")        return m.type === "call";      // voicemail already gone
if (filter === "emails")       return !m.type || m.type === "email";
if (filter === "unread")       return !m.isRead;
if (filter === "needs_action") return m.automationPaused || m.callStatus === "needs_review";
```

**Count fixes:**
- `callMessages` now: `messages.filter(m => m.type === "call" && !isSystemOutcome(m))` — only meaningful calls
- `unread` already excluded system outcomes (from v2.40) — confirmed correct
- Footer `"of N"` now uses `emailMessages.length + callMessages.length` (meaningful items only, not raw `messages.length`)
- Footer label: "N email replies · M AI calls" (only shows AI calls if M > 0)

**TopBar subtitle:** Shows `"N unread"` when unread > 0, otherwise `"Customer replies and call transcripts"`. No longer shows inflated numbers.

**Where voicemail/no-answer outcomes appear instead:**
Voicemail and no-answer outcomes already surface in the **Actions** page. `ScheduledActionCard` shows the lookup result (including "Voicemail Left" or "No answer") as an expandable detail row after an AI call action is run. They are system outcomes of CollectPilot's activity — correctly placed in Actions, not Inbox.

---

## v2.41.0 — Progressive Disclosure Complete (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.41.0

### Changed

**Dashboard — Charts grid and System Activity in CollapsibleSection (`app/dashboard/page.tsx` or `components/dashboard/`):**
- Aging breakdown chart and collections trend chart grid are now wrapped in a `<CollapsibleSection>` accordion (`defaultOpen={false}`). Dashboard loads showing only Needs Attention cards and KPI summary cards; charts are one click away.
- Recent System Activity feed is also wrapped in a `<CollapsibleSection>` (`defaultOpen={false}`). Operational log is secondary to actionable items.
- Dashboard default view now surfaces only what demands attention: Needs Attention section + KPI cards.

**Templates — AI prompt collapsed under accordion in non-edit view (`components/templates/`):**
- In the read-only (non-edit) template card view, the AI prompt text is hidden behind a "View AI prompt" accordion toggle (`defaultOpen={false}`).
- Users see the template name, type, outcome classifications and voicemail/escalation settings without having to scroll past a long prompt.
- In edit mode the full prompt textarea remains fully visible and editable as before.

**Contact ExclusionControls — Summary+Edit by default, radio controls in edit mode only (`components/contacts/`):**
- `ExclusionControls` now mirrors the `InvoiceDetailActions` pattern introduced in v2.39.0.
- Default (non-edit) state: shows a plain-text summary of the current exclusion status (e.g. "Automations active" or "Excluded — Manual override") and an Edit button.
- Edit mode: clicking Edit reveals the full radio control group and Save / Cancel buttons.
- Reduces visual noise on the Contact detail page for contacts where no change is needed.

---

## v2.40.0 — Complete Progressive Disclosure (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.40.0

### Changed

**Inbox — Voicemail / no-answer removed from "All" view (`app/inbox/page.tsx`):**
- `callStatus === "no_answer"` and `callStatus === "voicemail"` messages are now classified as `isSystemOutcome`. These are automation-run results, not customer replies.
- The `filter === "all"` condition now filters them out: `return !isSystemOutcome(m)`.
- The `unread` count is updated to exclude system outcomes: `messages.filter(m => !m.isRead && !isSystemOutcome(m))`.
- System outcome calls (voicemail, no-answer) are still accessible via the "AI Calls" filter tab.
- Inbox "All" now correctly shows: email replies, completed calls with outcomes, needs-review calls.

**Invoice Detail — Line Items accordion (`app/invoices/[id]/page.tsx`):**
- Line Items section is now wrapped in `<CollapsibleSection title="Line Items" badge={count} defaultOpen={false}>`. Collapsed by default — business owners don't need to read line items to take action.
- Opening the accordion shows the full line item table as before.

**Invoice Detail — Activity Timeline accordion (`app/invoices/[id]/page.tsx`):**
- Activity Timeline is now wrapped in `<CollapsibleSection title="Activity Timeline" badge={count} defaultOpen={false}>`. Collapsed by default — detailed system history is secondary information.
- The count badge on the section header shows how many events are in the timeline without requiring expansion.

**New `CollapsibleSection` component (`components/invoices/CollapsibleSection.tsx`):**
- Generic `"use client"` accordion component accepting `title`, `children`, `defaultOpen`, and optional `badge` props.
- Full-width click target on the header row. ChevronDown rotates 180° when open.
- Used for Line Items and Activity Timeline on the invoice detail page.

**Previous changes retained from v2.39.0:**
- AI Overview at top of every Inbox message detail
- Email/call content in collapsible accordion (collapsed by default)
- Improved AI Caller / Customer transcript speaker layout
- Invoice Detail Automation section summary-by-default with Edit mode

---

## v2.39.0 — Progressive Disclosure: Inbox Detail & Invoice Automation (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.39.0

### Changed

**Inbox — AI Overview at top of message detail (`app/inbox/page.tsx`):**
- Every message/call detail view now opens with an **AI Overview** section (2–4 bullet points) generated from the classification and call status. Answers: what happened, what it means, what to do next.
- Generated summaries per classification: Promise to Pay, Dispute, Out of Office, Payment Query, Unclassified; per call status: Completed, Voicemail, No Answer, Needs Review.
- Blue card style (`bg-blue-50 border-blue-100`) so it reads as a summary/guidance item, distinct from action alerts.
- Voicemail and No Answer overviews clearly communicate these are system-outcome notes, not customer replies.

**Inbox — Content accordion (`app/inbox/page.tsx`):**
- Email body and call transcripts are now in a collapsible accordion, **collapsed by default**.
- Button labels: "View email content" / "View call transcript" / "View voicemail details".
- User sees the AI Overview first; raw content is only one tap/click away.
- Accordion uses `ChevronDown` with `rotate-180` for open state.
- `showContent` state resets to `false` when a new message is opened (each `MessageDetail` is remounted on message selection).

**Inbox — Improved call transcript speaker layout (`app/inbox/page.tsx`):**
- `TranscriptView` speaker blocks redesigned: each turn has a distinct section with a `text-[10px] font-bold uppercase tracking-widest` speaker label and the text indented with a `border-l-2` color accent (`border-green-200` for AI Caller, `border-blue-200` for Customer).
- Label changed from "AI" to "AI Caller" for clarity.
- Removed the `w-20` side label — labels now appear above each block.

**Invoice detail — Automation section simplified (`components/invoices/InvoiceDetailActions.tsx`):**
- Default view: shows the assigned automation name + "Excluded" note if applicable, with a small **Edit** button (pencil icon).
- Edit mode: clicking Edit reveals the full Assign Automation dropdown, Exclude toggle, Save/Cancel.
- Cancel (X) button in edit mode returns to summary view.
- Reduces visible controls: business owners see the current state, not an admin form.
- Component renamed internal state: `editMode` replaces old always-visible form pattern.

**Invoice detail — Language cleanup (`app/invoices/[id]/page.tsx`):**
- "Flow" label → "Automation" in Status Overview chip.
- `autoStatus` label "No Flow" → "No Automation".
- "No flow assigned" → "No automation assigned".
- Pending actions link: "Manage in Scheduled Actions" → "View in Actions →".
- Label "Awaiting Approval" → "Needs Approval" (in autoStatus config via sed).

---

## v2.38.0 — Simplify Inbox Filter Controls (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.38.0

### Changed

**Inbox filter UI (`app/inbox/page.tsx`):**

- **Removed:** 7 visible filter tab buttons (All / Unread / Email Replies / AI Calls / Disputes / Promises / Needs Action).
- **Added:** Single `FilterDropdown` component — a compact button that opens a dropdown list of filter options.
- **Combined:** Search input and Filter button are now in one single row instead of two separate rows. Saves vertical space in the inbox list panel.
- **Active state:** When a filter is active, the Filter button shows the filter name (e.g. `Disputes`) and uses a blue border/background. When no filter is active, the button shows `Filter` in a neutral style.
- **Unread count:** The Unread count badge appears inside the `Unread` option in the dropdown.
- **Clear filter:** A `Clear filter` option appears at the top of the dropdown when a filter is active.
- **Dropdown close behavior:** Closes on outside click via `mousedown` listener. Clicking any option selects it and closes the dropdown.
- **Filter change clears detail panel:** Changing the filter calls `handleFilterChange()` which also resets `selectedMessage` and `mobileView` to `"list"`, preventing the detail panel from showing a message that no longer appears in the filtered list.
- **Filtering logic unchanged:** All 7 filter conditions (all, unread, emails, calls, dispute, promise_to_pay, needs_action) work identically. Search still combines with the active filter.

**Actions/Scheduled Actions:** Evaluated — left unchanged. The 6 filter tabs on the Actions page (All, Upcoming, Needs Approval, Sent, Blocked, Skipped) serve as primary navigation between distinct action states and are more useful as visible tabs than a dropdown.

---

## v2.37.0 — Expandable Needs Attention Cards (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.37.0

### Changed

**Dashboard Needs Attention section — expandable accordion:**

The static grid of "click-to-navigate" attention cards has been replaced with an accordion of expandable cards. Each card:
- **Collapsed (default):** icon + count + label + plain-English description + `ChevronDown` indicator. Compact, easy to scan.
- **Expanded (on click):** shows up to 3 related items with direct links; a "View all N →" link appears if there are more than 3 items.
- **Accordion behavior:** only one card can be open at a time, keeping the section concise.

**Item detail format per category:**

| Category | Expanded item shows |
|----------|-------------------|
| Disputes | Invoice# · Contact · Amount · Days overdue → "Review dispute" link to `/invoices/[id]` |
| Blocked actions | Action type · Invoice# · Contact · Safety check reason → `/scheduled` |
| Overdue 60+/30-60 | Invoice# · Contact · Amount · Days overdue → "View invoice" link to `/invoices/[id]` |
| Needs approval | Action type · Invoice# · Contact → `/scheduled` |
| Automations paused | Contact · Invoice# · Subject → `/inbox` |
| Unread replies | Contact · Invoice# · Subject → `/inbox` |
| Promises to pay | Contact · Invoice# · Subject → `/inbox` |

**Architecture:**
- `lib/server-data.ts` — new `getAttentionDetails()` function and exported types (`AttentionInvItem`, `AttentionActionItem`, `AttentionMsgItem`, `AttentionDetails`). Returns flat serializable item lists with contact/invoice details joined.
- `components/dashboard/NeedsAttentionSection.tsx` — new `"use client"` component. Manages accordion state (`openKey: CardKey | null`), renders `AttentionCard` components, and item-row renderers (`InvItemRow`, `ActionItemRow`, `MsgItemRow`).
- `app/dashboard/page.tsx` — removed the old `AttentionCard` server component and grid. Now calls `getAttentionDetails()` and passes the result to `<NeedsAttentionSection details={attentionDetails} />`.

**Mobile behavior:** Single-column accordion (same on mobile and desktop). Cards are full-width, easy to tap. Expanded items stack cleanly with generous tap targets. No horizontal overflow.

**Recent Activity section:** No changes — it already shows a compact feed of 8 items. Left as-is.

---

## v2.36.0 — Fix Mobile Contact Detail Layout (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.36.0

### Fixed

**Contact detail page (`app/contacts/[id]/page.tsx`) — responsive mobile layout:**

| Issue | Fix |
|-------|-----|
| Hardcoded `grid grid-cols-3` — no mobile breakpoint | Changed to `grid grid-cols-1 md:grid-cols-3`; single-column stack on mobile |
| `grid grid-cols-2` for email+phone — too narrow | Changed to `flex flex-col sm:flex-row sm:flex-wrap gap-2`; stacks vertically on mobile |
| Total Owed value overflows on mobile | `text-xs sm:text-base` + `break-all` on the amount; no more overflow |
| Stat card padding/font too large on mobile | `p-2.5 sm:p-3`, `text-xl sm:text-2xl` on counts, responsive font on Total Owed |
| Automation Status squashed in narrow right column on mobile | Rendered twice: inline `md:hidden` version shows between stats and invoices on mobile; `hidden md:block` version shows in sidebar on desktop. Only one instance visible at a time — independent state acceptable for prototype. |
| Invoice table squashed on mobile | Added `sm:hidden` mobile card list alongside `hidden sm:block` desktop table. Mobile cards show: invoice number + amount (top row), due date + days overdue, status badge + "View invoice →" link. |
| No mobile description on TopBar | Added `description="Review contact details, automation status, and related invoices."` |

**Mobile layout order (< md breakpoint):**
1. Contact summary card (name, company, email, phone, tags, notes)
2. Key stats: Invoices · Overdue · Total Owed
3. Automation Status (ExclusionControls — inline, `md:hidden`)
4. Related invoices (mobile cards)

**Desktop layout (md+ breakpoint):**
- Left 2/3: Contact summary + Stats + Invoices table
- Right 1/3: Automation Status / ExclusionControls (sidebar)

**Contact list page and Add Contact form:** Both were already mobile-friendly from earlier versions (v2.18.0 mobile cards, v2.30.0 bottom-sheet modal). No changes needed.

---

## v2.35.0 — Fix Sidebar Navigation (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.35.0

### Fixed

**`NavItem` converted from `<button>` + `router.push()` to Next.js `<Link>` (`components/layout/NavItem.tsx`):**

The root cause of the navigation regression was that `NavItem` used `<button onClick={handleClick}>` where `handleClick` called `router.push(href)`. In Next.js 15 App Router, `router.push()` called from an event handler can fail silently in certain component states (e.g. during transitions, when the router is in a loading state, or under specific rendering conditions introduced by the recent layout changes).

The fix converts `NavItem` to use the standard Next.js `<Link>` component as the navigation primitive. The nav guard logic (unsaved-changes confirmation for the flow builder and call-templates editor) is preserved via `e.preventDefault()` in the `onClick` handler. `closeMobileMenu()` is still called on every successful navigation.

Changes to `handleClick`:
- `if (isActive)` → calls `e.preventDefault()` + `closeMobileMenu()` (was `closeMobileMenu(); return`)
- `if (isDirty && !confirm)` → calls `e.preventDefault()` (was `return`)
- Otherwise → calls `closeMobileMenu()` and lets `<Link>` handle navigation (was `closeMobileMenu(); router.push(href)`)

Benefits of `<Link>` over `button+router.push`:
- Right-click → Open in new tab / Open in new window works
- Keyboard navigation (Tab + Enter) works
- Correct `href` attribute for accessibility and browser history
- Native prefetching behaviour
- No dependency on `router` being in a non-loading state

**Sidebar z-index hardening (`components/layout/Sidebar.tsx`, `components/layout/AppShell.tsx`):**
- `<aside>` gains `relative z-10` to establish a stacking context above page-level content
- Desktop sidebar wrapper `<div className="hidden md:flex">` gains `z-20` so the sidebar is always rendered above any absolute/fixed overlays from page content (e.g. the Inbox two-panel layout's `overflow-hidden` containers or TopBar dropdowns)

---

## v2.34.0 — Simplify Automations Page (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.34.0

### Changed

**Automations flow cards (`app/automations/page.tsx`):**

- **Removed step chip chains.** The desktop chip-by-chip step breakdown (`Lookup → Email → Wait 3d → SMS → ...`) has been removed from the default card view. It was visually noisy and added technical detail that belongs in the builder, not the list view.
- **Replaced with a plain-English channel summary.** Each card now shows a `Sends via: Email · SMS · AI Call` line (deduplicated, computed from actual step types) plus `✓ Safety check before every send` when lookup steps are present.
- **Simplified metrics row.** Now shows just `Starts: N days overdue` and `N steps` — removed the "Lookups: N" count.
- **Mobile text summary also removed.** The mobile-only `Lookup → Email → Wait Nd` text string has been replaced with the same channel summary as desktop.

**Language cleanup:**

| Before | After |
|--------|-------|
| Edit Flow | Edit Automation |
| New Flow | New Automation |
| All Flows | All Automations |
| Flow name | Automation name |
| Create Flow | Create Automation |
| Untitled Flow | Untitled Automation |
| N flows configured (subtitle) | N automations configured |
| Fresh lookup required before sending (banner) | Safety check required before sending |

**Context note:** Most other simplification items from this batch were already implemented in earlier versions: sidebar structure (v2.28.0), Dashboard Needs Attention (v2.25.0), Inbox two-panel layout (v2.29.0), Actions page title and tabs (v2.28.0), plain-English invoice status (v2.25.0), clickable cards (v2.32.0-v2.33.0). This release addresses the remaining visual complexity on the Automations page.

---

## v2.33.0 — Refined Clickable Card Interactions (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.33.0

### Changed

**Actions (`components/scheduled/ScheduledActionCard.tsx`) — safe detail expand:**
- Added `expanded` state. Cards that have historical details (lookup result or skip reason) now show a chevron toggle in the header.
- Clicking the card body (or the chevron) expands/collapses the historical details section.
- `Run Lookup & Fire`, `Approve & Run Lookup`, and `Skip` buttons have `e.stopPropagation()` so clicking them never triggers the card-level expand.
- Invoice and Contact links inside the card also have `e.stopPropagation()` to prevent accidental expand when clicking through.
- Live fire result (appears after clicking Run) remains always visible — it is not hidden behind the expand toggle.
- Removed `hover:shadow-md transition-shadow` that implied false interactivity on static cards; replaced with `hover:bg-gray-50/40` only when `hasDetails` is true.
- Updated "Lookup at" label to "Safety check at" for plain-English consistency.

**Templates (`app/call-templates/page.tsx`) — clickable header to expand:**
- The template card header info area (icon + template name + badge + category + outcome count) now has `cursor-pointer` and an `onClick` that calls `handleCollapseClick` — the same expand/collapse handler used by the chevron button.
- Edit, Chevron, and Delete buttons all have `e.stopPropagation()` so they function independently without also triggering the header expand.
- Unsaved-changes collapse confirmation dialog, save/discard flow, and all edit functionality remain unchanged.

### Interaction model clarified across the app

| Page | Click behavior |
|------|---------------|
| Invoices | Row/card → navigate to invoice detail |
| Contacts | Row/card → navigate to contact detail |
| Inbox | Row → open message detail panel |
| Notifications | Row → navigate to related item |
| Automations | Card → open flow builder |
| Templates | Card header → expand/collapse template |
| Actions | Card body → expand/collapse historical details only; buttons perform operations |

---

## v2.32.0 — Clickable List Cards (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.32.0

### Changed

**Automations page (`app/automations/page.tsx`):**
- Each automation flow card now navigates to the flow builder on click (`onClick → router.push`).
- Added `cursor-pointer hover:border-blue-200 hover:shadow-md transition-all` to card container.
- Both Edit Flow link buttons (desktop header + mobile full-width) have `onClick={(e) => e.stopPropagation()}` to prevent double-navigation when clicking the button directly.

**Invoices page (`app/invoices/page.tsx`):**
- Desktop table rows (`<tr>`) now have `cursor-pointer` + `onClick → router.push('/invoices/${id}')`.
- Mobile invoice cards have the same `cursor-pointer hover:bg-gray-50/60` + `onClick → router.push`.
- "View →" and "View invoice →" links have `e.stopPropagation()` to prevent bubbling.
- Added `useRouter` import.

**Contacts page (`app/contacts/page.tsx`):**
- Desktop table rows (`<tr>`) now have `cursor-pointer` + `onClick → router.push('/contacts/${id}')`.
- Mobile contact cards have `cursor-pointer hover:bg-gray-50/60` + `onClick → router.push`.
- "View →" and "View contact →" links have `e.stopPropagation()`.
- Added `useRouter` import.

**Already clickable (no changes needed):**
- **Inbox** rows: already had `onClick` handling for the detail panel.
- **Notifications** rows: already used `<Link href={notif.href}>` wrappers.
- **Actions (Scheduled)**: no detail navigation target — action buttons (Run, Skip, Approve) are the intended interaction; left unchanged.
- **Call Templates**: in-place expand/edit interaction — no page-level navigation; left unchanged.

---

## v2.31.0 — Page Descriptions (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.31.0

### Added

Added description prop to TopBar component. Each main page now shows a short plain-English helper sentence below its title bar: Dashboard, Invoices, Inbox, Notifications, Actions, Automations, Templates, Contacts, Settings, Preferences, Onboarding, Invoice Detail. Description bar is subtle (text-xs text-gray-400) rendered in a slim bar between the header and page content. Existing subtitles preserved.

---

## v2.30.0 — Add Contact Flow (29 May 2026)

**Date:** 29 May 2026
**package.json version:** 2.30.0

### Added

**"Add Contact" button:**
- Blue `Add Contact` button added to the Contacts page TopBar (icon-only label "Add" on mobile).
- Clicking it opens an `AddContactModal` overlay.

**Add Contact modal:**
- **Desktop:** centered card overlay (`sm:max-w-lg`), Escape key closes, backdrop click closes.
- **Mobile:** bottom-sheet style (`rounded-t-2xl`, `items-end`), scrollable form area (`max-h-[90vh]`).
- **Fields:** Contact name (required), Company (required), Email (optional, validated), Phone (optional), Status (Active / Excluded / On Hold), Notes (optional textarea).
- **Validation:** Name and Company required; email format checked if non-empty. Errors appear inline below the relevant field. Fields with errors show a red border.
- **Auto-focus:** Name field is focused when the modal opens.

**Contact persistence:**
- Submitting the form POSTs to `POST /api/contacts`, which adds the contact to the in-memory `db.contacts` store.
- The new contact appears at the top of the contacts list immediately (optimistic prepend to local state).
- Persists across page refreshes within the same server session (in-memory store survives refreshes; resets only on server restart or Vercel cold start).
- New contacts are searchable and sortable immediately.
- Status badge, exclusion styling, and all existing table behaviors apply to new contacts.

**`POST /api/contacts` route (`app/api/contacts/route.ts`):**
- New handler generates a unique ID (`contact-${Date.now()}-random`).
- Validates and sanitizes all fields server-side.
- Defaults `status` to `"active"` if unrecognised value provided.
- Returns the new contact object with HTTP 201.

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

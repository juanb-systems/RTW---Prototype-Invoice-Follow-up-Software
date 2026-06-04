"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatCurrencyWhole, formatDate, agingColor } from "@/lib/utils";
import { useSearchStore } from "@/lib/search-store";
import {
  Search, X, SlidersHorizontal, ChevronDown, Check,
  AlertTriangle, Mail, MessageSquare, Phone,
} from "lucide-react";
import type { CustomerAccount } from "@/lib/server-data";

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = "oldest" | "balance" | "name" | "invoices" | "response";

const SORT_OPTIONS: { value: SortKey; label: string; short: string }[] = [
  { value: "oldest",   label: "Most overdue first",    short: "Oldest" },
  { value: "balance",  label: "Highest balance first", short: "Balance" },
  { value: "invoices", label: "Most invoices first",   short: "Count" },
  { value: "name",     label: "A → Z",                 short: "A–Z" },
  { value: "response", label: "By response status",    short: "Status" },
];

const REPLY_SORT_PRIORITY: Record<string, number> = {
  dispute: 0, promise_to_pay: 1, out_of_office: 2, payment_query: 3, unclassified: 4,
};

function sortAccounts(accounts: CustomerAccount[], key: SortKey): CustomerAccount[] {
  return [...accounts].sort((a, b) => {
    switch (key) {
      case "oldest":
        return b.maxDaysPastDue - a.maxDaysPastDue || b.totalOverdueBalance - a.totalOverdueBalance;
      case "balance":
        return b.totalOverdueBalance - a.totalOverdueBalance;
      case "invoices":
        return b.overdueCount - a.overdueCount || b.totalOverdueBalance - a.totalOverdueBalance;
      case "name":
        return a.name.localeCompare(b.name) || a.company.localeCompare(b.company);
      case "response": {
        const pa = REPLY_SORT_PRIORITY[a.latestMessageClassification ?? ""] ?? 5;
        const pb = REPLY_SORT_PRIORITY[b.latestMessageClassification ?? ""] ?? 5;
        return pa - pb || b.maxDaysPastDue - a.maxDaysPastDue;
      }
      default: return 0;
    }
  });
}

// ── Filter ────────────────────────────────────────────────────────────────────

type FilterValue = "all" | "overdue" | "disputed" | "promise_to_pay" | "no_automation" | "paused";

const FILTER_OPTIONS: { value: FilterValue; label: string; short: string }[] = [
  { value: "all",            label: "All accounts",      short: "All" },
  { value: "overdue",        label: "Overdue",           short: "Overdue" },
  { value: "disputed",       label: "Disputed",          short: "Disputed" },
  { value: "promise_to_pay", label: "Promise to Pay",    short: "Promises" },
  { value: "no_automation",  label: "No automation",     short: "No Flow" },
  { value: "paused",         label: "Automation paused", short: "Paused" },
];

// ── Reply display config ──────────────────────────────────────────────────────

const REPLY_LABEL: Record<string, string> = {
  promise_to_pay: "Promise to Pay",
  dispute:        "Dispute",
  out_of_office:  "Out of Office",
  payment_query:  "Payment Query",
  unclassified:   "Reply received",
};
const REPLY_COLOR: Record<string, string> = {
  promise_to_pay: "bg-green-100 text-green-800",
  dispute:        "bg-red-100 text-red-800",
  out_of_office:  "bg-amber-100 text-amber-800",
  payment_query:  "bg-blue-100 text-blue-800",
  unclassified:   "bg-gray-100 text-gray-600",
};

const STEP_LABEL: Record<string, string> = {
  email: "Email",
  sms:   "SMS",
  call:  "AI Call",
};

// ── Shared dropdown hook ──────────────────────────────────────────────────────

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return { open, setOpen, ref };
}

// ── Filter dropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  filter, onFilter, compact = false,
}: {
  filter: FilterValue; onFilter: (v: FilterValue) => void; compact?: boolean;
}) {
  const { open, setOpen, ref } = useDropdown();
  const active = FILTER_OPTIONS.find(o => o.value === filter) ?? FILTER_OPTIONS[0];
  const isActive = filter !== "all";

  return (
    <div ref={ref} className={`relative ${compact ? "flex-1" : "flex-shrink-0"}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex w-full items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs font-medium transition-colors ${
          isActive
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">{compact ? active.short : active.label}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onFilter(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                filter === opt.value ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{opt.label}</span>
              {filter === opt.value && <Check className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sort dropdown ─────────────────────────────────────────────────────────────

function SortDropdown({
  sort, onSort, compact = false,
}: {
  sort: SortKey; onSort: (v: SortKey) => void; compact?: boolean;
}) {
  const { open, setOpen, ref } = useDropdown();
  const active = SORT_OPTIONS.find(o => o.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div ref={ref} className={`relative ${compact ? "flex-1" : "flex-shrink-0"}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-400 hidden sm:inline">Sort:</span>
        <span className="flex-1 text-left">{compact ? active.short : active.label}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSort(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                sort === opt.value ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{opt.label}</span>
              {sort === opt.value && <Check className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CustomerCard ──────────────────────────────────────────────────────────────

function CustomerCard({ account }: { account: CustomerAccount }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const isDisputed    = account.disputedCount > 0;
  const hasReply      = !!account.latestMessageClassification;
  const replyLabel    = hasReply ? (REPLY_LABEL[account.latestMessageClassification!] ?? "Reply received") : null;
  const replyColor    = hasReply ? (REPLY_COLOR[account.latestMessageClassification!] ?? "bg-gray-100 text-gray-600") : null;
  const stepLabel     = account.nextStepType ? (STEP_LABEL[account.nextStepType] ?? account.nextStepType) : null;
  const StepIcon      = account.nextStepType === "email" ? Mail
    : account.nextStepType === "sms" ? MessageSquare
    : account.nextStepType === "call" ? Phone : null;

  const toggleProps = {
    role: "button" as const,
    tabIndex: 0,
    "aria-expanded": expanded,
    onClick: () => setExpanded(p => !p),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(p => !p); }
    },
  };

  // ── Response badge (reused in both layouts) ──────────────────────────────
  const responseBadge = hasReply && replyLabel && replyColor ? (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-none ${replyColor}`}>
      {replyLabel}
    </span>
  ) : isDisputed ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 leading-none">
      <AlertTriangle className="h-3 w-3" />Dispute
    </span>
  ) : account.automationPaused ? (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 leading-none">
      Paused
    </span>
  ) : null;

  return (
    <div className="border-b border-gray-100 last:border-0">

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP ROW (sm+)
          Five columns that align with the column headers above.
      ════════════════════════════════════════════════════════════════════ */}
      <div
        {...toggleProps}
        className="hidden sm:flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300"
      >
        {/* Customer — flex-1 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{account.name}</p>
          {account.company && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{account.company}</p>
          )}
        </div>
        {/* Overdue Total — w-32 right-aligned */}
        <div className="w-32 text-right flex-shrink-0">
          {account.overdueCount > 0 ? (
            <p className={`text-sm font-bold tabular-nums ${agingColor(account.maxDaysPastDue)}`}>
              {formatCurrency(account.totalOverdueBalance)}
            </p>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>
        {/* Invoices — w-16 center */}
        <div className="w-16 text-center flex-shrink-0">
          {account.overdueCount > 0 ? (
            <span className="text-sm font-semibold text-gray-700">{account.overdueCount}</span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>
        {/* Oldest — w-20 center */}
        <div className="w-20 text-center flex-shrink-0">
          {account.maxDaysPastDue > 0 ? (
            <span className={`text-sm font-semibold ${agingColor(account.maxDaysPastDue)}`}>
              {account.maxDaysPastDue}d
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>
        {/* Response — w-36 center */}
        <div className="w-36 flex justify-center flex-shrink-0">
          {responseBadge ?? <span className="text-xs text-gray-300">—</span>}
        </div>
        {/* Chevron — w-5 */}
        <div className="w-5 flex justify-end flex-shrink-0">
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Desktop expanded */}
      {expanded && (
        <div className="hidden sm:block border-t border-gray-100 bg-gray-50/40 px-5 pt-4 pb-5 space-y-4">

          {/* Reminder logic */}
          {account.mostOverdueInvoice && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2.5">
                Reminder Logic
              </p>
              <div className="grid grid-cols-[96px_1fr] gap-y-1.5 text-xs">
                <span className="text-blue-400 font-medium">Triggered by</span>
                <span className="flex items-baseline gap-2 text-blue-900">
                  <span className="font-mono font-semibold">{account.mostOverdueInvoice.invoiceNumber}</span>
                  <span className={`font-bold ${agingColor(account.maxDaysPastDue)}`}>{account.maxDaysPastDue} days overdue</span>
                </span>
                <span className="text-blue-400 font-medium">Includes</span>
                <span className="text-blue-900">
                  {account.overdueCount} invoice{account.overdueCount !== 1 ? "s" : ""}
                  {" · "}
                  <span className="font-semibold">{formatCurrency(account.totalOverdueBalance)}</span> total
                </span>
                {account.mostOverdueInvoice.assignedFlowName && (
                  <>
                    <span className="text-blue-400 font-medium">Flow</span>
                    <span className="text-blue-900">{account.mostOverdueInvoice.assignedFlowName}</span>
                  </>
                )}
                <span className="text-blue-400 font-medium">Next action</span>
                {stepLabel && StepIcon ? (
                  <span className="flex items-center gap-1.5 text-blue-900">
                    <StepIcon className="h-3 w-3 text-blue-400" />
                    <span className="font-medium">{stepLabel} reminder</span>
                    {account.nextScheduledAt && (
                      <span className="text-blue-500">· {formatDate(account.nextScheduledAt)}</span>
                    )}
                    {account.nextActionStatus === "awaiting_approval" && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                        Needs approval
                      </span>
                    )}
                    <Link href="/scheduled" className="ml-1 text-blue-600 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                      View →
                    </Link>
                  </span>
                ) : (
                  <span className="text-blue-400 italic">
                    {!account.mostOverdueInvoice.assignedFlowId ? "No automation assigned" : "No actions scheduled"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Overdue invoice list */}
          {account.overdueInvoices.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Overdue invoices ({account.overdueInvoices.length})
              </p>
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {account.overdueInvoices.map((inv, idx) => (
                  <div
                    key={inv.id}
                    className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-blue-50/40 transition-colors ${idx > 0 ? "border-t border-gray-100" : ""}`}
                    onClick={(e) => { e.stopPropagation(); router.push(`/invoices/${inv.id}`); }}
                  >
                    <span className="font-mono text-xs font-semibold text-gray-700 w-28 flex-shrink-0">{inv.invoiceNumber}</span>
                    <span className="text-sm font-bold text-gray-900 w-24 text-right flex-shrink-0 tabular-nums">{formatCurrency(inv.amount)}</span>
                    <span className={`text-xs font-semibold w-20 flex-shrink-0 ${agingColor(inv.daysPastDue)}`}>{inv.daysPastDue}d overdue</span>
                    <span className="text-xs text-gray-400 flex-1 truncate">Due {formatDate(inv.dueDate)}</span>
                    <InvoiceStatusBadge status={inv.status as never} />
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-xs font-medium text-blue-600 hover:underline flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions — grouped buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasReply && replyLabel && replyColor && account.latestMessageId && (
              <Link
                href={`/inbox?message=${account.latestMessageId}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View reply
              </Link>
            )}
            <Link
              href={`/contacts/${account.contactId}`}
              className="inline-flex items-center rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Open account
            </Link>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE CARD (< sm)
          Clean stacked card — no columns, just clear hierarchy.
          Tap the whole card to expand/collapse.
      ════════════════════════════════════════════════════════════════════ */}
      <div
        {...toggleProps}
        className="sm:hidden px-4 py-4 cursor-pointer select-none active:bg-gray-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300"
      >
        {/* Row 1: name + chevron */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-900 leading-snug">{account.name}</p>
            {account.company && (
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{account.company}</p>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 mt-0.5 ${expanded ? "rotate-180" : ""}`}
          />
        </div>

        {/* Row 2: response badge — own line, below company */}
        {responseBadge && <div className="mt-1.5">{responseBadge}</div>}

        {/* Row 3: overdue amount — moderate size, no cents */}
        {account.overdueCount > 0 ? (
          <div className="mt-2.5">
            <p className={`text-xl font-semibold leading-none tabular-nums ${agingColor(account.maxDaysPastDue)}`}>
              {formatCurrencyWhole(account.totalOverdueBalance)}{" "}
              <span className="text-base font-medium">overdue</span>
            </p>
            {/* Row 4: invoice count + oldest age */}
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              {account.overdueCount} invoice{account.overdueCount !== 1 ? "s" : ""}
              {account.maxDaysPastDue > 0 && ` · oldest ${account.maxDaysPastDue} days`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-2">No overdue invoices</p>
        )}
      </div>

      {/* Mobile expanded: stacked invoice cards */}
      {expanded && (
        <div className="sm:hidden border-t border-gray-100 bg-gray-50/40 px-4 pt-3 pb-4 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Overdue invoices
          </p>
          {account.overdueInvoices.map(inv => (
            <div
              key={inv.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 cursor-pointer active:bg-blue-50/40 transition-colors"
              onClick={(e) => { e.stopPropagation(); router.push(`/invoices/${inv.id}`); }}
            >
              {/* Invoice # */}
              <p className="font-mono text-xs font-semibold text-gray-600">{inv.invoiceNumber}</p>
              {/* Amount + days overdue */}
              <div className="flex items-baseline justify-between mt-1.5">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(inv.amount)}</p>
                <p className={`text-xs font-semibold ${agingColor(inv.daysPastDue)}`}>{inv.daysPastDue}d overdue</p>
              </div>
              {/* Due date + status badge on separate line — no overlap */}
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-400">Due {formatDate(inv.dueDate)}</p>
                <InvoiceStatusBadge status={inv.status as never} />
              </div>
            </div>
          ))}
          {/* Actions — grouped buttons, flex-1 so they share row evenly */}
          <div className="flex gap-2 pt-2">
            {hasReply && replyLabel && replyColor && account.latestMessageId && (
              <Link
                href={`/inbox?message=${account.latestMessageId}`}
                className="flex-1 flex items-center justify-center rounded-full border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 active:bg-gray-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View reply
              </Link>
            )}
            <Link
              href={`/contacts/${account.contactId}`}
              className="flex-1 flex items-center justify-center rounded-full bg-blue-600 px-3 py-2 text-xs font-medium text-white active:bg-blue-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Open account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Desktop column headers ────────────────────────────────────────────────────

function DesktopHeaders() {
  return (
    <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50/60">
      <span className="flex-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Customer</span>
      <span className="w-32 text-right flex-shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Overdue</span>
      <span className="w-16 text-center flex-shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Invoices</span>
      <span className="w-20 text-center flex-shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Oldest</span>
      <span className="w-36 text-center flex-shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Response</span>
      <span className="w-5 flex-shrink-0" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ReceivablesPageContent() {
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sort, setSort]         = useState<SortKey>("oldest");
  const [filter, setFilter]     = useState<FilterValue>(
    () => (searchParams.get("filter") ?? searchParams.get("status") ?? "all") as FilterValue
  );

  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/customer-accounts", { cache: "no-store" })
      .then(r => r.json())
      .then(data => { setAccounts(data); setLoading(false); });
  }, []);

  // Filter → Search → Sort
  const afterFilter = accounts.filter(a => {
    switch (filter) {
      case "overdue":        return a.overdueCount > 0;
      case "disputed":       return a.disputedCount > 0;
      case "promise_to_pay": return a.latestMessageClassification === "promise_to_pay";
      case "no_automation":  return !a.mostOverdueInvoice?.assignedFlowId;
      case "paused":         return a.automationPaused;
      default:               return true;
    }
  });

  const afterSearch = afterFilter.filter(a => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      a.name.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.overdueInvoices.some(i => i.invoiceNumber.toLowerCase().includes(q)) ||
      (a.latestMessageClassification
        ? (REPLY_LABEL[a.latestMessageClassification] ?? "").toLowerCase().includes(q)
        : false)
    );
  });

  const sorted = sortAccounts(afterSearch, sort);
  const customersWithOverdue = accounts.filter(a => a.overdueCount > 0).length;

  return (
    <div>
      <TopBar
        title="Receivables"
        subtitle={`${customersWithOverdue} customers overdue · ${accounts.length} total`}
        description="Customers grouped by overdue balance. Reminders are based on the oldest unpaid invoice and include all overdue invoices."
      />
      <div className="p-3 sm:p-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* ── MOBILE TOOLBAR ── */}
          <div className="sm:hidden border-b border-gray-100 px-3 pt-3 pb-3 space-y-2">
            {/* Row 1: search (full width) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search customers…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 pl-9 pr-9 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => { clear(); searchRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Row 2: filter + sort (side-by-side, full width) */}
            <div className="flex gap-2">
              <FilterDropdown filter={filter} onFilter={setFilter} compact />
              <SortDropdown sort={sort} onSort={setSort} compact />
            </div>
            {/* Row 3: count + reset */}
            {!loading && (
              <p className="text-xs text-gray-400 leading-none">
                {sorted.length === accounts.length
                  ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""}`
                  : `${sorted.length} of ${accounts.length} accounts`}
                {filter !== "all" && (
                  <button onClick={() => setFilter("all")} className="ml-1.5 text-blue-500 font-medium hover:underline">
                    · Reset filter
                  </button>
                )}
              </p>
            )}
          </div>

          {/* ── DESKTOP TOOLBAR ── */}
          <div className="hidden sm:flex items-center gap-3 border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900 shrink-0">Receivables by Account</h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search customer, company, invoice #…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-gray-200 pl-8 pr-8 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
              />
              {query && (
                <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <FilterDropdown filter={filter} onFilter={setFilter} />
              <SortDropdown sort={sort} onSort={setSort} />
              {filter !== "all" && (
                <button onClick={() => setFilter("all")} className="text-xs text-blue-600 hover:underline font-medium">
                  Reset
                </button>
              )}
              <span className="text-xs text-gray-400 tabular-nums">
                {loading ? "Loading…" : `${sorted.length} / ${accounts.length}`}
              </span>
            </div>
          </div>

          {/* Desktop column headers */}
          {!loading && sorted.length > 0 && <DesktopHeaders />}

          {/* Rows */}
          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center px-4">
              <p className="text-sm text-gray-400">No accounts match the current filters.</p>
              {(query || filter !== "all") && (
                <div className="flex items-center justify-center gap-3 mt-2">
                  {query && <button onClick={clear} className="text-xs text-blue-500 hover:underline">Clear search</button>}
                  {filter !== "all" && <button onClick={() => setFilter("all")} className="text-xs text-blue-500 hover:underline">Reset filters</button>}
                </div>
              )}
            </div>
          ) : (
            sorted.map(account => <CustomerCard key={account.contactId} account={account} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReceivablesPage() {
  return (
    <Suspense>
      <ReceivablesPageContent />
    </Suspense>
  );
}

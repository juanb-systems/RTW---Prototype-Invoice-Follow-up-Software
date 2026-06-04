"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDate, agingColor } from "@/lib/utils";
import { useSearchStore } from "@/lib/search-store";
import {
  Search, X, SlidersHorizontal, ChevronDown, Check,
  Building2, AlertTriangle, Mail, MessageSquare, Phone,
} from "lucide-react";
import type { CustomerAccount } from "@/lib/server-data";

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = "oldest" | "balance" | "name" | "invoices" | "response";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "oldest",   label: "Most overdue first" },
  { value: "balance",  label: "Highest balance first" },
  { value: "invoices", label: "Most invoices first" },
  { value: "name",     label: "A → Z" },
  { value: "response", label: "By response status" },
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

// ── Reply labels/colours ──────────────────────────────────────────────────────

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
  email: "Email reminder",
  sms:   "SMS reminder",
  call:  "AI call",
};

// ── Filter ────────────────────────────────────────────────────────────────────

type FilterValue = "all" | "overdue" | "disputed" | "promise_to_pay" | "no_automation" | "paused";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all",            label: "All accounts" },
  { value: "overdue",        label: "Overdue" },
  { value: "disputed",       label: "Disputed" },
  { value: "promise_to_pay", label: "Promise to Pay" },
  { value: "no_automation",  label: "No automation" },
  { value: "paused",         label: "Automation paused" },
];

// ── Sort dropdown ─────────────────────────────────────────────────────────────

function SortDropdown({ sort, onSort }: { sort: SortKey; onSort: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const active = SORT_OPTIONS.find(o => o.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="hidden sm:inline text-gray-400">Sort:</span>
        <span>{active.label}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSort(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-colors ${
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

// ── Filter dropdown ───────────────────────────────────────────────────────────

function FilterDropdown({ filter, onFilter }: { filter: FilterValue; onFilter: (v: FilterValue) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const active = FILTER_OPTIONS.find(o => o.value === filter) ?? FILTER_OPTIONS[0];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          filter !== "all"
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{active.label}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onFilter(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-colors ${
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

// ── Customer account card ─────────────────────────────────────────────────────

function CustomerCard({ account }: { account: CustomerAccount }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const isDisputed = account.disputedCount > 0;
  const hasReply   = !!account.latestMessageClassification;
  const replyLabel = hasReply ? (REPLY_LABEL[account.latestMessageClassification!] ?? "Reply received") : null;
  const replyColor = hasReply ? (REPLY_COLOR[account.latestMessageClassification!] ?? "bg-gray-100 text-gray-600") : null;

  const stepLabel = account.nextStepType
    ? (STEP_LABEL[account.nextStepType] ?? account.nextStepType)
    : null;

  const StepIcon = account.nextStepType === "email" ? Mail
    : account.nextStepType === "sms" ? MessageSquare
    : account.nextStepType === "call" ? Phone
    : null;

  return (
    <div className={`border-b border-gray-100 last:border-0 ${isDisputed ? "border-l-2 border-l-red-400" : ""}`}>

      {/* ── Card header — click to expand/collapse ── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className="px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-50/60 active:bg-gray-100/60 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300"
        onClick={() => setExpanded(p => !p)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(p => !p); } }}
      >
        {/* Row 1: name · company · dispute badge · response badge · chevron */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-semibold text-gray-900">{account.name}</span>
              {account.company && (
                <span className="text-sm text-gray-400 flex items-center gap-1 flex-shrink-0">
                  <Building2 className="h-3 w-3" />{account.company}
                </span>
              )}
              {isDisputed && (
                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 flex-shrink-0">
                  <AlertTriangle className="h-2.5 w-2.5" />Dispute
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            {hasReply && replyLabel && replyColor && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-none ${replyColor}`}>
                {replyLabel}
              </span>
            )}
            {!hasReply && account.automationPaused && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 leading-none">
                Paused
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Row 2: overdue balance + invoice count + oldest */}
        {account.overdueCount > 0 ? (
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className={`text-lg font-bold ${agingColor(account.maxDaysPastDue)}`}>
              {formatCurrency(account.totalOverdueBalance)}
            </span>
            <span className="text-sm text-gray-500">
              overdue across {account.overdueCount} invoice{account.overdueCount !== 1 ? "s" : ""}
            </span>
            {account.mostOverdueInvoice && (
              <span className="text-sm text-gray-400">
                ·{" "}
                <span className="font-mono text-xs text-gray-600">{account.mostOverdueInvoice.invoiceNumber}</span>
                {" "}
                <span className={`font-semibold ${agingColor(account.maxDaysPastDue)}`}>
                  {account.maxDaysPastDue}d
                </span>
                {" "}oldest
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-400">No overdue invoices</p>
        )}
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-4 sm:px-6 pt-4 pb-5 space-y-4">

          {/* Reminder logic panel */}
          {account.mostOverdueInvoice && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">
                Reminder Logic
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-0">
                  <span className="text-xs text-blue-400 font-medium w-24 flex-shrink-0 pt-0.5">Triggered by</span>
                  <span className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-blue-900 text-xs">{account.mostOverdueInvoice.invoiceNumber}</span>
                    <span className={`text-xs font-bold ${agingColor(account.maxDaysPastDue)}`}>{account.maxDaysPastDue} days overdue</span>
                  </span>
                </div>
                <div className="flex items-start gap-0">
                  <span className="text-xs text-blue-400 font-medium w-24 flex-shrink-0 pt-0.5">Includes</span>
                  <span className="text-xs text-blue-900">
                    All {account.overdueCount} overdue invoice{account.overdueCount !== 1 ? "s" : ""}
                    {" · "}
                    <span className="font-semibold">{formatCurrency(account.totalOverdueBalance)}</span> total
                  </span>
                </div>
                {account.mostOverdueInvoice.assignedFlowName && (
                  <div className="flex items-start gap-0">
                    <span className="text-xs text-blue-400 font-medium w-24 flex-shrink-0 pt-0.5">Flow</span>
                    <span className="text-xs text-blue-900">{account.mostOverdueInvoice.assignedFlowName}</span>
                  </div>
                )}
                <div className="flex items-center gap-0">
                  <span className="text-xs text-blue-400 font-medium w-24 flex-shrink-0">Next action</span>
                  {stepLabel && StepIcon ? (
                    <span className="flex items-center gap-1.5 text-xs text-blue-900">
                      <StepIcon className="h-3 w-3 text-blue-500" />
                      <span className="font-medium">{stepLabel}</span>
                      {account.nextScheduledAt && (
                        <span className="text-blue-500">· {formatDate(account.nextScheduledAt)}</span>
                      )}
                      {account.nextActionStatus === "awaiting_approval" && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                          Needs approval
                        </span>
                      )}
                      <Link
                        href="/scheduled"
                        className="ml-1 text-blue-600 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    </span>
                  ) : !account.mostOverdueInvoice.assignedFlowId ? (
                    <span className="text-xs text-blue-400 italic">No automation assigned</span>
                  ) : (
                    <span className="text-xs text-blue-400 italic">No actions scheduled</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Overdue invoices list */}
          {account.overdueInvoices.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Overdue invoices ({account.overdueInvoices.length})
              </p>
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {account.overdueInvoices.map((inv, idx) => (
                  <div
                    key={inv.id}
                    className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/50 transition-colors cursor-pointer ${idx > 0 ? "border-t border-gray-100" : ""}`}
                    onClick={(e) => { e.stopPropagation(); router.push(`/invoices/${inv.id}`); }}
                  >
                    {/* Invoice # */}
                    <span className="font-mono text-xs font-semibold text-gray-700 w-28 flex-shrink-0 truncate">
                      {inv.invoiceNumber}
                    </span>
                    {/* Amount */}
                    <span className="text-sm font-bold text-gray-900 w-24 text-right flex-shrink-0">
                      {formatCurrency(inv.amount)}
                    </span>
                    {/* Days overdue */}
                    <span className={`text-xs font-semibold w-20 flex-shrink-0 ${agingColor(inv.daysPastDue)}`}>
                      {inv.daysPastDue}d overdue
                    </span>
                    {/* Due date — desktop only */}
                    <span className="hidden sm:block text-xs text-gray-400 flex-1 truncate">
                      Due {formatDate(inv.dueDate)}
                    </span>
                    {/* Status badge */}
                    <InvoiceStatusBadge status={inv.status as never} />
                    {/* Open link */}
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

          {/* Footer: latest reply + open account */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div>
              {hasReply && replyLabel && replyColor && account.latestMessageId && (
                <Link
                  href={`/inbox?message=${account.latestMessageId}`}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${replyColor}`}>
                    {replyLabel}
                  </span>
                  <span className="text-blue-600 hover:underline">View reply →</span>
                </Link>
              )}
            </div>
            <Link
              href={`/contacts/${account.contactId}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              Open customer account →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ReceivablesPageContent() {
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sort, setSort]         = useState<SortKey>("oldest");
  // Support both ?filter=overdue and ?status=overdue (old NeedsAttention links)
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

  // 1. Filter
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

  // 2. Search
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

  // 3. Sort
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

          {/* ── Toolbar ── */}
          <div className="border-b border-gray-100">
            {/* Mobile */}
            <div className="sm:hidden px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search customers…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-200 pl-8 pr-8 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                  {query && (
                    <button onClick={() => { clear(); searchRef.current?.focus(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <FilterDropdown filter={filter} onFilter={setFilter} />
                <SortDropdown sort={sort} onSort={setSort} />
              </div>
              {!loading && (
                <p className="text-[11px] text-gray-400 mt-1.5 leading-none">
                  {sorted.length} of {accounts.length} customers
                  {filter !== "all" && (
                    <button onClick={() => setFilter("all")} className="ml-1.5 text-blue-500 font-medium">
                      · Reset filter
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* Desktop */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900 shrink-0">Receivables by Account</h2>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search customer, company, invoice #…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-200 pl-8 pr-8 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                />
                {query && (
                  <button onClick={() => { clear(); searchRef.current?.focus(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                <span className="text-xs text-gray-400">
                  {loading ? "Loading…" : `${sorted.length} of ${accounts.length}`}
                </span>
              </div>
            </div>
          </div>

          {/* Account cards */}
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

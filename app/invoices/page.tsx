"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDate, agingColor } from "@/lib/utils";
import { useSearchStore } from "@/lib/search-store";
import {
  Search, X, SlidersHorizontal, ChevronDown, ChevronUp, Check,
  ChevronRight, Building2, AlertTriangle, ChevronsUpDown,
} from "lucide-react";
import type { CustomerAccount } from "@/lib/server-data";

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortCol = "customer" | "overdueTotal" | "invoices" | "oldest" | "response";
type SortDir = "asc" | "desc";

const REPLY_PRIORITY: Record<string, number> = {
  dispute:        0,
  promise_to_pay: 1,
  out_of_office:  2,
  payment_query:  3,
  unclassified:   4,
};
const NO_REPLY_PRIORITY = 5;

function replyPriority(c: string | null): number {
  if (!c) return NO_REPLY_PRIORITY;
  return REPLY_PRIORITY[c] ?? 4;
}

function sortAccounts(accounts: CustomerAccount[], col: SortCol, dir: SortDir): CustomerAccount[] {
  const d = dir === "asc" ? 1 : -1;
  return [...accounts].sort((a, b) => {
    switch (col) {
      case "customer":
        return d * a.name.localeCompare(b.name) || a.company.localeCompare(b.company);
      case "overdueTotal":
        return d * (a.totalOverdueBalance - b.totalOverdueBalance);
      case "invoices":
        return d * (a.overdueCount - b.overdueCount) || b.totalOverdueBalance - a.totalOverdueBalance;
      case "oldest":
        return d * (a.maxDaysPastDue - b.maxDaysPastDue);
      case "response": {
        const pa = replyPriority(a.latestMessageClassification);
        const pb = replyPriority(b.latestMessageClassification);
        return d * (pa - pb) || b.maxDaysPastDue - a.maxDaysPastDue;
      }
      default: return 0;
    }
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-gray-300 flex-shrink-0" />;
  return dir === "asc"
    ? <ChevronUp   className="h-3 w-3 text-blue-500 flex-shrink-0" />
    : <ChevronDown className="h-3 w-3 text-blue-500 flex-shrink-0" />;
}

// ── Filter ────────────────────────────────────────────────────────────────────

type FilterValue = "all" | "overdue" | "disputed" | "promise_to_pay" | "no_automation" | "paused";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all",            label: "All customers" },
  { value: "overdue",        label: "Overdue" },
  { value: "disputed",       label: "Disputed" },
  { value: "promise_to_pay", label: "Promise to Pay" },
  { value: "no_automation",  label: "No automation" },
  { value: "paused",         label: "Automation paused" },
];

function FilterDropdown({ filter, onFilter }: { filter: FilterValue; onFilter: (v: FilterValue) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
        <span className="hidden xs:inline">{active.label}</span>
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
              {filter === opt.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

// ── Customer row ───────────────────────────────────────────────────────────────

function CustomerRow({ account }: { account: CustomerAccount }) {
  const router  = useRouter();
  const [expanded, setExpanded] = useState(false);

  const isDisputed = account.disputedCount > 0;
  const hasReply   = !!account.latestMessageClassification;
  const replyLabel = hasReply ? (REPLY_LABEL[account.latestMessageClassification!] ?? "Reply received") : null;
  const replyColor = hasReply ? (REPLY_COLOR[account.latestMessageClassification!] ?? "bg-gray-100 text-gray-600") : null;

  return (
    <div className={`border-b border-gray-50 last:border-0 ${isDisputed ? "border-l-2 border-l-red-400" : ""}`}>

      {/* ══════════════════════════════════════════
          DESKTOP row (sm+)
      ══════════════════════════════════════════ */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className="hidden sm:flex items-start gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-inset"
        onClick={() => setExpanded(p => !p)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(p => !p); } }}
      >
        {/* Expand indicator — visual only; row click handles expand */}
        <div className="flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center text-gray-400">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>

        {/* Customer + company — flex-1 matches header */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{account.name}</p>
            {account.company && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Building2 className="h-3 w-3" />{account.company}
              </p>
            )}
            {isDisputed && (
              <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                <AlertTriangle className="h-2.5 w-2.5" />Dispute
              </span>
            )}
          </div>
        </div>

        {/* Overdue Total — w-28 */}
        <div className="w-28 text-right flex-shrink-0">
          {account.overdueCount > 0
            ? <p className={`text-sm font-bold ${agingColor(account.maxDaysPastDue)}`}>{formatCurrency(account.totalOverdueBalance)}</p>
            : <p className="text-xs text-gray-300">—</p>}
        </div>

        {/* Invoices count — w-24 */}
        <div className="w-24 text-center flex-shrink-0">
          {account.overdueCount > 0
            ? <span className="text-sm font-semibold text-gray-700">{account.overdueCount}</span>
            : <span className="text-xs text-gray-300">—</span>}
        </div>

        {/* Oldest — w-28 */}
        <div className="w-28 text-center flex-shrink-0">
          {account.maxDaysPastDue > 0
            ? <span className={`text-sm font-semibold ${agingColor(account.maxDaysPastDue)}`}>{account.maxDaysPastDue}d</span>
            : <span className="text-xs text-gray-300">—</span>}
        </div>

        {/* Response — w-32 */}
        <div className="w-32 text-center flex-shrink-0">
          {hasReply && replyLabel && replyColor
            ? <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${replyColor}`}>{replyLabel}</span>
            : account.automationPaused
            ? <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Paused</span>
            : <span className="text-xs text-gray-300 italic">—</span>}
        </div>

        {/* View account — w-28 */}
        <div className="w-28 text-right flex-shrink-0">
          <Link
            href={`/contacts/${account.contactId}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            View account →
          </Link>
        </div>
      </div>

      {/* Desktop expanded invoice rows */}
      {expanded && account.overdueInvoices.length > 0 && (
        <div className="hidden sm:block bg-gray-50/60 border-t border-gray-100 px-5 pb-3 pt-2 ml-9">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Overdue invoices
          </p>
          <div className="space-y-1.5">
            {account.overdueInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-blue-50/40 transition-colors cursor-pointer"
                onClick={() => router.push(`/invoices/${inv.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-medium text-gray-600 whitespace-nowrap">{inv.invoiceNumber}</span>
                  <span className="text-xs font-semibold text-gray-900">{formatCurrency(inv.amount)}</span>
                  <span className={`text-xs font-medium ${agingColor(inv.daysPastDue)}`}>{inv.daysPastDue}d overdue</span>
                  <span className="text-xs text-gray-400">Due {formatDate(inv.dueDate)}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <InvoiceStatusBadge status={inv.status as never} />
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MOBILE card (< sm)
          Primary interaction: tap card to expand/collapse.
          "View account" is the secondary action.
      ══════════════════════════════════════════ */}
      <div className="sm:hidden">
        {/* Tappable card header — expands/collapses */}
        <div
          className="px-4 py-4 cursor-pointer active:bg-gray-50/80 transition-colors select-none"
          onClick={() => setExpanded(p => !p)}
        >
          {/* Row 1: name + dispute badge + response badge + chevron */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <p className="text-base font-semibold text-gray-900 leading-snug">{account.name}</p>
                {isDisputed && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 flex-shrink-0">
                    <AlertTriangle className="h-2.5 w-2.5" />Dispute
                  </span>
                )}
              </div>
              {account.company && (
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{account.company}</p>
              )}
            </div>
            {/* Response badge + chevron — right side */}
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              {hasReply && replyLabel && replyColor && (
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${replyColor}`}>
                  {replyLabel}
                </span>
              )}
              {!hasReply && account.automationPaused && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 leading-none">
                  Paused
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {/* Row 2: overdue balance + invoice count */}
          {account.overdueCount > 0 ? (
            <div className="mt-2.5">
              <p className={`text-xl font-bold leading-none ${agingColor(account.maxDaysPastDue)}`}>
                {formatCurrency(account.totalOverdueBalance)}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-snug">
                {account.overdueCount} invoice{account.overdueCount !== 1 ? "s" : ""} overdue
                {" · "}
                <span className={`font-medium ${agingColor(account.maxDaysPastDue)}`}>
                  oldest {account.maxDaysPastDue}d
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">No overdue invoices</p>
          )}

          {/* Row 3: actions strip */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {account.overdueCount > 0
                ? expanded ? "Tap to collapse" : `Tap to see ${account.overdueCount} invoice${account.overdueCount !== 1 ? "s" : ""}`
                : "No overdue invoices"}
            </span>
            <Link
              href={`/contacts/${account.contactId}`}
              className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              View account →
            </Link>
          </div>
        </div>

        {/* Mobile expanded: stacked invoice mini-cards */}
        {expanded && account.overdueInvoices.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/70 px-4 pt-3 pb-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Overdue invoices ({account.overdueInvoices.length})
            </p>
            <div className="space-y-2">
              {account.overdueInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 cursor-pointer active:bg-blue-50/40 transition-colors"
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                >
                  {/* Invoice # */}
                  <p className="font-mono text-xs font-semibold text-gray-600 mb-1">{inv.invoiceNumber}</p>
                  {/* Amount + days overdue */}
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(inv.amount)}</p>
                    <p className={`text-xs font-semibold ${agingColor(inv.daysPastDue)}`}>
                      {inv.daysPastDue}d overdue
                    </p>
                  </div>
                  {/* Due date */}
                  <p className="text-xs text-gray-400 mt-0.5">Due {formatDate(inv.dueDate)}</p>
                  {/* Status badge — own line, no overlap */}
                  <div className="mt-2">
                    <InvoiceStatusBadge status={inv.status as never} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS: { col: SortCol; label: string; cls: string }[] = [
  { col: "customer",     label: "Customer",      cls: "flex-1 text-left" },
  { col: "overdueTotal", label: "Overdue Total",  cls: "w-28 text-right" },
  { col: "invoices",     label: "Invoices",       cls: "w-24 text-center" },
  { col: "oldest",       label: "Oldest",         cls: "w-28 text-center" },
  { col: "response",     label: "Response",       cls: "w-32 text-center" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

function ReceivablesPageContent() {
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterValue>("all");
  const [sortCol, setSortCol]   = useState<SortCol>("oldest");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");

  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/customer-accounts", { cache: "no-store" })
      .then(r => r.json())
      .then(data => { setAccounts(data); setLoading(false); });
  }, []);

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir(col === "customer" ? "asc" : "desc");
    }
  }

  // 1. Filter → 2. Search → 3. Sort
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

  const sorted = sortAccounts(afterSearch, sortCol, sortDir);
  const customersWithOverdue = accounts.filter(a => a.overdueCount > 0).length;

  return (
    <div>
      <TopBar
        title="Invoices"
        subtitle={`${customersWithOverdue} customers overdue · ${accounts.length} total`}
        description="Overdue invoices grouped by customer. Each row shows the total overdue balance and all related invoices."
      />
      <div className="p-3 sm:p-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* ── Toolbar ── */}
          <div className="border-b border-gray-100">

            {/* Mobile toolbar: search + filter on one row, count below */}
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
                    <button
                      onClick={() => { clear(); searchRef.current?.focus(); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <FilterDropdown filter={filter} onFilter={setFilter} />
              </div>
              {/* Count + reset — below the controls, subtle */}
              {!loading && (
                <p className="text-[11px] text-gray-400 mt-1.5 leading-none">
                  {sorted.length} of {accounts.length} customers
                  {filter !== "all" && (
                    <button
                      onClick={() => setFilter("all")}
                      className="ml-1.5 text-blue-500 font-medium"
                    >
                      · Reset filter
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* Desktop toolbar: title + search + filter on one row */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900 shrink-0">Receivables by Customer</h2>
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
                  <button
                    onClick={() => { clear(); searchRef.current?.focus(); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <FilterDropdown filter={filter} onFilter={setFilter} />
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

          {/* Desktop column headers — sortable */}
          <div className="hidden sm:flex items-center gap-3 px-5 py-2 border-b border-gray-100 bg-gray-50/50">
            <div className="w-6 flex-shrink-0" />
            {COLUMNS.map(({ col, label, cls }) => (
              <button
                key={col}
                onClick={() => handleSort(col)}
                className={`${cls} flex items-center gap-1 text-xs font-medium uppercase tracking-wider select-none transition-colors ${
                  sortCol === col ? "text-blue-600" : "text-gray-400 hover:text-gray-700"
                } ${cls.includes("text-right") ? "justify-end" : cls.includes("text-center") ? "justify-center" : "justify-start"}`}
              >
                <span>{label}</span>
                <SortIcon active={sortCol === col} dir={sortDir} />
              </button>
            ))}
            <div className="w-28 flex-shrink-0" />
          </div>

          {/* Rows */}
          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center px-4">
              <p className="text-sm text-gray-400">No customers match the current filters.</p>
              {(query || filter !== "all") && (
                <div className="flex items-center justify-center gap-3 mt-2">
                  {query && <button onClick={clear} className="text-xs text-blue-500 hover:underline">Clear search</button>}
                  {filter !== "all" && <button onClick={() => setFilter("all")} className="text-xs text-blue-500 hover:underline">Reset filters</button>}
                </div>
              )}
            </div>
          ) : (
            sorted.map(account => <CustomerRow key={account.contactId} account={account} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense>
      <ReceivablesPageContent />
    </Suspense>
  );
}

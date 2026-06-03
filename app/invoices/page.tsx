"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDate, agingColor } from "@/lib/utils";
import { useSearchStore } from "@/lib/search-store";
import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal, AlertTriangle, Check } from "lucide-react";

type SortCol = "invoiceNumber" | "contact" | "amount" | "dueDate" | "daysPastDue" | "status" | "flow" | "reply";
type SortDir = "asc" | "desc";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  daysPastDue: number;
  assignedFlowId: string | null;
  contact: { name: string; company: string } | null;
}

interface ReplyInfo {
  classification: "promise_to_pay" | "dispute" | "out_of_office" | "payment_query" | "unclassified";
  automationPaused: boolean;
  receivedAt: string;
}

interface ScheduledActionSummary {
  status: string;
  stepType: string;
  scheduledAt: string;
}

const REPLY_LABELS: Record<ReplyInfo["classification"], string> = {
  promise_to_pay: "Promise to Pay",
  dispute: "Dispute",
  out_of_office: "Out of Office",
  payment_query: "Payment Query",
  unclassified: "Reply received",
};

const REPLY_COLORS: Record<ReplyInfo["classification"], string> = {
  promise_to_pay: "bg-green-100 text-green-800 border-green-200",
  dispute: "bg-red-100 text-red-800 border-red-200",
  out_of_office: "bg-amber-100 text-amber-800 border-amber-200",
  payment_query: "bg-blue-100 text-blue-800 border-blue-200",
  unclassified: "bg-gray-100 text-gray-600 border-gray-200",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-gray-400" />;
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-blue-500" />
    : <ChevronDown className="h-3 w-3 text-blue-500" />;
}

function normaliseAmount(raw: string): string {
  return raw.replace(/[$,]/g, "");
}

const AUTO_STATUS_CONFIG = {
  paused:            { label: "Paused",          cls: "bg-amber-100 text-amber-700 border-amber-200" },
  blocked:           { label: "Blocked",         cls: "bg-red-100 text-red-700 border-red-200" },
  awaiting_approval: { label: "Needs Approval",  cls: "bg-purple-100 text-purple-700 border-purple-200" },
  active:            { label: "Active",          cls: "bg-green-100 text-green-700 border-green-200" },
  no_flow:           { label: "No Flow",         cls: "bg-gray-100 text-gray-400 border-gray-200" },
  no_actions:        { label: "No Actions",      cls: "bg-gray-100 text-gray-400 border-gray-200" },
} as const;

// ── Unified filter options ────────────────────────────────────────────────────

type FilterOption = {
  value: string;
  label: string;
  group: "status" | "response" | "automation";
  /** which state variable + value this option maps to */
  sets: { field: "status" | "flow" | "reply"; value: string };
};

const INVOICE_FILTER_OPTIONS: FilterOption[] = [
  // Status
  { value: "status:overdue",  label: "Overdue",          group: "status",     sets: { field: "status", value: "overdue" } },
  { value: "status:disputed", label: "Disputed",         group: "status",     sets: { field: "status", value: "disputed" } },
  { value: "status:partial",  label: "Partial",          group: "status",     sets: { field: "status", value: "partial" } },
  { value: "status:paid",     label: "Paid",             group: "status",     sets: { field: "status", value: "paid" } },
  { value: "status:voided",   label: "Voided",           group: "status",     sets: { field: "status", value: "voided" } },
  // Response
  { value: "reply:promise_to_pay", label: "Promise to Pay",    group: "response", sets: { field: "reply", value: "promise_to_pay" } },
  { value: "reply:dispute",        label: "Dispute raised",    group: "response", sets: { field: "reply", value: "dispute" } },
  { value: "reply:out_of_office",  label: "Out of Office",     group: "response", sets: { field: "reply", value: "out_of_office" } },
  { value: "reply:payment_query",  label: "Payment Question",  group: "response", sets: { field: "reply", value: "payment_query" } },
  // Automation
  { value: "flow:none",       label: "No automation",    group: "automation", sets: { field: "flow",   value: "no-flow" } },
  { value: "flow:has",        label: "Has automation",   group: "automation", sets: { field: "flow",   value: "has-flow" } },
];

const GROUP_LABELS: Record<FilterOption["group"], string> = {
  status:     "Status",
  response:   "Response",
  automation: "Automation",
};

function InvoiceFilterDropdown({
  activeKey,
  onSelect,
  onClear,
}: {
  activeKey: string | null;
  onSelect: (opt: FilterOption) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const activeOpt  = activeKey ? INVOICE_FILTER_OPTIONS.find(o => o.value === activeKey) : null;
  const isFiltered = !!activeOpt;

  // Group options by their group field
  const groups: FilterOption["group"][] = ["status", "response", "automation"];

  return (
    <div ref={dropRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          isFiltered
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{isFiltered ? activeOpt.label : "Filter"}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {/* All / clear */}
          <button
            onClick={() => { onClear(); setOpen(false); }}
            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-colors ${
              !isFiltered ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>All</span>
            {!isFiltered && <Check className="h-3.5 w-3.5 text-blue-600" />}
          </button>
          <div className="border-t border-gray-100" />

          {groups.map((group, gi) => {
            const opts = INVOICE_FILTER_OPTIONS.filter(o => o.group === group);
            return (
              <div key={group}>
                {gi > 0 && <div className="border-t border-gray-100" />}
                <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {GROUP_LABELS[group]}
                </p>
                {opts.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onSelect(opt); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeKey === opt.value
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {activeKey === opt.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InvoicesPageContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [flowMap, setFlowMap] = useState<Record<string, string>>({});
  const [replyMap, setReplyMap] = useState<Record<string, ReplyInfo>>({});
  const [scheduledMap, setScheduledMap] = useState<Record<string, ScheduledActionSummary[]>>({});
  const [sortCol, setSortCol] = useState<SortCol>("daysPastDue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  // Initialise filters from URL params so Dashboard "View all →" links land pre-filtered
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") ?? "all");
  const [flowFilter, setFlowFilter]     = useState<string>("all");
  const [replyFilter, setReplyFilter]   = useState<string>("all");

  // Derive which unified filter key is active (null = none)
  const activeFilterKey: string | null = (() => {
    if (statusFilter !== "all") return `status:${statusFilter}`;
    if (replyFilter !== "all")  return `reply:${replyFilter}`;
    if (flowFilter === "no-flow") return "flow:none";
    if (flowFilter !== "all")     return "flow:has";
    return null;
  })();

  function handleUnifiedFilter(opt: FilterOption) {
    // Reset all three first, then apply the selected one
    setStatusFilter("all");
    setFlowFilter("all");
    setReplyFilter("all");
    const { field, value } = opt.sets;
    if (field === "status") setStatusFilter(value);
    else if (field === "flow")  setFlowFilter(value);
    else if (field === "reply") setReplyFilter(value);
  }

  // Shared search state — also written by the TopBar search input
  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const [invoicesRes, flowsRes, inboxRes, scheduledRes] = await Promise.all([
        fetch("/api/invoices", { cache: "no-store" }),
        fetch("/api/automations", { cache: "no-store" }),
        fetch("/api/inbox", { cache: "no-store" }),
        fetch("/api/scheduled", { cache: "no-store" }),
      ]);
      const invoicesData: InvoiceRow[] = await invoicesRes.json();
      const flowsData: { id: string; name: string }[] = await flowsRes.json();
      const inboxData: {
        invoiceId: string;
        classification: ReplyInfo["classification"];
        automationPaused: boolean;
        receivedAt: string;
      }[] = await inboxRes.json();
      const scheduledData: {
        invoiceId: string;
        status: string;
        stepType: string;
        scheduledAt: string;
      }[] = await scheduledRes.json();

      const fMap: Record<string, string> = {};
      for (const f of flowsData) fMap[f.id] = f.name;
      setFlowMap(fMap);
      setInvoices(invoicesData);

      const rMap: Record<string, ReplyInfo> = {};
      const sortedMsgs = [...inboxData].sort(
        (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );
      for (const msg of sortedMsgs) {
        if (!rMap[msg.invoiceId]) {
          rMap[msg.invoiceId] = {
            classification: msg.classification,
            automationPaused: msg.automationPaused,
            receivedAt: msg.receivedAt,
          };
        }
      }
      setReplyMap(rMap);

      const sMap: Record<string, ScheduledActionSummary[]> = {};
      for (const action of scheduledData) {
        if (!sMap[action.invoiceId]) sMap[action.invoiceId] = [];
        sMap[action.invoiceId].push({ status: action.status, stepType: action.stepType, scheduledAt: action.scheduledAt });
      }
      setScheduledMap(sMap);
      setLoading(false);
    }
    load();
  }, []);

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "daysPastDue" || col === "amount" ? "desc" : "asc");
    }
  }

  const filtered = invoices
    .filter((inv) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const normQ = normaliseAmount(q);
      const flowName = inv.assignedFlowId ? (flowMap[inv.assignedFlowId] ?? "") : "no flow";
      const formattedAmount = formatCurrency(inv.amount).toLowerCase();
      const rawAmount = String(inv.amount);
      const dueDateText = formatDate(inv.dueDate).toLowerCase();
      const daysText = inv.daysPastDue > 0 ? `${inv.daysPastDue}d` : "";
      const reply = replyMap[inv.id];
      const replyLabel = reply ? REPLY_LABELS[reply.classification].toLowerCase() : "no reply";
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.contact?.name ?? "").toLowerCase().includes(q) ||
        (inv.contact?.company ?? "").toLowerCase().includes(q) ||
        formattedAmount.includes(q) ||
        normaliseAmount(formattedAmount).includes(normQ) ||
        rawAmount.includes(normQ) ||
        dueDateText.includes(q) ||
        daysText.includes(q) ||
        inv.status.toLowerCase().includes(q) ||
        flowName.toLowerCase().includes(q) ||
        replyLabel.includes(q)
      );
    })
    .filter((inv) => statusFilter === "all" || inv.status === statusFilter)
    .filter((inv) => {
      if (flowFilter === "all") return true;
      if (flowFilter === "no-flow") return !inv.assignedFlowId;
      return inv.assignedFlowId === flowFilter;
    })
    .filter((inv) => {
      if (replyFilter === "all") return true;
      const reply = replyMap[inv.id];
      if (replyFilter === "no-reply") return !reply;
      if (replyFilter === "has-reply") return !!reply;
      return reply?.classification === replyFilter;
    });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortCol) {
      case "invoiceNumber": return dir * a.invoiceNumber.localeCompare(b.invoiceNumber);
      case "contact":       return dir * ((a.contact?.name ?? "").localeCompare(b.contact?.name ?? ""));
      case "amount":        return dir * (a.amount - b.amount);
      case "dueDate":       return dir * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      case "daysPastDue":   return dir * (a.daysPastDue - b.daysPastDue);
      case "status":        return dir * a.status.localeCompare(b.status);
      case "flow":          return dir * ((flowMap[a.assignedFlowId ?? ""] ?? "").localeCompare(flowMap[b.assignedFlowId ?? ""] ?? ""));
      case "reply": {
        const aLabel = replyMap[a.id] ? REPLY_LABELS[replyMap[a.id].classification] : "No reply";
        const bLabel = replyMap[b.id] ? REPLY_LABELS[replyMap[b.id].classification] : "No reply";
        return dir * aLabel.localeCompare(bLabel);
      }
      default:              return 0;
    }
  });

  const overdueCount = invoices.filter(
    (i) => i.status === "overdue" || i.status === "disputed" || i.status === "partial"
  ).length;

  const hasActiveFilters = statusFilter !== "all" || flowFilter !== "all" || replyFilter !== "all";

  function resetFilters() {
    setStatusFilter("all");
    setFlowFilter("all");
    setReplyFilter("all");
  }

  // 4-column clean table: Customer | Amount | Status | Response
  const columns: { col: SortCol; label: string }[] = [
    { col: "contact",     label: "Customer"  },
    { col: "amount",      label: "Amount"    },
    { col: "status",      label: "Status"    },
    { col: "reply",       label: "Response"  },
  ];

  return (
    <div>
      <TopBar title="Invoices" subtitle={`${overdueCount} overdue · ${invoices.length} total`} description="Track unpaid invoices, customer response status, automation status, and next actions." />
      <div className="p-4 sm:p-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 shrink-0">All Invoices</h2>
            {/* In-table search — shares the same store state as the TopBar search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search invoice #, contact, amount, status, flow…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-gray-200 pl-8 pr-8 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => { clear(); searchRef.current?.focus(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <InvoiceFilterDropdown
                activeKey={activeFilterKey}
                onSelect={handleUnifiedFilter}
                onClear={resetFilters}
              />
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Reset
                </button>
              )}
              <span className="text-xs text-gray-400">
                {loading ? "Loading…" : `Showing ${sorted.length} of ${invoices.length}`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400">Loading invoices…</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">
                {query || hasActiveFilters
                  ? "No invoices match the current search and filters."
                  : "No invoices found."}
              </p>
              {(query || hasActiveFilters) && (
                <div className="flex items-center justify-center gap-3 mt-2">
                  {query && (
                    <button onClick={clear} className="text-xs text-blue-500 hover:underline">
                      Clear search
                    </button>
                  )}
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="text-xs text-blue-500 hover:underline">
                      Reset filters
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Desktop table (sm+) — 4 clean columns ── */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {columns.map(({ col, label }) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                          onClick={() => handleSort(col)}
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            <SortIcon active={sortCol === col} dir={sortDir} />
                          </span>
                        </th>
                      ))}
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sorted.map((invoice) => {
                      const reply = replyMap[invoice.id];
                      return (
                        <tr
                          key={invoice.id}
                          className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                          onClick={() => router.push(`/invoices/${invoice.id}`)}
                        >
                          {/* Customer — name + company + invoice# */}
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900">{invoice.contact?.name ?? "—"}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{invoice.contact?.company ?? "—"}</p>
                            <p className="font-mono text-[10px] text-gray-300 mt-0.5">{invoice.invoiceNumber}</p>
                          </td>

                          {/* Amount — amount + days overdue inline */}
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                            {invoice.daysPastDue > 0 && (
                              <p className={`text-xs font-medium mt-0.5 ${agingColor(invoice.daysPastDue)}`}>
                                {invoice.daysPastDue} days overdue
                              </p>
                            )}
                          </td>

                          {/* Status — one badge */}
                          <td className="px-5 py-4">
                            <InvoiceStatusBadge status={invoice.status as never} />
                          </td>

                          {/* Response — reply classification only, dash if none */}
                          <td className="px-5 py-4">
                            {reply ? (
                              <div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REPLY_COLORS[reply.classification]}`}>
                                  {REPLY_LABELS[reply.classification]}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(reply.receivedAt)}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list (< sm) ────────────────────────────── */}
              <div className="sm:hidden divide-y divide-gray-100">
                {sorted.map((invoice) => {
                  const reply = replyMap[invoice.id];
                  const actions = scheduledMap[invoice.id] ?? [];
                  let autoKey: keyof typeof AUTO_STATUS_CONFIG = "no_actions";
                  if (reply?.automationPaused) autoKey = "paused";
                  else if (actions.some(a => a.status === "blocked")) autoKey = "blocked";
                  else if (actions.some(a => a.status === "awaiting_approval")) autoKey = "awaiting_approval";
                  else if (actions.some(a => a.status === "pending")) autoKey = "active";

                  const pending = actions.find(a => a.status === "pending");

                  // Derive primary status line text + className (priority order)
                  let primaryStatus: { text: string; cls: string } | null = null;
                  if (invoice.status === "disputed") {
                    primaryStatus = { text: "Dispute raised — review needed", cls: "text-xs font-medium text-red-600 mt-1" };
                  } else if (reply?.classification === "promise_to_pay") {
                    primaryStatus = { text: "Customer promised to pay", cls: "text-xs font-medium text-green-600 mt-1" };
                  } else if (autoKey === "blocked") {
                    primaryStatus = { text: "Action blocked", cls: "text-xs font-medium text-red-600 mt-1" };
                  } else if (autoKey === "awaiting_approval") {
                    primaryStatus = { text: "Needs your approval", cls: "text-xs font-medium text-purple-600 mt-1" };
                  } else if (reply?.classification === "payment_query") {
                    primaryStatus = { text: "Customer has a question", cls: "text-xs font-medium text-blue-600 mt-1" };
                  } else if (reply?.classification === "out_of_office") {
                    primaryStatus = { text: "Customer out of office", cls: "text-xs font-medium text-gray-500 mt-1" };
                  } else if (autoKey === "paused") {
                    primaryStatus = { text: "Automation paused", cls: "text-xs font-medium text-amber-600 mt-1" };
                  } else if (invoice.status === "paid") {
                    primaryStatus = { text: "Paid", cls: "text-xs font-medium text-green-600 mt-1" };
                  }
                  // pending action line and no-automation line are rendered separately below

                  return (
                    <div
                      key={invoice.id}
                      className="px-4 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors"
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                    >
                      {/* Invoice # row — no status badge */}
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {invoice.invoiceNumber}
                        </span>
                      </div>

                      {/* Contact name + company */}
                      <p className="text-xs font-medium text-gray-900 leading-tight">{invoice.contact?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{invoice.contact?.company ?? "—"}</p>

                      {/* Primary status line */}
                      {primaryStatus ? (
                        <p className={primaryStatus.cls}>{primaryStatus.text}</p>
                      ) : autoKey === "active" && pending ? (
                        <p className="text-xs text-blue-600 mt-1">
                          Next: {pending.stepType} scheduled {formatDate(pending.scheduledAt)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">No automation assigned</p>
                      )}

                      {/* Amount + days overdue inline */}
                      <div className="flex items-baseline gap-2 mt-2 mb-1.5">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </span>
                        {invoice.daysPastDue > 0 && (
                          <span className={`text-xs font-semibold ${agingColor(invoice.daysPastDue)}`}>
                            {invoice.daysPastDue}d overdue
                          </span>
                        )}
                      </div>

                      {/* Due date */}
                      <p className="text-xs text-gray-400 mb-2.5">
                        Due {formatDate(invoice.dueDate)}
                      </p>

                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View invoice →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesPageContent />
    </Suspense>
  );
}

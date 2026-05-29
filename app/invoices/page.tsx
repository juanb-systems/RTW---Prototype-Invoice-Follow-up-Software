"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDate, agingColor } from "@/lib/utils";
import { useSearchStore } from "@/lib/search-store";
import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown, PauseCircle, SlidersHorizontal, Zap } from "lucide-react";

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [flowMap, setFlowMap] = useState<Record<string, string>>({});
  const [replyMap, setReplyMap] = useState<Record<string, ReplyInfo>>({});
  const [scheduledMap, setScheduledMap] = useState<Record<string, ScheduledActionSummary[]>>({});
  const [sortCol, setSortCol] = useState<SortCol>("daysPastDue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [flowFilter, setFlowFilter]   = useState<string>("all");
  const [replyFilter, setReplyFilter] = useState<string>("all");

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

  // Unique flows that appear in the current invoice list (for the Flow dropdown)
  const assignedFlowIds = [...new Set(invoices.filter((i) => i.assignedFlowId).map((i) => i.assignedFlowId!))];
  const hasActiveFilters = statusFilter !== "all" || flowFilter !== "all" || replyFilter !== "all";

  function resetFilters() {
    setStatusFilter("all");
    setFlowFilter("all");
    setReplyFilter("all");
  }

  const columns: { col: SortCol; label: string; align: "left" | "right" | "center" }[] = [
    { col: "invoiceNumber", label: "Invoice",      align: "left" },
    { col: "contact",       label: "Contact",      align: "left" },
    { col: "amount",        label: "Amount",       align: "right" },
    { col: "dueDate",       label: "Due Date",     align: "left" },
    { col: "daysPastDue",   label: "Days Overdue", align: "center" },
    { col: "status",        label: "Status",       align: "left" },
    { col: "flow",          label: "Flow",         align: "left" },
    { col: "reply",         label: "Reply",        align: "left" },
  ];

  return (
    <div>
      <TopBar title="Invoices" subtitle={`${overdueCount} overdue · ${invoices.length} total`} />
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
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
            <span className="text-xs text-gray-400 shrink-0 ml-auto">
              {loading ? "Loading…" : `Showing ${sorted.length} of ${invoices.length} invoices`}
            </span>
          </div>

          {/* Filter row */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/40 flex items-center gap-3 flex-wrap">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`rounded-md border py-1 pl-2.5 pr-6 text-xs focus:border-blue-400 focus:outline-none appearance-none bg-white ${statusFilter !== "all" ? "border-blue-400 text-blue-700 font-medium" : "border-gray-200 text-gray-600"}`}
            >
              <option value="all">Status: All</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
              <option value="disputed">Disputed</option>
              <option value="paid">Paid</option>
              <option value="voided">Voided</option>
            </select>

            {/* Flow filter */}
            <select
              value={flowFilter}
              onChange={(e) => setFlowFilter(e.target.value)}
              className={`rounded-md border py-1 pl-2.5 pr-6 text-xs focus:border-blue-400 focus:outline-none appearance-none bg-white ${flowFilter !== "all" ? "border-blue-400 text-blue-700 font-medium" : "border-gray-200 text-gray-600"}`}
            >
              <option value="all">Flow: All</option>
              <option value="no-flow">No flow assigned</option>
              {assignedFlowIds.map((fId) => (
                <option key={fId} value={fId}>{flowMap[fId] ?? fId}</option>
              ))}
            </select>

            {/* Reply filter */}
            <select
              value={replyFilter}
              onChange={(e) => setReplyFilter(e.target.value)}
              className={`rounded-md border py-1 pl-2.5 pr-6 text-xs focus:border-blue-400 focus:outline-none appearance-none bg-white ${replyFilter !== "all" ? "border-blue-400 text-blue-700 font-medium" : "border-gray-200 text-gray-600"}`}
            >
              <option value="all">Reply: All</option>
              <option value="has-reply">Has reply</option>
              <option value="no-reply">No reply</option>
              <option value="promise_to_pay">Promise to Pay</option>
              <option value="dispute">Dispute</option>
              <option value="out_of_office">Out of Office</option>
              <option value="payment_query">Payment Query</option>
              <option value="unclassified">Unclassified</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400">Loading invoices…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {columns.map(({ col, label, align }) => (
                      <th
                        key={col}
                        className={`px-5 py-3 text-${align} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none whitespace-nowrap`}
                        onClick={() => handleSort(col)}
                      >
                        <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
                          {label}
                          <SortIcon active={sortCol === col} dir={sortDir} />
                        </span>
                      </th>
                    ))}
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
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
                      </td>
                    </tr>
                  ) : (
                    sorted.map((invoice) => {
                      const reply = replyMap[invoice.id];
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-medium text-gray-700">
                              {invoice.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{invoice.contact?.name ?? "—"}</p>
                              <p className="text-xs text-gray-400">{invoice.contact?.company ?? "—"}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-gray-900 text-xs">
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {invoice.daysPastDue > 0 ? (
                              <span className={`text-xs font-semibold ${agingColor(invoice.daysPastDue)}`}>
                                {invoice.daysPastDue}d
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <InvoiceStatusBadge status={invoice.status as never} />
                          </td>
                          <td className="px-5 py-3.5">
                            {invoice.assignedFlowId ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200 whitespace-nowrap">
                                  <Zap className="h-2.5 w-2.5" />
                                  {flowMap[invoice.assignedFlowId] ?? invoice.assignedFlowId}
                                </span>
                                {(() => {
                                  const reply = replyMap[invoice.id];
                                  const actions = scheduledMap[invoice.id] ?? [];
                                  let key: keyof typeof AUTO_STATUS_CONFIG = "no_actions";
                                  if (reply?.automationPaused) key = "paused";
                                  else if (actions.some(a => a.status === "blocked")) key = "blocked";
                                  else if (actions.some(a => a.status === "awaiting_approval")) key = "awaiting_approval";
                                  else if (actions.some(a => a.status === "pending")) key = "active";
                                  const cfg = AUTO_STATUS_CONFIG[key];
                                  const pending = actions.find(a => a.status === "pending");
                                  return (
                                    <div>
                                      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
                                        {cfg.label}
                                      </span>
                                      {key === "active" && pending && (
                                        <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                                          Next: {pending.stepType} · {formatDate(pending.scheduledAt)}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">No flow</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {reply ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${REPLY_COLORS[reply.classification]}`}>
                                    {REPLY_LABELS[reply.classification]}
                                  </span>
                                  {reply.automationPaused && (
                                    <span title="Automation paused">
                                      <PauseCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400">{formatDate(reply.receivedAt)}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">No reply</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

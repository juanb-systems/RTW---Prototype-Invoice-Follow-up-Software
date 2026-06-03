"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ScheduledActionCard } from "@/components/scheduled/ScheduledActionCard";
import { RefreshCw, Search, X, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { useSearchStore } from "@/lib/search-store";
import { formatDate } from "@/lib/utils";

type FullAction = {
  id: string;
  status: string;
  stepType: string;
  scheduledAt: string;
  invoiceId: string;
  contactId: string;
  flowId: string;
  stepId: string;
  skipReason: string | null;
  lookupResult: {
    outcome: "proceed" | "skip" | "block" | "hold" | "awaiting_approval";
    reason: string;
    performedAt: string;
  } | null;
  invoice?: { invoiceNumber: string; amount: number };
  contact?: { name: string; company: string };
  flow?: { name: string };
};

const statusOrder = ["pending", "awaiting_approval", "sent", "skipped", "blocked"];

// ── Filter dropdown ───────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: "all",               label: "All" },
  { value: "pending",           label: "Upcoming" },
  { value: "awaiting_approval", label: "Needs Approval" },
  { value: "sent",              label: "Sent" },
  { value: "blocked",           label: "Blocked" },
  { value: "skipped",           label: "Skipped" },
];

function ActionsFilterDropdown({
  filter,
  onFilter,
  counts,
}: {
  filter: string;
  onFilter: (v: string) => void;
  counts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const activeOpt = FILTER_OPTIONS.find(o => o.value === filter) ?? FILTER_OPTIONS[0];
  const isFiltered = filter !== "all";

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
        <ChevronDown className={`h-3 w-3 opacity-60 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onFilter(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between px-3 py-2.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{opt.label}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {opt.value !== "all" && (
                  <span className="text-[10px] text-gray-400">{counts[opt.value] ?? 0}</span>
                )}
                {filter === opt.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ScheduledPageContent() {
  const searchParams = useSearchParams();
  const [actions, setActions] = useState<FullAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(searchParams.get("filter") ?? "all");

  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/scheduled", { cache: "no-store" });
    const data = await res.json();
    setActions(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = actions
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const scheduledDate = formatDate(a.scheduledAt).toLowerCase();
      return (
        a.stepType.toLowerCase().includes(q) ||
        (a.invoice?.invoiceNumber ?? "").toLowerCase().includes(q) ||
        (a.contact?.name ?? "").toLowerCase().includes(q) ||
        (a.contact?.company ?? "").toLowerCase().includes(q) ||
        (a.flow?.name ?? "").toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        scheduledDate.includes(q) ||
        (a.skipReason ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

  const pending = actions.filter((a) => a.status === "pending").length;
  const awaiting = actions.filter((a) => a.status === "awaiting_approval").length;

  // Per-status counts for the dropdown
  const counts: Record<string, number> = {};
  for (const a of actions) counts[a.status] = (counts[a.status] ?? 0) + 1;

  return (
    <div>
      <TopBar
        title="Actions"
        subtitle={pending > 0 || awaiting > 0 ? `${pending} upcoming · ${awaiting} need approval` : "All caught up"}
        description="Review what CollectPilot has sent, what is scheduled next, and what needs approval."
        actions={
          <button
            onClick={load}
            title="Refresh"
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">

        {/* Safety notice — compact */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-xs text-amber-700">
            <strong>Safety check before every send.</strong>{" "}
            CollectPilot verifies each invoice is still unpaid before sending. Actions are skipped if the invoice is paid or the contact is excluded.
          </p>
        </div>

        {/* Search + filter — single compact row, full width on mobile */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search actions…"
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
          <ActionsFilterDropdown filter={filter} onFilter={setFilter} counts={counts} />
        </div>

        {/* Count — below controls, unobtrusive */}
        {!loading && (
          <p className="text-xs text-gray-400 -mt-1">
            {filtered.length === actions.length
              ? `${actions.length} action${actions.length !== 1 ? "s" : ""}`
              : `${filtered.length} of ${actions.length} actions`}
            {filter !== "all" && (
              <span className="ml-1 text-blue-600 font-medium">
                · {FILTER_OPTIONS.find(o => o.value === filter)?.label}
              </span>
            )}
          </p>
        )}

        {/* Cards */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm text-gray-400">
              {query ? `No actions match "${query}".` : "No actions in this category."}
            </p>
            {query && (
              <button onClick={clear} className="mt-2 text-xs text-blue-500 hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((action) => (
              <ScheduledActionCard
                key={action.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                action={action as any}
                onRefresh={load}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScheduledPage() {
  return (
    <Suspense>
      <ScheduledPageContent />
    </Suspense>
  );
}

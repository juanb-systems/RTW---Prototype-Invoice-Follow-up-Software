"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ScheduledActionCard } from "@/components/scheduled/ScheduledActionCard";
import { RefreshCw, Search, X } from "lucide-react";
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

function ScheduledPageContent() {
  const searchParams = useSearchParams();
  const [actions, setActions] = useState<FullAction[]>([]);
  const [loading, setLoading] = useState(true);
  // Initialise filter from URL param so Dashboard "View all →" links land pre-filtered
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

  useEffect(() => {
    load();
  }, [load]);

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
      <div className="p-4 sm:p-6 space-y-5">
        {/* Key reminder */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-700">
            <strong>Safety check required.</strong> Before any action fires, CollectPilot runs a safety check — verifying the invoice is still unpaid, the contact is not excluded, and no disputes or promises are active.
          </p>
        </div>

        {/* Search bar */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search action type, invoice, contact, status…"
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
              {loading ? "Loading…" : `Showing ${filtered.length} of ${actions.length} actions`}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Upcoming" },
            { value: "awaiting_approval", label: "Needs Approval" },
            { value: "sent", label: "Sent" },
            { value: "blocked", label: "Blocked" },
            { value: "skipped", label: "Skipped" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.value
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ml-1.5 opacity-70">
                  ({actions.filter((a) => a.status === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm text-gray-400">
              {query ? `No actions match "${query}".` : "No actions matching this filter."}
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

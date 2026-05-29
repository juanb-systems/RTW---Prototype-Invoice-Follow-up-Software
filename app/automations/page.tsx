"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Mail, MessageSquare, Phone, Clock, GitBranch, RefreshCw, Zap, Search, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/lib/search-store";
import { useFlowStore } from "@/lib/flow-store";
import type { AutomationFlow, FlowStep } from "@/lib/types";

const statusConfig = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
  paused: { label: "Paused", className: "bg-amber-100 text-amber-700 border-amber-200" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

function StepTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    email: Mail, sms: MessageSquare, call: Phone, wait: Clock,
    lookup_check: RefreshCw, condition: GitBranch, end: Zap,
  };
  const Icon = icons[type] ?? Zap;
  return <Icon className="h-3 w-3" />;
}

function NewFlowModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCreate() {
    setCreating(true);
    await onCreate(name);
    setCreating(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">New Automation Flow</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Give your flow a name. It will be created as a <span className="font-medium text-gray-700">Draft</span> and
          open in the builder so you can add Email, SMS, Delay, and Call steps.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Flow name</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !creating) handleCreate(); }}
            placeholder="e.g. Standard Collection Flow"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {creating ? "Creating…" : "Create Flow"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const router = useRouter();
  const [apiFlows, setApiFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  const upsert = useFlowStore((s) => s.upsert);
  const storeFlows = useFlowStore((s) => s.flows);

  // Merge seeded API flows with Zustand-persisted flows.
  // Zustand entries override same-ID API entries and append new ones.
  const flows = useMemo(() => {
    const merged = new Map<string, AutomationFlow>();
    apiFlows.forEach((f) => merged.set(f.id, f));
    Object.values(storeFlows).forEach((f) => merged.set(f.id, f));
    return Array.from(merged.values());
  }, [apiFlows, storeFlows]);

  async function handleCreate(name: string) {
    const id = `FLOW-${Date.now()}`;
    const trimmedName = name.trim() || "Untitled Flow";
    const newFlow: AutomationFlow = {
      id,
      name: trimmedName,
      description: "New automation flow",
      status: "draft",
      trigger: { type: "days_overdue", value: 7 },
      steps: [
        { id: `${id}-T`,   type: "trigger", order: 1, config: { label: "Invoice 7 days overdue", days: 7 },   position: { x: 300, y: 50 } },
        { id: `${id}-END`, type: "end",     order: 2, config: { label: "End" },                                position: { x: 300, y: 230 } },
      ],
      edges: [{ id: `${id}-E1`, source: `${id}-T`, target: `${id}-END` }],
    };
    upsert(newFlow);
    router.push(`/automations/${id}/builder`);
  }

  useEffect(() => {
    fetch("/api/automations", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setApiFlows(data);
        setLoading(false);
      });
  }, []);

  const filtered = flows.filter((flow) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();

    const stepTypes = flow.steps.map((s: FlowStep) => s.type).join(" ");
    const triggerValue = String(flow.trigger?.value ?? "");
    const statusLabel = statusConfig[flow.status as keyof typeof statusConfig]?.label ?? flow.status;

    return (
      flow.name.toLowerCase().includes(q) ||
      (flow.description ?? "").toLowerCase().includes(q) ||
      flow.status.toLowerCase().includes(q) ||
      statusLabel.toLowerCase().includes(q) ||
      triggerValue.includes(q) ||
      stepTypes.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {modalOpen && (
        <NewFlowModal
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
      <TopBar
        title="Automations"
        subtitle={`${flows.length} flows configured`}
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700">
            <strong>Fresh lookup required before sending.</strong> All automation flows include a lookup
            checkpoint before any email, SMS, or call is sent. Actions are skipped or blocked if the
            invoice is paid, disputed, or the contact is excluded.
          </p>
        </div>

        {/* Search + count bar */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 shrink-0">All Flows</h2>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search flow name, status…"
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
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-gray-400 flex-1 sm:flex-none">
                {loading ? "Loading…" : `${filtered.length} of ${flows.length} flows`}
              </span>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                New Flow
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400">Loading automations…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">
                {query ? `No flows match "${query}".` : "No automation flows found."}
              </p>
              {query && (
                <button onClick={clear} className="mt-2 text-xs text-blue-500 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filtered.map((flow) => {
                const cfg = statusConfig[flow.status as keyof typeof statusConfig] ?? statusConfig.draft;
                const actionSteps = flow.steps.filter((s: FlowStep) => ["email", "sms", "call"].includes(s.type));
                const lookupSteps = flow.steps.filter((s: FlowStep) => s.type === "lookup_check");

                const stepSummary = flow.steps
                  .filter((s: FlowStep) => !["trigger", "end"].includes(s.type))
                  .map((s: FlowStep) => {
                    if (s.type === "lookup_check") return "Lookup";
                    if (s.type === "wait") return `Wait ${(s.config as { days?: number }).days ?? "?"}d`;
                    return s.type.charAt(0).toUpperCase() + s.type.slice(1);
                  })
                  .join(" → ");

                return (
                  <div key={flow.id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                    {/* Header row — name + badge, Edit button inline on sm+ */}
                    <div className="flex items-start gap-2 mb-2">
                      <Zap className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{flow.name}</h3>
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0", cfg.className)}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{flow.description}</p>
                      </div>
                      {/* Edit button — visible on sm+ only in header */}
                      <Link
                        href={`/automations/${flow.id}/builder`}
                        className="hidden sm:flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shrink-0"
                      >
                        <GitBranch className="h-3.5 w-3.5" />
                        Edit Flow
                      </Link>
                    </div>

                    {/* Metrics row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 ml-6 text-xs text-gray-500">
                      <span><span className="text-gray-400">Triggers at: </span><span className="font-medium text-gray-700">{flow.trigger?.value} days overdue</span></span>
                      <span><span className="text-gray-400">Steps: </span><span className="font-medium text-gray-700">{flow.steps.length}</span></span>
                      <span><span className="text-gray-400">Lookups: </span><span className="font-medium text-green-700">{lookupSteps.length}</span></span>
                    </div>

                    {/* Step chips — desktop only */}
                    <div className="ml-6 hidden sm:flex items-center gap-1 flex-wrap">
                      {flow.steps.map((step: FlowStep, idx: number) => (
                        <div key={step.id} className="flex items-center gap-1">
                          <div
                            className={cn(
                              "flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                              step.type === "lookup_check" ? "border-amber-200 bg-amber-50 text-amber-700" :
                              step.type === "email" ? "border-blue-200 bg-blue-50 text-blue-700" :
                              step.type === "sms" ? "border-purple-200 bg-purple-50 text-purple-700" :
                              step.type === "call" ? "border-green-200 bg-green-50 text-green-700" :
                              step.type === "wait" ? "border-gray-200 bg-gray-100 text-gray-500" :
                              "border-gray-200 bg-gray-50 text-gray-500"
                            )}
                          >
                            <StepTypeIcon type={step.type} />
                            <span className="capitalize">
                              {step.type === "lookup_check" ? "Lookup" :
                               step.type === "wait" ? `Wait ${(step.config as { days?: number }).days ?? "?"}d` :
                               step.type}
                            </span>
                          </div>
                          {idx < flow.steps.length - 1 && (
                            <span className="text-gray-300 text-xs">→</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Step summary — mobile only */}
                    {stepSummary && (
                      <p className="ml-6 sm:hidden text-xs text-gray-500 leading-snug">{stepSummary}</p>
                    )}

                    <div className="mt-2 ml-6 flex items-center gap-4 text-xs text-gray-400">
                      <span>{actionSteps.length} send action{actionSteps.length !== 1 ? "s" : ""}</span>
                      {lookupSteps.length > 0 && (
                        <span className="text-amber-600 font-medium">
                          ✓ Fresh lookup before each send
                        </span>
                      )}
                    </div>

                    {/* Edit button — full-width on mobile only */}
                    <Link
                      href={`/automations/${flow.id}/builder`}
                      className="sm:hidden mt-3 flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors w-full"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      Edit Flow
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

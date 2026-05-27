"use client";

import { useEffect, useRef, useState } from "react";
import {
  Save, Trash2, Plus, ChevronDown, ChevronUp,
  Mail, MessageSquare, Phone, Clock, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AutomationFlow, FlowEdge, FlowStep } from "@/lib/types";

// ── Metadata ─────────────────────────────────────────────────────────────────

const STEP_META: Record<string, { label: string; iconCls: string; canDelete: boolean }> = {
  trigger: { label: "Trigger",        iconCls: "bg-gray-900 text-white",    canDelete: false },
  email:   { label: "Send Email",     iconCls: "bg-blue-600 text-white",    canDelete: true  },
  sms:     { label: "Send SMS",       iconCls: "bg-purple-600 text-white",  canDelete: true  },
  call:    { label: "Schedule Call",  iconCls: "bg-green-600 text-white",   canDelete: true  },
  wait:    { label: "Delay",          iconCls: "bg-gray-500 text-white",    canDelete: true  },
  end:     { label: "End Automation", iconCls: "bg-gray-200 text-gray-600", canDelete: false },
};

const STEP_ICONS: Record<string, LucideIcon> = {
  trigger: Zap, email: Mail, sms: MessageSquare,
  call: Phone, wait: Clock, end: Zap,
};

const INSERTABLE = [
  { type: "email" as const, label: "Email",  Icon: Mail,          cls: "border-blue-200 text-blue-700 hover:bg-blue-50" },
  { type: "sms"   as const, label: "SMS",    Icon: MessageSquare, cls: "border-purple-200 text-purple-700 hover:bg-purple-50" },
  { type: "call"  as const, label: "Call",   Icon: Phone,         cls: "border-green-200 text-green-700 hover:bg-green-50" },
  { type: "wait"  as const, label: "Delay",  Icon: Clock,         cls: "border-gray-200 text-gray-700 hover:bg-gray-50" },
];

// ── Default configs ───────────────────────────────────────────────────────────

function defaultConfig(type: string): Record<string, unknown> {
  switch (type) {
    case "email":   return { label: "Send Email",    subject: "", body: "", senderName: "", template: "" };
    case "sms":     return { label: "Send SMS",      template: "" };
    case "call":    return { label: "Schedule Call", notes: "" };
    case "wait":    return { label: "Wait",          days: 3 };
    case "trigger": return { label: "Invoice 7 days overdue", days: 7, triggerType: "days_overdue" };
    case "end":     return { label: "End Automation" };
    default:        return { label: type };
  }
}

// ── Conversion helpers ────────────────────────────────────────────────────────

function toDisplaySteps(flow: AutomationFlow): FlowStep[] {
  const filtered = (flow.steps ?? []).filter(s => s.type !== "lookup_check");
  const steps: FlowStep[] = [...filtered];

  if (!steps.length || steps[0].type !== "trigger") {
    steps.unshift({
      id: `trigger-${Date.now()}`,
      type: "trigger",
      order: 1,
      config: { label: "Invoice 7 days overdue", days: 7, triggerType: "days_overdue" },
      position: { x: 300, y: 50 },
    });
  }
  if (steps[steps.length - 1].type !== "end") {
    steps.push({
      id: `end-${Date.now()}`,
      type: "end",
      order: steps.length + 1,
      config: { label: "End Automation" },
      position: { x: 300, y: (steps.length + 1) * 150 },
    });
  }
  return steps;
}

function toFinalSteps(displaySteps: FlowStep[]): FlowStep[] {
  const result: FlowStep[] = [];
  let order = 1;
  for (const step of displaySteps) {
    if (["email", "sms", "call"].includes(step.type)) {
      result.push({
        id: `lookup-${step.id}`,
        type: "lookup_check",
        order: order++,
        config: { label: "Fresh Xero Check" },
        position: { x: 300, y: order * 120 },
      });
    }
    result.push({ ...step, order: order++, position: { x: 300, y: order * 120 } });
  }
  return result;
}

function generateEdges(finalSteps: FlowStep[]): FlowEdge[] {
  return finalSteps.slice(0, -1).map((step, i) => ({
    id: `e-${i}`,
    source: step.id,
    target: finalSteps[i + 1].id,
  }));
}

// ── Insert picker popover ─────────────────────────────────────────────────────

function InsertPicker({
  onInsert,
  onClose,
}: {
  onInsert: (type: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-1/2 -translate-x-1/2 top-8 z-30 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-xl"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mr-1">Insert</span>
      {INSERTABLE.map(({ type, label, Icon, cls }) => (
        <button
          key={type}
          onClick={() => { onInsert(type); onClose(); }}
          className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${cls}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Connector with insert button ──────────────────────────────────────────────

function InsertConnector({ onInsert }: { onInsert: (type: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center py-0.5 group">
      <div className="h-5 w-px bg-gray-200" />
      <div className="relative">
        <button
          onClick={() => setOpen(p => !p)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 bg-white text-gray-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-colors shadow-sm"
          title="Insert block here"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        {open && <InsertPicker onInsert={onInsert} onClose={() => setOpen(false)} />}
      </div>
      <div className="h-5 w-px bg-gray-200" />
    </div>
  );
}

// ── Individual step card ──────────────────────────────────────────────────────

function StepCard({
  step,
  onRemove,
  onUpdate,
}: {
  step: FlowStep;
  onRemove: (id: string) => void;
  onUpdate: (id: string, config: Record<string, unknown>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = step.config as Record<string, unknown>;
  const meta = STEP_META[step.type] ?? STEP_META.end;
  const Icon = STEP_ICONS[step.type] ?? Zap;
  const isAction = ["email", "sms", "call"].includes(step.type);
  const isTrigger = step.type === "trigger";
  const isEnd = step.type === "end";
  const isWait = step.type === "wait";

  function set(key: string, value: unknown) {
    onUpdate(step.id, { ...cfg, [key]: value });
  }

  function subtitle(): string {
    if (isTrigger) {
      const t = (cfg.triggerType as string) ?? "days_overdue";
      if (t === "days_overdue") return `Invoice ${cfg.days ?? 7} days overdue`;
      if (t === "invoice_created") return "Invoice created";
      if (t === "reply_received") return "Reply received";
      return "Manual start";
    }
    if (isWait) return `Wait ${cfg.days ?? "?"} days`;
    return (cfg.label as string) || meta.label;
  }

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-shadow ${
        expanded ? "border-blue-300 shadow-md" : "border-gray-200"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.iconCls}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 leading-snug">{meta.label}</p>
          <p className="text-[11px] text-gray-400 leading-snug truncate">{subtitle()}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isEnd && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center gap-0.5 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {expanded
                ? <><span>Done</span><ChevronUp className="h-3 w-3 ml-0.5" /></>
                : <><span>Edit</span><ChevronDown className="h-3 w-3 ml-0.5" /></>}
            </button>
          )}
          {meta.canDelete && (
            <button
              onClick={() => onRemove(step.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Remove block"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Xero safety checkbox — email/sms/call only */}
      {isAction && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked
            disabled
            readOnly
            className="h-3 w-3 accent-amber-500 cursor-not-allowed"
          />
          <span className="text-[11px] font-medium text-gray-600">Check still unpaid in Xero</span>
          <span className="text-[10px] text-gray-400">— required, cannot be disabled</span>
        </div>
      )}

      {/* Inline edit panel */}
      {expanded && !isEnd && (
        <div className="border-t border-blue-100 bg-blue-50/20 px-4 py-3 space-y-3">

          {/* TRIGGER */}
          {isTrigger && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Trigger type</label>
                <select
                  value={(cfg.triggerType as string) ?? "days_overdue"}
                  onChange={e => set("triggerType", e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 bg-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="days_overdue">Invoice overdue by X days</option>
                  <option value="invoice_created">Invoice created</option>
                  <option value="reply_received">Reply received</option>
                  <option value="manual">Manual start</option>
                </select>
              </div>
              {(!cfg.triggerType || cfg.triggerType === "days_overdue") && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Days overdue</label>
                  <input
                    type="number"
                    min={1}
                    value={(cfg.days as number) ?? 7}
                    onChange={e => set("days", parseInt(e.target.value) || 1)}
                    className="w-24 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          {/* DELAY */}
          {isWait && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={(cfg.label as string) ?? ""}
                  onChange={e => set("label", e.target.value)}
                  placeholder="e.g. Wait before next contact"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Days to wait</label>
                <input
                  type="number"
                  min={1}
                  value={(cfg.days as number) ?? 3}
                  onChange={e => set("days", parseInt(e.target.value) || 1)}
                  className="w-24 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* EMAIL */}
          {step.type === "email" && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Label / Name</label>
                <input
                  type="text"
                  value={(cfg.label as string) ?? ""}
                  onChange={e => set("label", e.target.value)}
                  placeholder="e.g. Gentle Reminder"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Subject line</label>
                <input
                  type="text"
                  value={(cfg.subject as string) ?? ""}
                  onChange={e => set("subject", e.target.value)}
                  placeholder="Email subject"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Sender name</label>
                <input
                  type="text"
                  value={(cfg.senderName as string) ?? ""}
                  onChange={e => set("senderName", e.target.value)}
                  placeholder="Accounts Team"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* SMS */}
          {step.type === "sms" && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Label / Name</label>
                <input
                  type="text"
                  value={(cfg.label as string) ?? ""}
                  onChange={e => set("label", e.target.value)}
                  placeholder="e.g. SMS Reminder"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Message</label>
                <textarea
                  value={(cfg.template as string) ?? ""}
                  onChange={e => set("template", e.target.value)}
                  rows={3}
                  placeholder="SMS body…"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none resize-none"
                />
              </div>
            </>
          )}

          {/* CALL */}
          {step.type === "call" && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Label / Task name</label>
                <input
                  type="text"
                  value={(cfg.label as string) ?? ""}
                  onChange={e => set("label", e.target.value)}
                  placeholder="e.g. Follow-up Call"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Call notes</label>
                <textarea
                  value={(cfg.notes as string) ?? ""}
                  onChange={e => set("notes", e.target.value)}
                  rows={2}
                  placeholder="Notes for the call…"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none resize-none"
                />
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}

// ── Main FlowBuilder component ────────────────────────────────────────────────

interface FlowBuilderProps {
  flow: AutomationFlow;
  onSaveNew?: (steps: FlowStep[], edges: FlowEdge[]) => Promise<void>;
  onAfterSave?: (flow: AutomationFlow) => void;
}

export function FlowBuilder({ flow, onSaveNew, onAfterSave }: FlowBuilderProps) {
  const [steps, setSteps] = useState<FlowStep[]>(() => toDisplaySteps(flow));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const isNew = flow.id === "new";

  function insertAt(type: string, position: number) {
    const id = `${type}-${Date.now()}`;
    const newStep: FlowStep = {
      id,
      type: type as FlowStep["type"],
      order: position,
      config: defaultConfig(type),
      position: { x: 300, y: position * 150 },
    };
    setSteps(prev => [...prev.slice(0, position), newStep, ...prev.slice(position)]);
  }

  function addToFlow(type: string) {
    // Insert before the last "end" step; fall back to appending
    let pos = steps.length;
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].type === "end") { pos = i; break; }
    }
    insertAt(type, pos);
  }

  function removeBlock(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id));
  }

  function updateBlock(id: string, config: Record<string, unknown>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, config } : s));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSavedOk(false);

    const finalSteps = toFinalSteps(steps);
    const edges = generateEdges(finalSteps);

    if (isNew && onSaveNew) {
      await onSaveNew(finalSteps, edges);
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/automations/${flow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps: finalSteps, edges }),
    });
    if (!res.ok) {
      setSaveError("Failed to save. Please try again.");
    } else {
      onAfterSave?.({ ...flow, steps: finalSteps, edges });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    }
    setSaving(false);
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">

      {/* ── Add-block toolbar ── */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-5 py-2.5 flex-shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mr-2">
          Add block
        </span>
        {INSERTABLE.map(({ type, label, Icon, cls }) => (
          <button
            key={type}
            onClick={() => addToFlow(type)}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${cls}`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {saveError && <span className="text-xs text-red-500">{saveError}</span>}
          {savedOk   && <span className="text-xs font-medium text-green-600">Saved ✓</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : isNew ? "Create Flow" : "Save Flow"}
          </button>
        </div>
      </div>

      {/* ── Steps list ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg py-6 px-4">
          {steps.map((step, idx) => (
            <div key={step.id}>
              {idx > 0 && (
                <InsertConnector onInsert={(type) => insertAt(type, idx)} />
              )}
              <StepCard
                step={step}
                onRemove={removeBlock}
                onUpdate={updateBlock}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer notice ── */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-2.5 flex items-center gap-2 text-xs text-gray-500">
        <input type="checkbox" checked disabled readOnly className="h-3 w-3 accent-amber-500 cursor-not-allowed" />
        <span>
          Each <strong className="font-medium text-gray-700">Email</strong>,{" "}
          <strong className="font-medium text-gray-700">SMS</strong>, and{" "}
          <strong className="font-medium text-gray-700">Call</strong> block includes a locked{" "}
          <strong className="font-medium text-gray-700">Check still unpaid in Xero</strong> safety check — enforced before every action fires.
        </span>
      </div>

    </div>
  );
}

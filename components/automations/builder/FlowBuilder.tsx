"use client";

import { useEffect, useRef, useState } from "react";
import {
  Save, Trash2, Plus, ChevronDown, ChevronUp, Eye, EyeOff,
  Mail, MessageSquare, Phone, Clock, Zap, Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallTemplateStore } from "@/lib/call-template-store";
import type { AutomationFlow, FlowEdge, FlowStep, CallTemplate } from "@/lib/types";

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEP_META: Record<string, { label: string; iconCls: string; canDelete: boolean }> = {
  trigger: { label: "Trigger",        iconCls: "bg-gray-900 text-white",    canDelete: false },
  email:   { label: "Send Email",     iconCls: "bg-blue-600 text-white",    canDelete: true  },
  sms:     { label: "Send SMS",       iconCls: "bg-purple-600 text-white",  canDelete: true  },
  call:    { label: "AI Call",        iconCls: "bg-green-600 text-white",   canDelete: true  },
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

// ── Merge tags ────────────────────────────────────────────────────────────────

const MERGE_TAGS = [
  { tag: "{{contact_name}}",     label: "Contact Name" },
  { tag: "{{invoice_number}}",   label: "Invoice #" },
  { tag: "{{invoice_amount}}",   label: "Amount" },
  { tag: "{{due_date}}",         label: "Due Date" },
  { tag: "{{days_overdue}}",     label: "Days Overdue" },
  { tag: "{{company_name}}",     label: "Company" },
  { tag: "{{customer_company}}", label: "Customer Co." },
  { tag: "{{payment_link}}",     label: "Pay Link" },
  { tag: "{{contact_email}}",    label: "Contact Email" },
  { tag: "{{accounts_email}}",   label: "Accounts Email" },
];

// ── Email preview helpers ─────────────────────────────────────────────────────

const PREVIEW_SAMPLE: Record<string, string> = {
  contact_name:     "James Fletcher",
  invoice_number:   "INV-2026-001",
  invoice_amount:   "$12,500.00",
  due_date:         "18 May 2026",
  days_overdue:     "15",
  company_name:     "Refresh The Web",
  customer_company: "Fletcher IT Solutions",
  payment_link:     "https://pay.collectpilot.demo/inv-001",
  contact_email:    "james.fletcher@fletcherit.com.au",
  accounts_email:   "accounts@refreshtheweb.com.au",
  // legacy keys
  contactName:    "James Fletcher",
  invoiceNumber:  "INV-2026-001",
  amount:         "$12,500.00",
  dueDate:        "18 May 2026",
  companyName:    "Refresh The Web",
};

function fillMerge(text: string, senderName = "Accounts Team"): string {
  let result = text ?? "";
  Object.entries(PREVIEW_SAMPLE).forEach(([key, val]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  });
  return result
    .replace(/\{\{senderName\}\}/g, senderName)
    .replace(/\{\{sender_name\}\}/g, senderName);
}

// ── Default configs ───────────────────────────────────────────────────────────

function defaultConfig(type: string): Record<string, unknown> {
  switch (type) {
    case "email":
      return {
        label: "Send Email",
        to: "contact",
        customEmail: "",
        subject: "",
        body: "",
        senderName: "",
        replyTo: "",
      };
    case "sms":
      return {
        label: "Send SMS",
        to: "contact",
        customPhone: "",
        template: "",
      };
    case "wait":
      return { label: "Wait", days: 3, unit: "days" };
    case "call":
      return {
        label: "AI Call",
        templateId: "TPL001",
        templateName: "Overdue Invoice AI Call",
        timing: "immediately",
        delayValue: 1,
        delayUnit: "hours",
        specificDateTime: "",
        notes: "",
      };
    case "trigger":
      return { label: "Invoice 7 days overdue", days: 7, triggerType: "days_overdue" };
    case "end":
      return { label: "End Automation" };
    default:
      return { label: type };
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

// ── Reusable form helpers ─────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none bg-white";
const selectCls = `${inputCls}`;
const textareaCls = `${inputCls} resize-none`;

// ── Merge tag bar ─────────────────────────────────────────────────────────────

function MergeTagBar({
  onInsert,
  focusedField,
}: {
  onInsert: (tag: string) => void;
  focusedField: string | null;
}) {
  return (
    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
      <div className="flex items-start gap-1.5 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 shrink-0 mt-0.5">
          <Tag className="h-3 w-3" />
          Insert:
        </span>
        {MERGE_TAGS.map(({ tag, label }) => (
          <button
            key={tag}
            type="button"
            title={tag}
            onMouseDown={(e) => {
              e.preventDefault(); // keep textarea focused so cursor position is preserved
              onInsert(tag);
            }}
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
              focusedField
                ? "border-blue-200 bg-white text-blue-700 hover:bg-blue-50 cursor-pointer"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100 cursor-pointer"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      {!focusedField && (
        <p className="text-[10px] text-gray-400 mt-1.5">
          Click a field above, then click a tag to insert it at the cursor position.
        </p>
      )}
    </div>
  );
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
    <div className="relative flex flex-col items-center py-0.5">
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

// ── XeroLock: locked safety checkbox shown on action blocks ───────────────────

function XeroLock() {
  return (
    <div className="border-t border-gray-100 bg-amber-50/50 px-4 py-2 flex items-center gap-2">
      <input type="checkbox" checked disabled readOnly className="h-3 w-3 accent-amber-500 cursor-not-allowed" />
      <span className="text-[11px] font-medium text-amber-700">Check still unpaid in Xero</span>
      <span className="text-[10px] text-amber-500">— required, cannot be disabled</span>
    </div>
  );
}

// ── Individual step card ──────────────────────────────────────────────────────

function StepCard({
  step,
  onRemove,
  onUpdate,
  callTemplates,
}: {
  step: FlowStep;
  onRemove: (id: string) => void;
  onUpdate: (id: string, config: Record<string, unknown>) => void;
  callTemplates: Record<string, CallTemplate>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(null);

  const fieldRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({});

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

  function bindField(key: string) {
    return {
      ref: (el: HTMLTextAreaElement | HTMLInputElement | null) => {
        fieldRefs.current[key] = el;
      },
      onFocus: () => setFocusedFieldKey(key),
    };
  }

  function insertMergeTag(tag: string) {
    const key = focusedFieldKey;
    if (!key) {
      // Default to body/template if nothing focused
      const fallback = step.type === "sms" ? "template" : step.type === "call" ? "notes" : "body";
      const el = fieldRefs.current[fallback];
      if (el) {
        const val = (cfg[fallback] as string) ?? "";
        set(fallback, val + tag);
      }
      return;
    }
    const el = fieldRefs.current[key];
    if (!el) {
      set(key, ((cfg[key] as string) ?? "") + tag);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = el.value;
    const newValue = current.substring(0, start) + tag + current.substring(end);
    const newCursor = start + tag.length;
    set(key, newValue);
    requestAnimationFrame(() => {
      const newEl = fieldRefs.current[key];
      if (newEl) {
        newEl.selectionStart = newEl.selectionEnd = newCursor;
        newEl.focus();
      }
    });
  }

  function subtitle(): string {
    if (isTrigger) {
      const t = (cfg.triggerType as string) ?? "days_overdue";
      if (t === "days_overdue") return `Invoice ${cfg.days ?? 7} days overdue`;
      if (t === "invoice_created") return "Invoice created";
      if (t === "reply_received") return "Reply received";
      return "Manual start";
    }
    if (isWait) {
      const unit = (cfg.unit as string) ?? "days";
      return `Wait ${cfg.days ?? 3} ${unit}`;
    }
    if (step.type === "call") {
      const templateName = (cfg.templateName as string) || "No template selected";
      const timing = (cfg.timing as string) ?? "immediately";
      const name = (cfg.label as string) || "AI Call";
      if (timing === "after_delay") return `${name} · ${templateName} — after ${cfg.delayValue ?? 1} ${cfg.delayUnit ?? "hours"}`;
      if (timing === "specific_time") return `${name} · ${templateName} — specific date/time`;
      return `${name} · ${templateName}`;
    }
    if (step.type === "email") {
      const to = (cfg.to as string) ?? "contact";
      const dest = to === "billing" ? "billing contact" : to === "custom" ? (cfg.customEmail as string) || "custom email" : "invoice contact";
      return `${(cfg.label as string) || "Send Email"} → ${dest}`;
    }
    if (step.type === "sms") {
      const to = (cfg.to as string) ?? "contact";
      const dest = to === "billing" ? "billing contact" : to === "custom" ? (cfg.customPhone as string) || "custom number" : "invoice contact";
      return `${(cfg.label as string) || "Send SMS"} → ${dest}`;
    }
    return (cfg.label as string) || meta.label;
  }

  const showMergeTags = expanded && (step.type === "email" || step.type === "sms" || step.type === "call");

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-shadow ${expanded ? "border-blue-300 shadow-md" : "border-gray-200"}`}>

      {/* ── Header row ── */}
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
              onClick={() => { setExpanded(p => !p); if (expanded) { setShowPreview(false); setFocusedFieldKey(null); } }}
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

      {/* ── Xero safety checkbox ── */}
      {isAction && <XeroLock />}

      {/* ── Inline edit panel ── */}
      {expanded && !isEnd && (
        <div className="border-t border-blue-100 bg-blue-50/20 px-4 py-3 space-y-3">

          {/* ════ TRIGGER ════ */}
          {isTrigger && (
            <>
              <FieldRow label="Trigger type">
                <select value={(cfg.triggerType as string) ?? "days_overdue"} onChange={e => set("triggerType", e.target.value)} className={selectCls}>
                  <option value="days_overdue">Invoice overdue by X days</option>
                  <option value="invoice_created">Invoice created</option>
                  <option value="reply_received">Reply received</option>
                  <option value="manual">Manual start</option>
                </select>
              </FieldRow>
              {(!cfg.triggerType || cfg.triggerType === "days_overdue") && (
                <FieldRow label="Days overdue">
                  <input
                    type="number"
                    min={1}
                    value={(cfg.days as number) ?? 7}
                    onChange={e => set("days", parseInt(e.target.value) || 1)}
                    className="w-24 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                  />
                </FieldRow>
              )}
            </>
          )}

          {/* ════ DELAY ════ */}
          {isWait && (
            <>
              <FieldRow label="Label">
                <input type="text" value={(cfg.label as string) ?? ""} onChange={e => set("label", e.target.value)} placeholder="e.g. Wait before next contact" className={inputCls} />
              </FieldRow>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Delay amount</label>
                  <input
                    type="number"
                    min={1}
                    value={(cfg.days as number) ?? 3}
                    onChange={e => set("days", parseInt(e.target.value) || 1)}
                    className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                    placeholder="3"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Unit</label>
                  <select value={(cfg.unit as string) ?? "days"} onChange={e => set("unit", e.target.value)} className={selectCls}>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 -mt-1">
                e.g. Wait 3 days · Wait 4 hours · Wait 30 minutes · Wait 1 week
              </p>
            </>
          )}

          {/* ════ EMAIL ════ */}
          {step.type === "email" && (
            <>
              <FieldRow label="Label / Name">
                <input type="text" value={(cfg.label as string) ?? ""} onChange={e => set("label", e.target.value)} placeholder="e.g. Gentle Reminder" className={inputCls} />
              </FieldRow>

              <FieldRow label="Recipient">
                <select value={(cfg.to as string) ?? "contact"} onChange={e => set("to", e.target.value)} className={selectCls}>
                  <option value="contact">Invoice contact email</option>
                  <option value="billing">Billing contact email</option>
                  <option value="custom">Custom email address</option>
                </select>
              </FieldRow>
              {cfg.to === "custom" && (
                <FieldRow label="Custom email address">
                  <input type="email" value={(cfg.customEmail as string) ?? ""} onChange={e => set("customEmail", e.target.value)} placeholder="billing@example.com" className={inputCls} />
                </FieldRow>
              )}

              <FieldRow label="Subject line">
                <input
                  {...bindField("subject")}
                  type="text"
                  value={(cfg.subject as string) ?? ""}
                  onChange={e => set("subject", e.target.value)}
                  placeholder="e.g. Friendly reminder — Invoice {{invoice_number}} is overdue"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Email body">
                <textarea
                  {...bindField("body")}
                  value={(cfg.body as string) ?? ""}
                  onChange={e => set("body", e.target.value)}
                  rows={6}
                  placeholder={`Hi {{contact_name}},\n\nJust a friendly reminder that Invoice {{invoice_number}} for {{invoice_amount}} was due on {{due_date}} and remains outstanding.\n\nKind regards,\n{{company_name}}`}
                  className={textareaCls}
                />
              </FieldRow>

              <MergeTagBar onInsert={insertMergeTag} focusedField={focusedFieldKey} />

              <div className="grid grid-cols-2 gap-2">
                <FieldRow label="Sender name">
                  <input type="text" value={(cfg.senderName as string) ?? ""} onChange={e => set("senderName", e.target.value)} placeholder="Accounts Team" className={inputCls} />
                </FieldRow>
                <FieldRow label="Reply-to email (optional)">
                  <input type="email" value={(cfg.replyTo as string) ?? ""} onChange={e => set("replyTo", e.target.value)} placeholder="accounts@yourbiz.com" className={inputCls} />
                </FieldRow>
              </div>

              {/* Preview toggle */}
              <button
                onClick={() => setShowPreview(p => !p)}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPreview ? "Hide preview" : "Preview email"}
              </button>

              {showPreview && (
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden text-xs">
                  <p className="px-3 py-1.5 text-[10px] text-gray-400 italic border-b border-gray-100 bg-gray-50">
                    Preview using sample data — merge fields replaced with dummy values
                  </p>
                  <div className="px-3 py-2 border-b border-gray-100 space-y-1">
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-16 shrink-0">From:</span>
                      <span className="text-gray-700">{(cfg.senderName as string) || "Accounts Team"}</span>
                    </div>
                    {Boolean(cfg.replyTo) && (
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-16 shrink-0">Reply-to:</span>
                        <span className="text-gray-700">{cfg.replyTo as string}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-16 shrink-0">To:</span>
                      <span className="text-gray-700">james.fletcher@fletcherit.com.au</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-16 shrink-0">Subject:</span>
                      <span className="font-medium text-gray-900">
                        {fillMerge((cfg.subject as string) || "(no subject)", (cfg.senderName as string) || "")}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed">
                      {fillMerge(
                        (cfg.body as string) || "(No body — type your message above)",
                        (cfg.senderName as string) || ""
                      )}
                    </pre>
                  </div>
                  <p className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100 text-center">
                    Links are not active in this prototype.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ════ SMS ════ */}
          {step.type === "sms" && (
            <>
              <FieldRow label="Label / Name">
                <input type="text" value={(cfg.label as string) ?? ""} onChange={e => set("label", e.target.value)} placeholder="e.g. SMS Reminder" className={inputCls} />
              </FieldRow>

              <FieldRow label="Recipient">
                <select value={(cfg.to as string) ?? "contact"} onChange={e => set("to", e.target.value)} className={selectCls}>
                  <option value="contact">Invoice contact phone</option>
                  <option value="billing">Billing contact phone</option>
                  <option value="custom">Custom phone number</option>
                </select>
              </FieldRow>
              {cfg.to === "custom" && (
                <FieldRow label="Custom phone number">
                  <input type="tel" value={(cfg.customPhone as string) ?? ""} onChange={e => set("customPhone", e.target.value)} placeholder="+61 400 000 000" className={inputCls} />
                </FieldRow>
              )}

              <FieldRow label="SMS message">
                <textarea
                  {...bindField("template")}
                  value={(cfg.template as string) ?? ""}
                  onChange={e => set("template", e.target.value)}
                  rows={4}
                  placeholder={`Hi {{contact_name}}, this is a reminder that Invoice {{invoice_number}} for {{invoice_amount}} is overdue. Please contact {{company_name}} to arrange payment.`}
                  className={textareaCls}
                />
              </FieldRow>

              <MergeTagBar onInsert={insertMergeTag} focusedField={focusedFieldKey} />
            </>
          )}

          {/* ════ CALL ════ */}
          {step.type === "call" && (
            <>
              <FieldRow label="Label / Task name">
                <input type="text" value={(cfg.label as string) ?? ""} onChange={e => set("label", e.target.value)} placeholder="e.g. AI Follow-up Call" className={inputCls} />
              </FieldRow>

              <FieldRow label="Call Template">
                <select
                  value={(cfg.templateId as string) ?? ""}
                  onChange={e => {
                    const tid = e.target.value;
                    const tmpl = callTemplates[tid];
                    set("templateId", tid);
                    set("templateName", tmpl?.name ?? "");
                  }}
                  className={selectCls}
                >
                  <option value="">— Select a template —</option>
                  {Object.values(callTemplates).map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                  ))}
                </select>
              </FieldRow>
              {(cfg.templateId as string) && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] text-green-700">
                  Template selected: <strong>{(cfg.templateName as string) || (cfg.templateId as string)}</strong>. The AI caller will use this script.
                </div>
              )}

              <FieldRow label="Call timing">
                <select value={(cfg.timing as string) ?? "immediately"} onChange={e => set("timing", e.target.value)} className={selectCls}>
                  <option value="immediately">Immediately after previous step</option>
                  <option value="after_delay">After a delay</option>
                  <option value="specific_time">Specific date / time</option>
                </select>
              </FieldRow>

              {cfg.timing === "after_delay" && (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Delay amount</label>
                    <input type="number" min={1} value={(cfg.delayValue as number) ?? 1} onChange={e => set("delayValue", parseInt(e.target.value) || 1)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
                  </div>
                  <div className="w-32">
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Unit</label>
                    <select value={(cfg.delayUnit as string) ?? "hours"} onChange={e => set("delayUnit", e.target.value)} className={selectCls}>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}

              {cfg.timing === "specific_time" && (
                <FieldRow label="Date and time">
                  <input type="datetime-local" value={(cfg.specificDateTime as string) ?? ""} onChange={e => set("specificDateTime", e.target.value)} className={inputCls} />
                  <p className="text-[10px] text-gray-400 mt-1">Prototype only — not enforced at runtime.</p>
                </FieldRow>
              )}

              <FieldRow label="Call notes / context">
                <textarea
                  {...bindField("notes")}
                  value={(cfg.notes as string) ?? ""}
                  onChange={e => set("notes", e.target.value)}
                  rows={3}
                  placeholder="Key invoice details, any payment arrangements or disputes to reference…"
                  className={textareaCls}
                />
              </FieldRow>

              <MergeTagBar onInsert={insertMergeTag} focusedField={focusedFieldKey} />
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

  const callTemplates = useCallTemplateStore((s) => s.templates);

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
    const updatedFlow = { ...flow, steps: finalSteps, edges };

    if (isNew && onSaveNew) {
      await onSaveNew(finalSteps, edges);
      setSaving(false);
      return;
    }

    // Always persist to Zustand/localStorage first — this is the source of truth
    onAfterSave?.(updatedFlow);

    // Attempt server sync (works for seeded flows FLOW001–003; 404 expected for client-created ones)
    try {
      const res = await fetch(`/api/automations/${flow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: finalSteps, edges }),
      });
      if (!res.ok && res.status !== 404) {
        setSaveError("Saved locally. Server sync failed — changes are still preserved.");
      }
    } catch {
      // Network error — local save already succeeded
    }

    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
    setSaving(false);
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">

      {/* ── Add-block toolbar ── */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-5 py-2.5 flex-shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mr-2">Add block</span>
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
          {saveError && <span className="text-xs text-amber-600">{saveError}</span>}
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
                callTemplates={callTemplates}
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
          <strong className="font-medium text-gray-700">AI Call</strong> block includes a locked{" "}
          <strong className="font-medium text-amber-600">Check still unpaid in Xero</strong> safety check — enforced before every action fires.
        </span>
      </div>

    </div>
  );
}

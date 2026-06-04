"use client";

import { useEffect, useRef, useState } from "react";
import {
  Phone, Plus, ChevronDown, ChevronUp, Trash2, Save,
  CheckCircle, Clock, Mic, Tag, X, AlertCircle,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { useCallTemplateStore, SEEDED_TEMPLATE_IDS } from "@/lib/call-template-store";
import { useNavGuardStore } from "@/lib/nav-guard-store";
import type { CallTemplate, CallTemplateStatus } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<CallTemplateStatus, { label: string; cls: string; Icon: React.ElementType }> = {
  active: { label: "Active", cls: "border-green-200 bg-green-100 text-green-700", Icon: CheckCircle },
  draft:  { label: "Draft",  cls: "border-gray-200 bg-gray-100 text-gray-600",   Icon: Clock },
};

const MERGE_TAGS = [
  // Contact
  "{{contact_name}}", "{{company_name}}", "{{customer_company}}",
  "{{contact_email}}", "{{accounts_email}}", "{{payment_link}}",
  // Customer account (multi-invoice)
  "{{total_overdue_balance}}", "{{overdue_invoice_count}}",
  "{{max_days_overdue}}", "{{most_overdue_invoice_number}}",
  "{{invoice_list}}", "{{invoice_summary_table}}",
  // Single invoice fallback
  "{{invoice_number}}", "{{invoice_amount}}", "{{due_date}}", "{{days_overdue}}",
];

const inputCls = "w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-blue-400 focus:outline-none bg-white";
const textareaCls = `${inputCls} resize-none leading-relaxed`;

function generateId() {
  return `TPL-${Date.now()}`;
}

function emptyTemplate(): CallTemplate {
  return {
    id: generateId(),
    name: "",
    status: "draft",
    category: "Overdue invoice follow-up",
    disclosure: "Hi, I'm an AI accounts receivable assistant calling on behalf of {{company_name}}. This is an automated and recorded business call regarding an outstanding invoice.",
    prompt: "",
    outcomeClassifications: [
      "Promise to pay",
      "Already paid",
      "Dispute raised",
      "Needs human follow-up",
      "Voicemail",
    ],
    voicemailBehavior: "Keep the message under 20 seconds. Do not mention sensitive financial details. State the company name, invoice follow-up purpose, and callback/contact method only.",
    escalationRules: "Escalate to human review if a dispute is raised, the customer becomes frustrated, or the call outcome is ambiguous.",
    createdAt: new Date().toISOString(),
  };
}

// ── Template card (view + inline edit) ───────────────────────────────────────

function TemplateCard({
  template,
  onSave,
  onDelete,
  defaultExpanded,
  defaultEditing,
}: {
  template: CallTemplate;
  onSave: (t: CallTemplate) => void;
  onDelete: (id: string) => void;
  defaultExpanded?: boolean;
  defaultEditing?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [editing, setEditing] = useState(defaultEditing ?? false);
  const [draft, setDraft] = useState<CallTemplate>(template);
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(null);
  const [outcomeInput, setOutcomeInput] = useState("");
  const [collapseConfirm, setCollapseConfirm] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const fieldRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const { setDirty } = useNavGuardStore();

  const isDirty = editing && JSON.stringify(draft) !== JSON.stringify(template);

  // Reset prompt accordion when entering edit mode
  useEffect(() => {
    if (editing) setShowPrompt(false);
  }, [editing]);

  // Sync global dirty state when editing starts/stops
  useEffect(() => {
    if (editing) setDirty(true, "call-templates");
    else setDirty(false);
    return () => { setDirty(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Browser-level guard when dirty
  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  function bindField(key: string) {
    return {
      ref: (el: HTMLTextAreaElement | null) => { fieldRefs.current[key] = el; },
      onFocus: () => setFocusedFieldKey(key),
    };
  }

  function insertMergeTag(tag: string) {
    const key = focusedFieldKey ?? "prompt";
    const el = fieldRefs.current[key];
    const current = (draft[key as keyof CallTemplate] as string) ?? "";
    if (!el) {
      field(key as keyof CallTemplate, current + tag);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const newValue = current.substring(0, start) + tag + current.substring(end);
    const newCursor = start + tag.length;
    field(key as keyof CallTemplate, newValue);
    requestAnimationFrame(() => {
      const newEl = fieldRefs.current[key];
      if (newEl) { newEl.selectionStart = newEl.selectionEnd = newCursor; newEl.focus(); }
    });
  }

  const cfg = statusConfig[template.status] ?? statusConfig.draft;
  const StatusIcon = cfg.Icon;

  function field(key: keyof CallTemplate, value: unknown) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function removeOutcome(outcome: string) {
    setDraft(prev => ({
      ...prev,
      outcomeClassifications: prev.outcomeClassifications.filter(o => o !== outcome),
    }));
  }

  function addOutcome() {
    const trimmed = outcomeInput.trim();
    if (!trimmed || draft.outcomeClassifications.includes(trimmed)) {
      setOutcomeInput("");
      return;
    }
    setDraft(prev => ({
      ...prev,
      outcomeClassifications: [...prev.outcomeClassifications, trimmed],
    }));
    setOutcomeInput("");
  }

  function handleSave() {
    onSave(draft);
    setEditing(false);
    setCollapseConfirm(false);
  }

  function handleCancel() {
    setDraft(template);
    setEditing(false);
    setCollapseConfirm(false);
    setOutcomeInput("");
  }

  function handleCollapseClick() {
    if (editing && isDirty) {
      setCollapseConfirm(true);
      return;
    }
    if (editing) {
      // No unsaved changes — just cancel edit and collapse
      handleCancel();
    }
    setExpanded(p => !p);
    setCollapseConfirm(false);
  }

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-shadow ${expanded ? "border-blue-300 shadow-md" : "border-gray-200"}`}>

      {/* ── Header — clicking the info area expands/collapses ── */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon — also triggers expand on click */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-600 cursor-pointer"
          onClick={handleCollapseClick}
        >
          <Mic className="h-4 w-4 text-white" />
        </div>

        {/* Info area — clickable to expand/collapse */}
        <div
          className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleCollapseClick}
        >
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-gray-900 truncate">{template.name || "Untitled Template"}</p>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
              <StatusIcon className="h-2.5 w-2.5" />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-400">{template.category}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {template.outcomeClassifications.length} outcome classifications
          </p>
        </div>

        {/* Buttons — stopPropagation so they don't also trigger expand */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!editing && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true); setCollapseConfirm(false); }}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleCollapseClick(); }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {!SEEDED_TEMPLATE_IDS.has(template.id) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${template.name}"?`)) onDelete(template.id);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500"
              title="Delete template"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Unsaved changes collapse confirmation ── */}
      {collapseConfirm && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2 flex-wrap">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 flex-1 min-w-0">You have unsaved changes.</span>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Save className="h-3 w-3" />
            Save
          </button>
          <button
            onClick={() => { handleCancel(); setExpanded(false); }}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Discard
          </button>
          <button
            onClick={() => setCollapseConfirm(false)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
          >
            Continue editing
          </button>
        </div>
      )}

      {/* ── Expanded view / edit panel ── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">

          {/* Merge tag bar */}
          <div className="rounded-md border border-dashed border-gray-200 bg-white px-3 py-2">
            <div className="flex items-start gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 shrink-0 mt-0.5">
                <Tag className="h-3 w-3" />
                {editing ? "Insert:" : "Available merge tags:"}
              </span>
              {MERGE_TAGS.map(tag => editing ? (
                <button
                  key={tag}
                  type="button"
                  title={tag}
                  onMouseDown={(e) => { e.preventDefault(); insertMergeTag(tag); }}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                    focusedFieldKey
                      ? "border-blue-200 bg-white text-blue-700 hover:bg-blue-50 cursor-pointer"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  {tag}
                </button>
              ) : (
                <span key={tag} className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500">{tag}</span>
              ))}
            </div>
            {editing && !focusedFieldKey && (
              <p className="text-[10px] text-gray-400 mt-1.5">
                Click a field below, then click a tag to insert it at the cursor position.
              </p>
            )}
          </div>

          {/* Template name + status */}
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Template name</label>
                <input type="text" value={draft.name} onChange={e => field("name", e.target.value)} placeholder="e.g. Overdue Invoice AI Call" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Status</label>
                <select value={draft.status} onChange={e => field("status", e.target.value as CallTemplateStatus)} className={inputCls}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-400">Name:</span> <span className="text-gray-700 font-medium">{template.name}</span></div>
              <div><span className="text-gray-400">Status:</span> <span className="text-gray-700 font-medium capitalize">{template.status}</span></div>
            </div>
          )}

          {/* Category */}
          {editing ? (
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Use case / category</label>
              <input type="text" value={draft.category} onChange={e => field("category", e.target.value)} placeholder="e.g. Overdue invoice follow-up" className={inputCls} />
            </div>
          ) : (
            <div className="text-xs"><span className="text-gray-400">Category:</span> <span className="text-gray-700">{template.category}</span></div>
          )}

          {/* Opening disclosure */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Opening disclosure</label>
            {editing ? (
              <textarea {...bindField("disclosure")} value={draft.disclosure} onChange={e => field("disclosure", e.target.value)} rows={3} className={textareaCls} placeholder="The first words the AI caller will say…" />
            ) : (
              <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 leading-relaxed">{template.disclosure}</div>
            )}
          </div>

          {/* Main prompt */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Main AI prompt / instructions</label>
            {editing ? (
              <textarea {...bindField("prompt")} value={draft.prompt} onChange={e => field("prompt", e.target.value)} rows={14} className={textareaCls} placeholder="Full prompt instructions for the AI caller…" />
            ) : (
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <button onClick={() => setShowPrompt(v => !v)} className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left transition-colors">
                  <span className="text-xs font-medium text-gray-600">View AI prompt</span>
                  <span className="text-gray-400 text-xs">{showPrompt ? "▲" : "▼"}</span>
                </button>
                {showPrompt && <div className="max-h-48 overflow-y-auto px-3 py-2 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-white">{template.prompt}</div>}
              </div>
            )}
          </div>

          {/* Outcome classifications */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Outcome classifications</label>
            {editing ? (
              <div className="space-y-2">
                {/* Editable chips */}
                <div className="flex flex-wrap gap-1.5">
                  {draft.outcomeClassifications.map(outcome => (
                    <span
                      key={outcome}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 pl-2.5 pr-1.5 py-1 text-[11px] font-medium text-blue-700"
                    >
                      {outcome}
                      <button
                        type="button"
                        onClick={() => removeOutcome(outcome)}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-700 transition-colors"
                        title={`Remove "${outcome}"`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                {/* Add outcome input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={outcomeInput}
                    onChange={e => setOutcomeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOutcome(); } }}
                    placeholder="Add outcome classification…"
                    className="flex-1 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none bg-white placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={addOutcome}
                    disabled={!outcomeInput.trim()}
                    className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                {draft.outcomeClassifications.length === 0 && (
                  <p className="text-[10px] text-amber-600">At least one outcome classification is recommended.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {template.outcomeClassifications.map(outcome => (
                  <span key={outcome} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">{outcome}</span>
                ))}
                {template.outcomeClassifications.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No outcome classifications defined.</span>
                )}
              </div>
            )}
          </div>

          {/* Voicemail behavior */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Voicemail behavior</label>
            {editing ? (
              <textarea {...bindField("voicemailBehavior")} value={draft.voicemailBehavior} onChange={e => field("voicemailBehavior", e.target.value)} rows={3} className={textareaCls} />
            ) : (
              <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 leading-relaxed">{template.voicemailBehavior}</div>
            )}
          </div>

          {/* Escalation rules */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Escalation / pause rules</label>
            {editing ? (
              <textarea {...bindField("escalationRules")} value={draft.escalationRules} onChange={e => field("escalationRules", e.target.value)} rows={3} className={textareaCls} />
            ) : (
              <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 leading-relaxed">{template.escalationRules}</div>
            )}
          </div>

          {/* Save / cancel */}
          {editing && (
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Save className="h-3.5 w-3.5" />
                Save Template
              </button>
              <button
                onClick={handleCancel}
                className="rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create template modal ─────────────────────────────────────────────────────

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: CallTemplate) => void }) {
  const [name, setName] = useState("");

  function handleCreate() {
    const t = emptyTemplate();
    onCreate({ ...t, name: name.trim() || "New Template" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">New Call Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Give your template a name. It will be created as a <span className="font-medium text-gray-700">Draft</span> and open in the editor.
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Template name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") onClose(); }}
            placeholder="e.g. Payment Reminder Call"
            autoFocus
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CallTemplatesPage() {
  const { templates, upsert, remove } = useCallTemplateStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const sorted = Object.values(templates).sort((a, b) => {
    const aSeeded = SEEDED_TEMPLATE_IDS.has(a.id);
    const bSeeded = SEEDED_TEMPLATE_IDS.has(b.id);
    if (aSeeded && bSeeded) return a.id.localeCompare(b.id);
    if (aSeeded) return -1;
    if (bSeeded) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function handleCreate(t: CallTemplate) {
    upsert(t);
    setNewlyCreatedId(t.id);
    setModalOpen(false);
  }

  return (
    <div>
      {modalOpen && <CreateModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />}

      <TopBar
        title="Call Templates"
        subtitle={`${sorted.length} template${sorted.length !== 1 ? "s" : ""}`}
        description="Manage AI call scripts, disclosures, outcomes, and follow-up instructions."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            title="Create Call Template"
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2 sm:px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Create Call Template</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">

        {/* Info banners */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <Phone className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-0.5">AI Call Templates — Prototype</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Templates define the AI caller&apos;s script, disclosure, outcome classifications, and escalation rules.
              Select a template in an Automation Builder <strong>Call</strong> block to assign it to a flow step.
              No real calls are made in this prototype.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Important:</strong> Before deploying AI calls in production, your disclosure and prompt must comply with Australian telecommunications regulations and ACCC guidelines for automated business calls.
            This is a UI prototype only — no real AI calling infrastructure is connected.
          </p>
        </div>

        {/* Template list */}
        <div className="space-y-3">
          {sorted.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSave={upsert}
              onDelete={remove}
              defaultExpanded={template.id === newlyCreatedId}
              defaultEditing={template.id === newlyCreatedId}
            />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <Phone className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No call templates yet.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 text-xs text-blue-500 hover:underline"
            >
              Create your first template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

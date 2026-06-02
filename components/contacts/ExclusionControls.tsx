"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertTriangle, CheckCircle2, Pencil, X, ChevronDown } from "lucide-react";
import type { ContactStatus } from "@/lib/types";

const statusOptions: { value: ContactStatus; label: string; description: string; color: string }[] = [
  { value: "active", label: "Active - follow-ups allowed", description: "Send automated follow-ups normally", color: "border-green-200 bg-green-50 text-green-700" },
  { value: "on_hold", label: "On Hold - automations paused", description: "Pause automations — payment plan or arrangement active", color: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "excluded", label: "Excluded - no automations", description: "Block all automations — legal dispute or do-not-contact", color: "border-red-200 bg-red-50 text-red-700" },
];

interface ExclusionControlsProps {
  contactId: string;
  currentStatus: ContactStatus;
}

export function ExclusionControls({ contactId, currentStatus }: ExclusionControlsProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);   // collapsed by default
  const [selected, setSelected]   = useState<ContactStatus>(currentStatus);
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [editing, setEditing]     = useState(false);

  async function handleSave() {
    setSaving(true);
    const body: Record<string, unknown> = { status: selected };
    if (notes.trim()) body.notes = notes.trim();
    await fetch(`/api/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditing(false);
    setCollapsed(true);   // collapse back after saving
    router.refresh();
  }

  function handleCancel() {
    setSelected(currentStatus);
    setNotes("");
    setEditing(false);
    setCollapsed(true);   // collapse back on cancel
  }

  // ── Collapsed state — tap to expand ──────────────────────────────────────
  if (collapsed && !editing) {
    const statusLabel = statusOptions.find((o) => o.value === selected)?.label ?? selected;
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900">Automation Status</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500 truncate max-w-[120px]">{statusLabel}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </button>
      </div>
    );
  }

  // ── Expanded summary (not editing) ────────────────────────────────────────
  if (!editing) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Collapse header */}
        <button
          onClick={() => setCollapsed(true)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900">Automation Status</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 rotate-180" />
        </button>
        {/* Summary + Edit */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-gray-800">
                {statusOptions.find((o) => o.value === selected)?.label ?? selected}
              </p>
              <p className="text-xs text-gray-400">
                {selected === "active"
                  ? "Automated follow-ups are allowed for this contact."
                  : selected === "on_hold"
                  ? "Automations are paused — a payment arrangement may be active."
                  : "All automated contact is blocked for this contact."}
              </p>
            </div>
            <button
              onClick={() => { setEditing(true); setCollapsed(false); }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Automation Status</h3>
        </div>
        <button
          onClick={handleCancel}
          className="flex items-center justify-center rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Cancel editing"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {statusOptions.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              selected === opt.value ? opt.color : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <input
              type="radio"
              name="status"
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => setSelected(opt.value)}
              className="mt-0.5 h-3.5 w-3.5 accent-blue-600"
            />
            <div>
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>

      {selected === "excluded" && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700">Contact excluded from all automations</p>
              <p className="text-xs text-red-600 mt-0.5">
                All scheduled emails, SMS, and calls will be blocked for this contact.
              </p>
            </div>
          </div>
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add a note explaining this status change (optional)"
        rows={2}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-blue-400 focus:outline-none resize-none mb-3"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || selected === currentStatus}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save Changes"
          )}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

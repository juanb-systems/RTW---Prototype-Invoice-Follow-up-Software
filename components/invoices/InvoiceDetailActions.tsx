"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, GitBranch, CheckCircle2, XCircle, ChevronDown, Pencil, X } from "lucide-react";
import type { AutomationFlow } from "@/lib/types";

interface InvoiceDetailActionsProps {
  invoiceId: string;
  currentStatus: string;
  excludedFromAutomation: boolean;
  flows: AutomationFlow[];
  assignedFlowId: string | null;
  assignedFlowDescription?: string | null;
}

export function InvoiceDetailActions({
  invoiceId,
  excludedFromAutomation,
  flows,
  assignedFlowId,
  assignedFlowDescription,
}: InvoiceDetailActionsProps) {
  const router = useRouter();
  const [editing, setEditing]         = useState(false);
  const [excluded, setExcluded]       = useState(excludedFromAutomation);
  const [selectedFlow, setSelectedFlow] = useState(assignedFlowId ?? "");
  const [saving, setSaving]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const assignedFlowName = flows.find(f => f.id === selectedFlow)?.name;

  async function toggleExclusion() {
    if (!excluded) { setShowConfirm(true); return; }
    await applyExclusion(false);
  }

  async function applyExclusion(newValue: boolean) {
    setSaving(true);
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludedFromAutomation: newValue }),
    });
    setExcluded(newValue);
    setSaving(false);
    setShowConfirm(false);
    router.refresh();
  }

  async function assignFlow() {
    setSaving(true);
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedFlowId: selectedFlow || null }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  // ── Summary (default, read-only) ──────────────────────────────────────────
  if (!editing) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Automation</h3>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <GitBranch className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {assignedFlowName ?? "No automation assigned"}
              </p>
              {assignedFlowDescription && (
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                  {assignedFlowDescription}
                </p>
              )}
            </div>
          </div>
          {excluded && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Excluded from all automations</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit Automation</h3>
        <button
          onClick={() => { setEditing(false); setShowConfirm(false); }}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Assign automation flow */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          <GitBranch className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
          Assign Automation
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={selectedFlow}
              onChange={(e) => setSelectedFlow(e.target.value)}
              className="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
            >
              <option value="">No automation</option>
              {flows.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          </div>
          <button
            onClick={assignFlow}
            disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Exclude toggle */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
          <Shield className="h-3.5 w-3.5 text-gray-400" />
          Exclude from Automations
        </p>

        {!showConfirm ? (
          <button
            onClick={toggleExclusion}
            disabled={saving}
            className={`w-full rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              excluded
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {excluded ? (
              <><CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />Re-enable automations</>
            ) : (
              <><XCircle className="inline h-3.5 w-3.5 mr-1" />Exclude from all automations</>
            )}
          </button>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
            <p className="text-xs text-amber-700 font-medium">Exclude this invoice from all automations?</p>
            <p className="text-xs text-amber-600">No automated emails, SMS, or calls will be sent.</p>
            <div className="flex gap-2">
              <button onClick={() => applyExclusion(true)} className="flex-1 rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700">
                Yes, exclude
              </button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}
        {excluded && !showConfirm && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            This invoice is excluded from all automations
          </p>
        )}
      </div>
    </div>
  );
}

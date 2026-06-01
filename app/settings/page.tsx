"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Info,
} from "lucide-react";

type Settings = {
  manualApprovalMode: boolean;
  lookupOnEveryAction: boolean;
  blockedKeywords: string[];
  defaultSenderName: string;
  defaultSenderEmail: string;
  companyName: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function save(patch: Partial<Settings>) {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    setSettings(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addKeyword() {
    if (!newKeyword.trim() || !settings) return;
    const updated = [...settings.blockedKeywords, newKeyword.trim().toLowerCase()];
    setSettings({ ...settings, blockedKeywords: updated });
    save({ blockedKeywords: updated });
    setNewKeyword("");
  }

  function removeKeyword(kw: string) {
    if (!settings) return;
    const updated = settings.blockedKeywords.filter((k) => k !== kw);
    setSettings({ ...settings, blockedKeywords: updated });
    save({ blockedKeywords: updated });
  }

  if (!settings) {
    return (
      <div>
        <TopBar title="Settings" />
        <div className="p-6 flex justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Settings"
        description="Configure safety rules, sender details, lookup checks, and blocked keywords."
        actions={
          saved ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </div>
          ) : undefined
        }
      />
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        {/* Manual Approval Mode */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${settings.manualApprovalMode ? "bg-blue-100" : "bg-gray-100"}`}>
                <Shield className={`h-5 w-5 ${settings.manualApprovalMode ? "text-blue-600" : "text-gray-400"}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Manual Approval Mode</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Require human approval before any automated action is sent
                </p>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => save({ manualApprovalMode: !settings.manualApprovalMode })}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                settings.manualApprovalMode ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  settings.manualApprovalMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {settings.manualApprovalMode ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700">Manual approval mode is enabled</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  All future scheduled actions will require human approval in the Scheduled Actions page
                  before being sent. The fresh lookup will still run at the time of approval.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 flex items-start gap-2">
              <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                Actions will fire automatically after passing the fresh lookup. Enable this to review
                every action before it is sent.
              </p>
            </div>
          )}
        </div>

        {/* Lookup Settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
              <RefreshCw className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Lookup Settings</h3>
              <p className="text-xs text-gray-500 mt-0.5">Control how fresh lookups are performed</p>
            </div>
          </div>

          <label className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3">
            <div>
              <p className="text-xs font-medium text-gray-700">Run lookup before every action</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Check invoice status, contact exclusions, and promises before each send action.
                Disabling this may cause actions to fire on paid or disputed invoices.
              </p>
            </div>
            <button
              onClick={() => save({ lookupOnEveryAction: !settings.lookupOnEveryAction })}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                settings.lookupOnEveryAction ? "bg-amber-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  settings.lookupOnEveryAction ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          {!settings.lookupOnEveryAction && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <p className="text-xs text-red-700 font-medium">
                Warning: Actions may fire on paid or disputed invoices without fresh lookups.
              </p>
            </div>
          )}
        </div>

        {/* Blocked Keywords */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Blocked Keywords</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                When these keywords appear in contact notes, automations are blocked
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {settings.blockedKeywords.map((kw) => (
              <div
                key={kw}
                className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(kw)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {settings.blockedKeywords.length === 0 && (
              <p className="text-xs text-gray-400">No blocked keywords configured.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              placeholder="Add keyword (e.g. legal, court)"
              className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
            />
            <button
              onClick={addKeyword}
              className="flex items-center gap-1 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* Sender settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sender Details</h3>
          <div className="space-y-3">
            {[
              { key: "companyName", label: "Company Name", type: "text" },
              { key: "defaultSenderName", label: "Default Sender Name", type: "text" },
              { key: "defaultSenderEmail", label: "Default Sender Email", type: "email" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={(settings[field.key as keyof Settings] as string) ?? ""}
                  onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  onBlur={() => save({ [field.key]: settings[field.key as keyof Settings] })}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

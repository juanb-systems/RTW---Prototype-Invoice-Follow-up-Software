"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { TopBar } from "@/components/layout/TopBar";
import { usePreferencesStore } from "@/lib/preferences-store";
import {
  Shield, RefreshCw, AlertTriangle, CheckCircle2, X, Plus, Info,
  Sun, Moon, Monitor, Bell, Volume2, Mail, Building2, User, Zap, Phone, Users, Rocket, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Server-side settings type ─────────────────────────────────────────────────

type AppSettings = {
  manualApprovalMode: boolean;
  lookupOnEveryAction: boolean;
  blockedKeywords: string[];
  defaultSenderName: string;
  defaultSenderEmail: string;
  companyName: string;
};

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, disabled = false, color = "blue",
}: {
  checked: boolean; onChange: () => void; disabled?: boolean; color?: "blue" | "amber";
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? (color === "amber" ? "bg-amber-500" : "bg-blue-600") : "bg-gray-200"
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
        checked ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  const { compactMode, notificationSounds, emailDigest,
          setCompactMode, setNotificationSounds, setEmailDigest } = usePreferencesStore();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(setSettings);
  }, []);

  async function save(patch: Partial<AppSettings>) {
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
    const updated = settings.blockedKeywords.filter(k => k !== kw);
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

  const themeOptions = [
    { value: "light",  label: "Light",  Icon: Sun },
    { value: "system", label: "System", Icon: Monitor },
    { value: "dark",   label: "Dark",   Icon: Moon },
  ] as const;

  return (
    <div>
      <TopBar
        title="Settings"
        description="Configure your app, appearance, and notification preferences."
        actions={
          saved ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </div>
          ) : undefined
        }
      />
      <div className="p-4 sm:p-6 max-w-2xl space-y-5">

        {/* 1. Company & Sender */}
        <Section
          title="Company & Sender"
          description="Details used in automated emails and reminders sent to customers."
        >
          <div className="space-y-4">
            {[
              { key: "companyName",        label: "Company Name",         type: "text",  Icon: Building2 },
              { key: "defaultSenderName",  label: "Default Sender Name",  type: "text",  Icon: User },
              { key: "defaultSenderEmail", label: "Default Sender Email", type: "email", Icon: Mail },
            ].map(({ key, label, type, Icon }) => (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                  <Icon className="h-3.5 w-3.5 text-gray-400" />
                  {label}
                </label>
                <input
                  type={type}
                  value={(settings[key as keyof AppSettings] as string) ?? ""}
                  onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                  onBlur={() => save({ [key]: settings[key as keyof AppSettings] })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* 2. Automation Rules */}
        <Section
          title="Automation Rules"
          description="Control how automated follow-ups are triggered and approved."
        >
          <div className="space-y-4">
            {/* Manual approval */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0",
                  settings.manualApprovalMode ? "bg-blue-100" : "bg-gray-100"
                )}>
                  <Shield className={cn("h-5 w-5", settings.manualApprovalMode ? "text-blue-600" : "text-gray-400")} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Manual Approval Mode</p>
                  <p className="text-xs text-gray-500 mt-0.5">Require approval before any automated action is sent.</p>
                </div>
              </div>
              <Toggle
                checked={settings.manualApprovalMode}
                onChange={() => save({ manualApprovalMode: !settings.manualApprovalMode })}
                disabled={saving}
              />
            </div>
            {settings.manualApprovalMode && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">All scheduled actions will require human approval in the Actions page before sending.</p>
              </div>
            )}

            <div className="border-t border-gray-100" />

            {/* Safety check */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Safety check before every send</p>
                  <p className="text-xs text-gray-500 mt-0.5">Verify invoice status and contact exclusions before each action fires.</p>
                </div>
              </div>
              <Toggle
                checked={settings.lookupOnEveryAction}
                onChange={() => save({ lookupOnEveryAction: !settings.lookupOnEveryAction })}
                disabled={saving}
                color="amber"
              />
            </div>
            {!settings.lookupOnEveryAction && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 font-medium">Actions may fire on paid or disputed invoices without safety checks.</p>
              </div>
            )}

            <div className="border-t border-gray-100" />

            {/* Blocked keywords */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Blocked Keywords</p>
                  <p className="text-xs text-gray-500 mt-0.5">Automations are blocked when these words appear in contact notes.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
                {settings.blockedKeywords.length === 0 && (
                  <p className="text-xs text-gray-400 self-center">No blocked keywords configured.</p>
                )}
                {settings.blockedKeywords.map(kw => (
                  <div key={kw} className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="text-red-400 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addKeyword()}
                  placeholder="Add keyword (e.g. legal, court)"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                />
                <button
                  onClick={addKeyword}
                  className="flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />Add
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* 3. Appearance */}
        <Section
          title="Appearance"
          description="Choose how CollectPilot looks on this device."
        >
          <div className="flex gap-3 flex-wrap">
            {themeOptions.map(({ value, label, Icon }) => {
              const active = mounted && theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 px-5 py-4 text-xs font-medium transition-colors",
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-gray-400")} />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Saved to localStorage on this device. System follows your OS setting.
          </p>
        </Section>

        {/* 4. Notifications & Layout */}
        <Section
          title="Notifications"
          description="Control how you receive alerts and how information is displayed."
        >
          {[
            { icon: Volume2, label: "Notification sounds", description: "Play a sound when new notifications arrive.", checked: notificationSounds, onChange: setNotificationSounds },
            { icon: Mail,    label: "Email digest",        description: "Receive a daily summary of overdue invoices and pending actions.", checked: emailDigest,           onChange: setEmailDigest },
            { icon: Bell,    label: "Compact mode",        description: "Reduce spacing in lists and tables for a denser view.", checked: compactMode,           onChange: setCompactMode },
          ].map(({ icon: Icon, label, description, checked, onChange }) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-50 last:border-0">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
              </div>
              <Toggle checked={checked} onChange={() => onChange(!checked)} />
            </div>
          ))}
        </Section>

        {/* 5. Configuration — links to setup/admin sections removed from sidebar */}
        <Section
          title="Configuration"
          description="Set up your follow-up flows, call scripts, and customer contacts."
        >
          <div className="space-y-1">
            {[
              { href: "/automations",    icon: Zap,    label: "Follow-up Flows", description: "Build and manage your automated reminder sequences" },
              { href: "/call-templates", icon: Phone,  label: "Call Scripts",    description: "Manage AI call templates and outcomes" },
              { href: "/contacts",       icon: Users,  label: "Customer Directory", description: "View and manage all customer contacts" },
              { href: "/onboarding",     icon: Rocket, label: "Setup Wizard",    description: "Re-run the initial setup if needed" },
            ].map(({ href, icon: Icon, label, description }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                  <Icon className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </Section>

        {/* 6. Account / Demo */}
        <Section
          title="Account"
          description="Account details and demo mode status."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-800">James Cooper</p>
                <p className="text-xs text-gray-400">accounts@collectpilot.demo</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                Demo account
              </span>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-700">
                <strong>Prototype / demo mode.</strong> No real integrations, emails, or calls.
                All data resets on Vercel cold start.
              </p>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}

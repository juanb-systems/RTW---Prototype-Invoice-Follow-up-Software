"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { TopBar } from "@/components/layout/TopBar";
import { usePreferencesStore } from "@/lib/preferences-store";
import { Sun, Moon, Monitor, LayoutList, Bell, Volume2, Mail, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Appearance ─────────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: "light",  label: "Light",  Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark",   label: "Dark",   Icon: Moon },
] as const;

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // avoid hydration mismatch — theme is unknown on server
  useEffect(() => setMounted(true), []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
        <p className="text-xs text-gray-500 mt-0.5">Choose how CollectPilot looks on this device.</p>
      </div>
      <div className="px-5 py-4">
        <div className="flex gap-3 flex-wrap">
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const active = mounted && theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 px-5 py-4 text-xs font-medium transition-colors",
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

        {/* Dark mode status note */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <strong>Dark mode in progress.</strong> Your theme preference is saved. Full dark
            mode component styling will be rolled out in a future update — Light mode is the
            current supported theme.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Toggle row ─────────────────────────────────────────────────────────────────

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <Icon className="h-3.5 w-3.5 text-gray-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          checked ? "bg-blue-600" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const { compactMode, notificationSounds, emailDigest,
          setCompactMode, setNotificationSounds, setEmailDigest } = usePreferencesStore();

  return (
    <div>
      <TopBar title="Preferences" subtitle="UI and notification settings" />
      <div className="p-4 sm:p-6 space-y-4 max-w-xl">

        {/* Prototype banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700">
            <strong>Prototype preferences.</strong> Settings are persisted to{" "}
            <code className="text-xs bg-blue-100 rounded px-1">localStorage</code> on this
            device. They reset when you clear browser data.
          </p>
        </div>

        {/* Appearance */}
        <AppearanceSection />

        {/* Layout */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <LayoutList className="h-4 w-4 text-gray-400" />
              Layout
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Adjust how information is displayed.</p>
          </div>
          <div className="px-5">
            <ToggleRow
              icon={LayoutList}
              label="Compact mode"
              description="Reduce spacing in lists and tables for a denser view."
              checked={compactMode}
              onChange={setCompactMode}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-400" />
              Notifications
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Control how you receive alerts.</p>
          </div>
          <div className="px-5">
            <ToggleRow
              icon={Volume2}
              label="Notification sounds"
              description="Play a sound when new notifications arrive."
              checked={notificationSounds}
              onChange={setNotificationSounds}
            />
            <ToggleRow
              icon={Mail}
              label="Email digest"
              description="Receive a daily summary of overdue invoices and pending actions."
              checked={emailDigest}
              onChange={setEmailDigest}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

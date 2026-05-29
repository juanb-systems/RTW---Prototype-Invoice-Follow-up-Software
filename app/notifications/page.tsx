"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import {
  Bell,
  ShieldX,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Phone,
  PauseCircle,
  Settings,
  ChevronRight,
} from "lucide-react";
import {
  NOTIFICATIONS,
  UNREAD_COUNT,
  type AppNotification,
  type NotifCategory,
} from "@/lib/notifications-data";
import { cn } from "@/lib/utils";

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  NotifCategory,
  { label: string; Icon: React.ElementType; bg: string; text: string }
> = {
  dispute:    { label: "Dispute",    Icon: ShieldX,       bg: "bg-red-100",    text: "text-red-700" },
  approval:   { label: "Approval",  Icon: CheckCircle2,  bg: "bg-purple-100", text: "text-purple-700" },
  overdue:    { label: "Overdue",   Icon: AlertTriangle, bg: "bg-orange-100", text: "text-orange-700" },
  reply:      { label: "Reply",     Icon: MessageSquare, bg: "bg-teal-100",   text: "text-teal-700" },
  call:       { label: "AI Call",   Icon: Phone,         bg: "bg-green-100",  text: "text-green-700" },
  automation: { label: "Automation",Icon: PauseCircle,   bg: "bg-amber-100",  text: "text-amber-700" },
  system:     { label: "System",    Icon: Settings,      bg: "bg-gray-100",   text: "text-gray-600" },
};

// ── Filter tabs ────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { value: "all",         label: "All" },
  { value: "unread",      label: "Unread" },
  { value: "invoices",    label: "Invoices" },
  { value: "replies",     label: "Replies" },
  { value: "automations", label: "Automations" },
  { value: "calls",       label: "Calls" },
  { value: "system",      label: "System" },
];

function matchesFilter(n: AppNotification, filter: string): boolean {
  switch (filter) {
    case "all":         return true;
    case "unread":      return !n.isRead;
    case "invoices":    return n.category === "overdue" || n.category === "dispute";
    case "replies":     return n.category === "reply";
    case "automations": return n.category === "automation" || n.category === "approval";
    case "calls":       return n.category === "call";
    case "system":      return n.category === "system";
    default:            return true;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");

  const filtered = NOTIFICATIONS.filter((n) => matchesFilter(n, filter));

  return (
    <div>
      <TopBar
        title="Notifications"
        subtitle={UNREAD_COUNT > 0 ? `${UNREAD_COUNT} unread` : "All caught up"}
      />
      <div className="p-4 sm:p-6 space-y-4">

        {/* Info banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700">
            <strong>Demo notifications.</strong> These are hardcoded prototype notifications.
            In a production build these would be driven by real events — invoice status changes,
            incoming replies, lookup outcomes, and automation events.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.value === "unread"
                ? UNREAD_COUNT
                : NOTIFICATIONS.filter((n) => matchesFilter(n, tab.value)).length;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === tab.value
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="h-8 w-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No notifications in this category.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map((notif) => {
                const cfg = CATEGORY_CONFIG[notif.category];
                const Icon = cfg.Icon;
                return (
                  <li
                    key={notif.id}
                    className={cn(
                      "transition-colors hover:bg-gray-50/50",
                      !notif.isRead && "bg-blue-50/40"
                    )}
                  >
                    <Link
                      href={notif.href}
                      className="flex items-start gap-3 px-4 sm:px-5 py-3.5"
                    >
                      {/* Category icon */}
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                          cfg.bg
                        )}
                      >
                        <Icon className={cn("h-4 w-4", cfg.text)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-xs leading-snug",
                              !notif.isRead
                                ? "font-semibold text-gray-900"
                                : "font-medium text-gray-700"
                            )}
                          >
                            {notif.text}
                          </p>
                          {!notif.isRead && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                        {notif.detail && (
                          <p className="mt-0.5 text-xs text-gray-400 leading-snug">
                            {notif.detail}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                              cfg.bg,
                              cfg.text
                            )}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-gray-400">{notif.timeLabel}</span>
                        </div>
                      </div>

                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 mt-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

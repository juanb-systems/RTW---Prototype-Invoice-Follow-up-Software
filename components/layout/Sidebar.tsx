"use client";

import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Zap,
  Calendar,
  Inbox,
  Bell,
  Settings,
  TrendingUp,
  Phone,
  Rocket,
  User,
  SlidersHorizontal,
  Monitor,
  LogOut,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { NavItem } from "./NavItem";
import type { LucideIcon } from "lucide-react";

// ── Nav groups ────────────────────────────────────────────────────────────────

const dailyWorkItems = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/invoices",      icon: FileText,         label: "Invoices" },
  { href: "/inbox",         icon: Inbox,            label: "Inbox" },
  { href: "/notifications", icon: Bell,             label: "Notifications" },
];

const automationItems = [
  { href: "/automations",    icon: Zap,      label: "Automations" },
  { href: "/scheduled",      icon: Calendar, label: "Scheduled Actions" },
  { href: "/call-templates", icon: Phone,    label: "Call Templates" },
];

const adminItems = [
  { href: "/contacts",   icon: Users,   label: "Contacts" },
  { href: "/onboarding", icon: Rocket,  label: "Setup & Onboarding" },
];

// ── NavSection ────────────────────────────────────────────────────────────────

type NavItemDef = { href: string; icon: LucideIcon; label: string };

function NavSection({ label, items }: { label: string; items: NavItemDef[] }) {
  return (
    <div>
      <p className="px-3 pt-4 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}

// ── ProfileMenu ───────────────────────────────────────────────────────────────

function ProfileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-700/60">
        <p className="text-xs font-semibold text-zinc-200">James Cooper</p>
        <p className="text-xs text-zinc-500 mt-0.5">accounts@collectpilot.demo</p>
      </div>

      {/* Menu items */}
      <div className="py-1">
        <button
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700/60 transition-colors cursor-not-allowed opacity-50"
          disabled
        >
          <User className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Account</span>
          <span className="ml-auto text-[10px] text-zinc-600">Soon</span>
        </button>

        <button
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700/60 transition-colors cursor-not-allowed opacity-50"
          disabled
        >
          <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Preferences</span>
          <span className="ml-auto text-[10px] text-zinc-600">Soon</span>
        </button>

        <Link
          href="/settings"
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700/60 transition-colors"
        >
          <Settings className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Settings</span>
        </Link>
      </div>

      <div className="border-t border-zinc-700/60 py-1">
        <button
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-2 text-xs text-zinc-400 cursor-not-allowed opacity-50"
          disabled
        >
          <Monitor className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Demo mode</span>
          <span className="ml-auto inline-flex items-center rounded-full bg-blue-900/60 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
            Active
          </span>
        </button>

        <button
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-2 text-xs text-zinc-400 cursor-not-allowed opacity-50"
          disabled
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Sign out</span>
          <span className="ml-auto text-[10px] text-zinc-600">Demo only</span>
        </button>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  return (
    <aside className="flex h-screen w-64 flex-col bg-zinc-900 border-r border-zinc-800">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">CollectPilot</p>
          <p className="text-xs text-zinc-500">AI Receivables</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0">
        <NavSection label="Daily Work" items={dailyWorkItems} />
        <div className="mx-3 my-2 border-t border-zinc-800/80" />
        <NavSection label="Automation Setup" items={automationItems} />
        <div className="mx-3 my-2 border-t border-zinc-800/80" />
        <NavSection label="Admin" items={adminItems} />
      </nav>

      {/* Bottom — Settings + user profile */}
      <div className="border-t border-zinc-800 px-3 py-3">
        <NavItem href="/settings" icon={Settings} label="Settings" />

        {/* Profile block with popover */}
        <div ref={profileRef} className="relative mt-3">
          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50">
              <ProfileMenu onClose={() => setProfileOpen(false)} />
            </div>
          )}
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer hover:bg-zinc-800/60 transition-colors group"
            aria-label="Account menu"
          >
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">JC</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-zinc-300 truncate group-hover:text-zinc-100">James Cooper</p>
              <p className="text-xs text-zinc-600 truncate">accounts@collectpilot.demo</p>
            </div>
            <ChevronUp
              className={`h-3.5 w-3.5 flex-shrink-0 text-zinc-600 transition-transform group-hover:text-zinc-400 ${
                profileOpen ? "rotate-0" : "rotate-180"
              }`}
            />
          </button>
        </div>
      </div>

    </aside>
  );
}

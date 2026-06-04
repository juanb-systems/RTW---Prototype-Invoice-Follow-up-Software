"use client";

import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Zap,
  Calendar,
  Inbox,
  Settings,
  TrendingUp,
  Phone,
  Rocket,
  User,
  Monitor,
  LogOut,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { NavItem } from "./NavItem";
import type { LucideIcon } from "lucide-react";

// ── Nav groups ────────────────────────────────────────────────────────────────

const dailyWorkItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/invoices",  icon: FileText,         label: "Receivables" },
  { href: "/inbox",     icon: Inbox,            label: "Inbox" },
  { href: "/scheduled", icon: Calendar,         label: "Actions" },
];

const setupItems = [
  { href: "/automations",    icon: Zap,    label: "Automations" },
  { href: "/call-templates", icon: Phone,  label: "Templates" },
  { href: "/contacts",       icon: Users,  label: "Customer Directory" },
  { href: "/onboarding",     icon: Rocket, label: "Onboarding" },
];

// ── NavSection ────────────────────────────────────────────────────────────────

type NavItemDef = { href: string; icon: LucideIcon; label: string };

function NavSection({ label, items }: { label: string; items: NavItemDef[] }) {
  return (
    <div>
      {/* M3 Navigation Drawer section label */}
      <p className="px-3 pt-5 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
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
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">James Cooper</p>
        <p className="text-xs text-gray-400 mt-0.5">accounts@collectpilot.demo</p>
      </div>

      <div className="py-1">
        <div className="flex items-center gap-3 px-4 py-2 cursor-default select-none">
          <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
          <span className="text-sm text-gray-400">Account</span>
          <span className="ml-auto text-xs text-gray-300">Coming soon</span>
        </div>

        <Link
          href="/settings"
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Settings className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span>Settings</span>
        </Link>
      </div>

      <div className="border-t border-gray-100 py-1">
        <div className="flex items-center gap-3 px-4 py-2 cursor-default select-none">
          <Monitor className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
          <span className="text-sm text-gray-400">Demo mode</span>
          <span className="ml-auto inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
            Active
          </span>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 cursor-default select-none">
          <LogOut className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
          <span className="text-sm text-gray-300">Sign out</span>
          <span className="ml-auto text-xs text-gray-300">Disabled in demo</span>
        </div>
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
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  return (
    // M3 Navigation Drawer — light surface, subtle border
    // h-full so the sidebar fills its container on both desktop (flex child) and mobile (absolute inset-y-0)
    // rather than using h-screen (100vh) which can exceed the visible viewport on mobile browsers
    <aside className="relative flex h-full w-64 flex-col bg-white border-r border-gray-200 z-10">

      {/* Logo / brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 flex-shrink-0">
          <TrendingUp className="h-[18px] w-[18px] text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 tracking-tight">CollectPilot</p>
          <p className="text-[11px] text-gray-400 mt-0.5">AI Receivables</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0">
        <NavSection label="Daily Work" items={dailyWorkItems} />
        <div className="mx-3 my-3 border-t border-gray-100" />
        <NavSection label="Setup" items={setupItems} />
      </nav>

      {/* Bottom: Settings + profile */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-0.5">
        <NavItem href="/settings" icon={Settings} label="Settings" />

        {/* Profile */}
        <div ref={profileRef} className="relative mt-1">
          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
              <ProfileMenu onClose={() => setProfileOpen(false)} />
            </div>
          )}
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors group"
            aria-label="Account menu"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 flex-shrink-0">
              <span className="text-xs font-bold text-white">JC</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900">James Cooper</p>
              <p className="text-xs text-gray-400 truncate">accounts@collectpilot.demo</p>
            </div>
            <ChevronUp
              className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:text-gray-600 ${
                profileOpen ? "rotate-0" : "rotate-180"
              }`}
            />
          </button>
        </div>
      </div>

    </aside>
  );
}

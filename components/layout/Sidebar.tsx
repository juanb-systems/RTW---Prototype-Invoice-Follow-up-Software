"use client";

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
} from "lucide-react";
import { NavItem } from "./NavItem";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/automations", icon: Zap, label: "Automations" },
  { href: "/scheduled", icon: Calendar, label: "Scheduled Actions" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/call-templates", icon: Phone, label: "Call Templates" },
];

export function Sidebar() {
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 py-1 text-xs font-medium text-zinc-600 uppercase tracking-wider mb-2">
          Main
        </p>
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-zinc-800 px-3 py-3">
        <NavItem href="/settings" icon={Settings} label="Settings" />
        <div className="mt-3 px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">JC</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">James Cooper</p>
              <p className="text-xs text-zinc-600 truncate">accounts@collectpilot.demo</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

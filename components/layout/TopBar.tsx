"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  X,
  ChevronRight,
  FileText,
  Users,
  Zap,
  Clock,
  Mail,
  Menu,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useMobileMenuStore } from "@/lib/mobile-menu-store";
import { NOTIFICATIONS, UNREAD_COUNT } from "@/lib/notifications-data";

const PREVIEW_NOTIFICATIONS = NOTIFICATIONS.slice(0, 3);

interface TopBarProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
}


// ── Global search types ───────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  badgeClass: string;
  Icon: React.ElementType;
  href: string;
}

// Minimal shapes — only the fields used for matching/display
type InvRaw = {
  id: string; invoiceNumber: string; amount: number; status: string;
  contact?: { name: string; company: string };
};
type ContactRaw = {
  id: string; name: string; company: string; email: string; phone: string; status: string;
};
type FlowRaw = {
  id: string; name: string; description?: string; status: string; steps: unknown[];
};
type SchedRaw = {
  id: string; stepType: string; status: string;
  invoice?: { invoiceNumber: string };
  contact?: { name: string; company: string };
  flow?: { name: string };
};
type InboxRaw = {
  id: string; invoiceId: string; from: string; subject: string;
  body: string; classification: string;
  invoice?: { invoiceNumber: string };
  contact?: { name: string; company: string };
};
type AllData = {
  invoices: InvRaw[];
  contacts: ContactRaw[];
  automations: FlowRaw[];
  scheduled: SchedRaw[];
  inbox: InboxRaw[];
};

function buildResults(data: AllData, rawQuery: string): Record<string, SearchResult[]> {
  const q = rawQuery.toLowerCase().trim();
  const groups: Record<string, SearchResult[]> = {};

  // Invoices
  const invHits = data.invoices
    .filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.contact?.name ?? "").toLowerCase().includes(q) ||
        (inv.contact?.company ?? "").toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q) ||
        String(inv.amount).includes(q)
    )
    .slice(0, 4)
    .map((inv): SearchResult => ({
      id: inv.id,
      title: inv.invoiceNumber,
      subtitle: `${inv.contact?.name ?? "—"}  ·  ${formatCurrency(inv.amount)}  ·  ${inv.status}`,
      group: "Invoices",
      badgeClass: "bg-blue-100 text-blue-700",
      Icon: FileText,
      href: `/invoices/${inv.id}`,
    }));
  if (invHits.length) groups["Invoices"] = invHits;

  // Contacts
  const contactHits = data.contacts
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    )
    .slice(0, 4)
    .map((c): SearchResult => ({
      id: c.id,
      title: c.name,
      subtitle: `${c.company}  ·  ${c.email}`,
      group: "Contacts",
      badgeClass: "bg-green-100 text-green-700",
      Icon: Users,
      href: `/contacts/${c.id}`,
    }));
  if (contactHits.length) groups["Contacts"] = contactHits;

  // Automations
  const autoHits = data.automations
    .filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description ?? "").toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q)
    )
    .slice(0, 4)
    .map((f): SearchResult => ({
      id: f.id,
      title: f.name,
      subtitle: `${f.status}  ·  ${(f.steps as unknown[]).length} steps`,
      group: "Automations",
      badgeClass: "bg-purple-100 text-purple-700",
      Icon: Zap,
      href: `/automations/${f.id}/builder`,
    }));
  if (autoHits.length) groups["Automations"] = autoHits;

  // Scheduled Actions
  const schedHits = data.scheduled
    .filter(
      (a) =>
        a.stepType.toLowerCase().includes(q) ||
        (a.invoice?.invoiceNumber ?? "").toLowerCase().includes(q) ||
        (a.contact?.name ?? "").toLowerCase().includes(q) ||
        (a.contact?.company ?? "").toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        (a.flow?.name ?? "").toLowerCase().includes(q)
    )
    .slice(0, 4)
    .map((a): SearchResult => ({
      id: a.id,
      title: `${a.stepType.replace(/_/g, " ")} — ${a.invoice?.invoiceNumber ?? a.id}`,
      subtitle: `${a.contact?.name ?? "—"}  ·  ${a.status}  ·  ${a.flow?.name ?? ""}`,
      group: "Scheduled Actions",
      badgeClass: "bg-amber-100 text-amber-700",
      Icon: Clock,
      href: "/scheduled",
    }));
  if (schedHits.length) groups["Scheduled Actions"] = schedHits;

  // Inbox
  const inboxHits = data.inbox
    .filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (m.invoice?.invoiceNumber ?? "").toLowerCase().includes(q) ||
        (m.contact?.name ?? "").toLowerCase().includes(q) ||
        m.classification.replace(/_/g, " ").toLowerCase().includes(q)
    )
    .slice(0, 4)
    .map((m): SearchResult => ({
      id: m.id,
      title: m.subject,
      subtitle: `${m.from}  ·  ${m.classification.replace(/_/g, " ")}`,
      group: "Inbox",
      badgeClass: "bg-gray-100 text-gray-600",
      Icon: Mail,
      href: "/inbox",
    }));
  if (inboxHits.length) groups["Inbox"] = inboxHits;

  return groups;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TopBar({ title, subtitle, description, actions }: TopBarProps) {
  const pathname = usePathname();

  // Global search — completely independent of page-level search bars
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allData, setAllData] = useState<AllData>({
    invoices: [], contacts: [], automations: [], scheduled: [], inbox: [],
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  // Clear search on navigation
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  // Fetch all data once when search opens for the first time
  useEffect(() => {
    if (!searchOpen || dataLoaded) return;
    Promise.all([
      fetch("/api/invoices",    { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/contacts",    { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/automations", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/scheduled",   { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/inbox",       { cache: "no-store" }).then((r) => r.json()),
    ]).then(([invoices, contacts, automations, scheduled, inbox]) => {
      setAllData({ invoices, contacts, automations, scheduled, inbox });
      setDataLoaded(true);
    });
  }, [searchOpen, dataLoaded]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [searchOpen]);

  // Close panels on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
  }

  function closeSearch() { setSearchOpen(false); setSearchQuery(""); }

  const showDropdown  = searchOpen && searchQuery.trim().length >= 2;
  const groupedResults = showDropdown ? buildResults(allData, searchQuery) : {};
  const totalResults   = Object.values(groupedResults).reduce((n, arr) => n + arr.length, 0);

  const toggleMobileMenu = useMobileMenuStore((s) => s.toggle);

  return (
    <>
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobileMenu}
        aria-label="Open navigation menu"
        className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 truncate hidden sm:block">{subtitle}</p>}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}

        {/* ── Global search ───────────────────────────────────────────── */}
        <div ref={searchPanelRef} className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-blue-100 w-44 sm:w-72">
              <Search className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Search everything — invoices, contacts, flows…"
                className="flex-1 text-xs text-gray-700 placeholder-gray-400 bg-transparent outline-none"
              />
              <button
                onClick={closeSearch}
                title="Close search (Esc)"
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              title="Search everything"
              aria-label="Open global search"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Results dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-[calc(100vw-2rem)] sm:w-[26rem] rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
              {!dataLoaded ? (
                <div className="py-10 text-center text-xs text-gray-400">Searching all sections…</div>
              ) : totalResults === 0 ? (
                <div className="py-10 text-center space-y-1">
                  <p className="text-sm text-gray-400">No results for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-xs text-gray-300">Try a different name, number, or status</p>
                </div>
              ) : (
                <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-50">
                  {Object.entries(groupedResults).map(([group, results]) => (
                    <div key={group}>
                      <div className="sticky top-0 px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group}</p>
                      </div>
                      {results.map((result) => (
                        <Link
                          key={result.id}
                          href={result.href}
                          onClick={closeSearch}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors group"
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0 ${result.badgeClass}`}>
                            <result.Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{result.title}</p>
                            <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {totalResults > 0
                    ? `${totalResults} result${totalResults !== 1 ? "s" : ""} across all sections`
                    : ""}
                </p>
                <p className="text-xs text-gray-300">Page search bars filter current section only</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Notification bell ───────────────────────────────────────── */}
        <div ref={notifPanelRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            title="Notifications"
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {UNREAD_COUNT > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[calc(100vw-2rem)] sm:w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-900">Notifications</p>
                {UNREAD_COUNT > 0 && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    {UNREAD_COUNT} new
                  </span>
                )}
              </div>

              {PREVIEW_NOTIFICATIONS.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="h-5 w-5 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {PREVIEW_NOTIFICATIONS.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-snug">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.timeLabel}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                    </Link>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  See all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    {description && (
      <div className="border-b border-gray-100 bg-white px-4 md:px-6 py-2">
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>
    )}
    </>
  );
}

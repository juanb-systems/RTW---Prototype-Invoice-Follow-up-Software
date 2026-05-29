"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { ContactStatusBadge } from "@/components/contacts/ContactStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useSearchStore } from "@/lib/search-store";
import { Mail, Phone, Building2, Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { ContactStatus } from "@/lib/types";

type SortCol = "name" | "email" | "phone" | "invoices" | "totalOwed" | "overdueCount" | "status";
type SortDir = "asc" | "desc";

interface ContactRow {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  invoiceCount: number;
  overdueCount: number;
  totalOwed: number;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-gray-400" />;
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-blue-500" />
    : <ChevronDown className="h-3 w-3 text-blue-500" />;
}

function normaliseAmount(raw: string): string {
  return raw.replace(/[$,]/g, "");
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [sortCol, setSortCol] = useState<SortCol>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(true);

  // Shared search state — also written by the TopBar search input
  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/contacts", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setContacts(data);
        setLoading(false);
      });
  }, []);

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "totalOwed" || col === "overdueCount" || col === "invoices" ? "desc" : "asc");
    }
  }

  const filtered = contacts.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const normQ = normaliseAmount(q);
    const formattedOwed = formatCurrency(c.totalOwed).toLowerCase();

    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      // "excluded" / "on hold" readable labels
      (c.status === "excluded" && "excluded".includes(q)) ||
      (c.status === "on_hold" && "on hold".includes(q)) ||
      formattedOwed.includes(q) ||
      normaliseAmount(formattedOwed).includes(normQ) ||
      String(c.totalOwed).includes(normQ) ||
      String(c.invoiceCount).includes(q) ||
      String(c.overdueCount).includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortCol) {
      case "name":         return dir * a.name.localeCompare(b.name);
      case "email":        return dir * a.email.localeCompare(b.email);
      case "phone":        return dir * a.phone.localeCompare(b.phone);
      case "invoices":     return dir * (a.invoiceCount - b.invoiceCount);
      case "totalOwed":    return dir * (a.totalOwed - b.totalOwed);
      case "overdueCount": return dir * (a.overdueCount - b.overdueCount);
      case "status":       return dir * a.status.localeCompare(b.status);
      default:             return 0;
    }
  });

  const excluded = contacts.filter((c) => c.status === "excluded").length;
  const onHold   = contacts.filter((c) => c.status === "on_hold").length;

  const columns: { col: SortCol; label: string; align: "left" | "right" | "center" }[] = [
    { col: "name",         label: "Contact",    align: "left" },
    { col: "email",        label: "Email",      align: "left" },
    { col: "phone",        label: "Phone",      align: "left" },
    { col: "invoices",     label: "Invoices",   align: "center" },
    { col: "totalOwed",    label: "Total Owed", align: "right" },
    { col: "overdueCount", label: "Overdue",    align: "center" },
    { col: "status",       label: "Status",     align: "left" },
  ];

  return (
    <div>
      <TopBar
        title="Contacts"
        subtitle={`${contacts.length} total · ${excluded} excluded · ${onHold} on hold`}
      />
      <div className="p-4 sm:p-6">
        {excluded > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {excluded} contact{excluded > 1 ? "s are" : " is"} excluded from all automations.
              No emails, SMS, or calls will be sent to them.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
            <h2 className="text-sm font-semibold text-gray-900 shrink-0">All Contacts</h2>
            {/* In-table search — shares the same store state as the TopBar search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name, company, email, phone, status…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-gray-200 pl-8 pr-8 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => { clear(); searchRef.current?.focus(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 shrink-0 ml-auto">
              {loading ? "Loading…" : `Showing ${sorted.length} of ${contacts.length} contacts`}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400">Loading contacts…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {columns.map(({ col, label, align }) => (
                      <th
                        key={col}
                        className={`px-5 py-3 text-${align} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none whitespace-nowrap`}
                        onClick={() => handleSort(col)}
                      >
                        <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
                          {label}
                          <SortIcon active={sortCol === col} dir={sortDir} />
                        </span>
                      </th>
                    ))}
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <p className="text-sm text-gray-400">
                          {query ? `No contacts match "${query}".` : "No contacts found."}
                        </p>
                        {query && (
                          <button onClick={clear} className="mt-2 text-xs text-blue-500 hover:underline">
                            Clear search
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    sorted.map((contact) => (
                      <tr
                        key={contact.id}
                        className={`hover:bg-gray-50/60 transition-colors ${contact.status === "excluded" ? "bg-red-50/30" : ""}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{contact.name}</p>
                              <p className="text-xs text-gray-400">{contact.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail className="h-3 w-3 text-gray-300 flex-shrink-0" />
                            {contact.email}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="h-3 w-3 text-gray-300 flex-shrink-0" />
                            {contact.phone}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-xs font-medium text-gray-900">{contact.invoiceCount}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {contact.totalOwed > 0 ? (
                            <span className="text-xs font-semibold text-red-600">{formatCurrency(contact.totalOwed)}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {contact.overdueCount > 0 ? (
                            <span className="text-xs font-semibold text-red-500">{contact.overdueCount}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <ContactStatusBadge status={contact.status as ContactStatus} />
                        </td>
                        <td className="px-5 py-3.5">
                          <Link href={`/contacts/${contact.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

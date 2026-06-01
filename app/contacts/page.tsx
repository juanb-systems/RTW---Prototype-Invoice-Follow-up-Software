"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ContactStatusBadge } from "@/components/contacts/ContactStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useSearchStore } from "@/lib/search-store";
import { Mail, Phone, Building2, Search, X, ChevronUp, ChevronDown, ChevronsUpDown, UserPlus } from "lucide-react";
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

// ── Add Contact modal ─────────────────────────────────────────────────────────

interface NewContactForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ContactStatus;
  notes: string;
}

const EMPTY_FORM: NewContactForm = { name: "", company: "", email: "", phone: "", status: "active", notes: "" };

function AddContactModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (contact: ContactRow) => void;
}) {
  const [form, setForm]     = useState<NewContactForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewContactForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const nameRef             = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function set(field: keyof NewContactForm, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim())    errs.name    = "Name is required.";
    if (!form.company.trim()) errs.company = "Company is required.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email address.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:    form.name.trim(),
        company: form.company.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim(),
        status:  form.status,
        notes:   form.notes.trim(),
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      onSaved({ ...saved, invoiceCount: 0, overdueCount: 0, totalOwed: 0 });
      onClose();
    }
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">Add Contact</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contact name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Sarah Nguyen"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-300" : "border-gray-200 focus:border-blue-400"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="e.g. Metro Supplies Pty Ltd"
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.company ? "border-red-300 focus:border-red-400 focus:ring-red-300" : "border-gray-200 focus:border-blue-400"
              }`}
            />
            {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company}</p>}
          </div>

          {/* Email + Phone — side by side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="sarah@example.com"
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-300" : "border-gray-200 focus:border-blue-400"
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+61 400 000 000"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="active">Active — included in automations</option>
              <option value="excluded">Excluded — no emails, SMS, or calls</option>
              <option value="on_hold">On Hold — automations paused</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any relevant notes about this contact…"
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
          <p className="text-xs text-gray-400">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Contact"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Contacts page ─────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [sortCol, setSortCol]   = useState<SortCol>("name");
  const [sortDir, setSortDir]   = useState<SortDir>("asc");
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);

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
      {showAdd && (
        <AddContactModal
          onClose={() => setShowAdd(false)}
          onSaved={(c) => setContacts(prev => [c, ...prev])}
        />
      )}
      <TopBar
        title="Contacts"
        subtitle={`${contacts.length} total · ${excluded} excluded · ${onHold} on hold`}
        description="Manage customer contacts, automation exclusions, and contact status."
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Contact</span>
            <span className="sm:hidden">Add</span>
          </button>
        }
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
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">
                {query ? `No contacts match "${query}".` : "No contacts found."}
              </p>
              {query && (
                <button onClick={clear} className="mt-2 text-xs text-blue-500 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── Desktop table (sm+) ────────────────────────────────── */}
              <div className="hidden sm:block overflow-x-auto">
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
                    {sorted.map((contact) => (
                      <tr
                        key={contact.id}
                        className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${contact.status === "excluded" ? "bg-red-50/30" : ""}`}
                        onClick={() => router.push(`/contacts/${contact.id}`)}
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
                          <Link href={`/contacts/${contact.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline" onClick={(e) => e.stopPropagation()}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list (< sm) ────────────────────────────── */}
              <div className="sm:hidden divide-y divide-gray-100">
                {sorted.map((contact) => (
                  <div
                    key={contact.id}
                    className={`px-4 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors ${contact.status === "excluded" ? "bg-red-50/30" : ""}`}
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    {/* Name + company + status */}
                    <div className="flex items-start gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                          <ContactStatusBadge status={contact.status as ContactStatus} />
                        </div>
                        <p className="text-xs text-gray-400">{contact.company}</p>
                      </div>
                    </div>

                    {/* Email + phone */}
                    <div className="space-y-1 mb-2">
                      <div className="flex items-start gap-1.5 text-xs text-gray-500">
                        <Mail className="h-3 w-3 text-gray-300 flex-shrink-0 mt-0.5" />
                        <span className="break-all">{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone className="h-3 w-3 text-gray-300 flex-shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>

                    {/* Invoice stats */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2.5">
                      <span>{contact.invoiceCount} invoice{contact.invoiceCount !== 1 ? "s" : ""}</span>
                      {contact.overdueCount > 0 && (
                        <span className="font-semibold text-red-500">{contact.overdueCount} overdue</span>
                      )}
                      {contact.totalOwed > 0 && (
                        <span className="font-semibold text-red-600">{formatCurrency(contact.totalOwed)}</span>
                      )}
                    </div>

                    <Link href={`/contacts/${contact.id}`} className="text-xs font-medium text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                      View contact →
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

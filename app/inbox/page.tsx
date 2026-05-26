"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { useSearchStore } from "@/lib/search-store";
import {
  Reply,
  PauseCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  BrainCircuit,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import type { MessageClassification } from "@/lib/types";

type Message = {
  id: string;
  invoiceId: string;
  contactId: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
  classification: MessageClassification;
  isRead: boolean;
  isReplied: boolean;
  automationPaused: boolean;
  invoice?: { invoiceNumber: string; amount: number };
  contact?: { name: string; company: string };
};

const classificationConfig: Record<
  MessageClassification,
  { label: string; color: string; icon: React.ElementType; aiLabel: string }
> = {
  promise_to_pay: {
    label: "Promise to Pay",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
    aiLabel: "AI classified this reply as a promise to pay",
  },
  dispute: {
    label: "Dispute",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertTriangle,
    aiLabel: "AI classified this reply as a dispute",
  },
  out_of_office: {
    label: "Out of Office",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: Clock,
    aiLabel: "AI classified this reply as out of office",
  },
  payment_query: {
    label: "Payment Query",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: MessageCircle,
    aiLabel: "AI classified this reply as a payment query",
  },
  unclassified: {
    label: "Unclassified",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: BrainCircuit,
    aiLabel: "AI could not classify this reply",
  },
};

function MessageCard({
  message,
  onUpdate,
}: {
  message: Message;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [replying, setReplying] = useState(false);

  const cfg = classificationConfig[message.classification] ?? classificationConfig.unclassified;
  const Icon = cfg.icon;

  async function pauseAutomation() {
    setPausing(true);
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: message.id, automationPaused: true, isRead: true }),
    });
    setPausing(false);
    onUpdate();
  }

  async function markRead() {
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: message.id, isRead: true }),
    });
    onUpdate();
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    setReplying(true);
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: message.id, isReplied: true, isRead: true }),
    });
    setReplyText("");
    setShowReply(false);
    setReplying(false);
    onUpdate();
  }

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        !message.isRead ? "border-blue-200" : "border-gray-200"
      }`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => {
          setExpanded(!expanded);
          if (!message.isRead) markRead();
        }}
      >
        {/* Unread indicator */}
        <div className="mt-1 flex-shrink-0">
          {!message.isRead ? (
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-gray-200" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${!message.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                {message.subject}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{message.from}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400">{formatRelativeTime(message.receivedAt)}</span>
            </div>
          </div>

          {/* AI classification badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
              <BrainCircuit className="h-3 w-3" />
              <Icon className="h-3 w-3" />
              {cfg.aiLabel}
            </div>
            {message.automationPaused && (
              <div className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                <PauseCircle className="h-3 w-3" />
                Automation paused due to customer reply
              </div>
            )}
            {message.isReplied && (
              <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                <Reply className="h-3 w-3" />
                Replied
              </div>
            )}
          </div>

          {/* Invoice link */}
          {message.invoice && (
            <p className="mt-1 text-xs text-gray-400">
              Re:{" "}
              <Link href={`/invoices/${message.invoiceId}`} className="text-blue-500 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                {message.invoice.invoiceNumber}
              </Link>
              {" · "}
              {message.contact?.name}
              {" · "}
              {formatCurrency(message.invoice.amount)}
            </p>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {/* Dispute detected banner */}
          {message.classification === "dispute" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                Dispute detected, follow-up paused. This invoice needs human review.
              </p>
            </div>
          )}
          {message.classification === "promise_to_pay" && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700 font-medium">
                AI classified this reply as a promise to pay. Automation will be held.
              </p>
            </div>
          )}

          {/* Email body */}
          <div className="rounded-md bg-gray-50 p-3">
            <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed">
              {message.body}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {!message.automationPaused && (
              <button
                onClick={pauseAutomation}
                disabled={pausing}
                className="flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
              >
                <PauseCircle className="h-3.5 w-3.5" />
                {pausing ? "Pausing..." : "Pause Automation"}
              </button>
            )}
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
            <Link
              href={`/invoices/${message.invoiceId}`}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              View Invoice →
            </Link>
          </div>

          {/* Reply composer */}
          {showReply && (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${message.from}...`}
                rows={4}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-blue-400 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={sendReply}
                  disabled={replying || !replyText.trim()}
                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {replying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Reply className="h-3.5 w-3.5" />}
                  {replying ? "Sending..." : "Send Reply (simulated)"}
                </button>
                <button
                  onClick={() => setShowReply(false)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/inbox");
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = messages.filter((m) => !m.isRead).length;
  const filtered = messages
    .filter((m) => {
      if (filter === "all") return true;
      if (filter === "unread") return !m.isRead;
      return m.classification === filter;
    })
    .filter((m) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const classificationLabel = (classificationConfig[m.classification]?.label ?? m.classification).toLowerCase();
      return (
        m.from.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (m.invoice?.invoiceNumber ?? "").toLowerCase().includes(q) ||
        (m.contact?.name ?? "").toLowerCase().includes(q) ||
        (m.contact?.company ?? "").toLowerCase().includes(q) ||
        m.classification.toLowerCase().includes(q) ||
        classificationLabel.includes(q)
      );
    })
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  return (
    <div>
      <TopBar
        title="Inbox"
        subtitle={`${unread} unread · ${messages.length} total`}
        actions={
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />
      <div className="p-6 space-y-5">
        {/* AI note */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 flex items-start gap-3">
          <BrainCircuit className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-purple-700">
            <strong>AI reply classification is active.</strong> Incoming replies are automatically classified
            as promises to pay, disputes, out-of-office, or payment queries. Automations are held when
            a promise or dispute is detected.
          </p>
        </div>

        {/* Search bar */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search sender, subject, classification, invoice…"
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
              {loading ? "Loading…" : `Showing ${filtered.length} of ${messages.length} messages`}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
            { value: "promise_to_pay", label: "Promise to Pay" },
            { value: "dispute", label: "Disputes" },
            { value: "payment_query", label: "Queries" },
            { value: "out_of_office", label: "Out of Office" },
            { value: "unclassified", label: "Unclassified" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.value
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.value === "unread" && unread > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-xs text-white">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm text-gray-400">
              {query ? `No messages match "${query}".` : "No messages in this category."}
            </p>
            {query && (
              <button onClick={clear} className="mt-2 text-xs text-blue-500 hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((message) => (
              <MessageCard key={message.id} message={message} onUpdate={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

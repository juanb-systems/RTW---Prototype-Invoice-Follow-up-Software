"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  Phone,
  PhoneCall,
  PhoneMissed,
  Voicemail,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { MessageClassification, CallStatus } from "@/lib/types";

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
  type?: "email" | "call";
  callStatus?: CallStatus;
  callOutcome?: string;
  transcript?: string;
};

// ── Email classification config ───────────────────────────────────────────────

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

// ── Call status config ────────────────────────────────────────────────────────

const callStatusConfig: Record<
  CallStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  completed:    { label: "Completed",          color: "bg-green-100 text-green-700 border-green-200",  icon: PhoneCall },
  no_answer:    { label: "No Answer",          color: "bg-gray-100 text-gray-600 border-gray-200",    icon: PhoneMissed },
  voicemail:    { label: "Voicemail Left",     color: "bg-blue-100 text-blue-700 border-blue-200",    icon: Voicemail },
  needs_review: { label: "Needs Human Review", color: "bg-red-100 text-red-700 border-red-200",       icon: UserCheck },
};

const callOutcomeClassColor: Record<MessageClassification, string> = {
  promise_to_pay: "bg-green-100 text-green-700 border-green-200",
  dispute:        "bg-red-100 text-red-700 border-red-200",
  out_of_office:  "bg-gray-100 text-gray-600 border-gray-200",
  payment_query:  "bg-blue-100 text-blue-700 border-blue-200",
  unclassified:   "bg-gray-100 text-gray-500 border-gray-200",
};

// ── Call record card ──────────────────────────────────────────────────────────

function CallCard({
  message,
  isSelected,
  onSelect,
  onPatch,
}: {
  message: Message;
  isSelected: boolean;
  onSelect: () => void;
  onPatch: (changes: Partial<Message>) => void;
}) {
  const [pausing, setPausing] = useState(false);

  const callCfg = callStatusConfig[message.callStatus ?? "completed"] ?? callStatusConfig.completed;
  const CallStatusIcon = callCfg.icon;
  const outcomeCls = callOutcomeClassColor[message.classification] ?? callOutcomeClassColor.unclassified;

  function handleClick() {
    onSelect();
    if (!message.isRead) onPatch({ isRead: true });
  }

  async function pauseAutomation() {
    setPausing(true);
    onPatch({ automationPaused: true, isRead: true });
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: message.id, automationPaused: true, isRead: true }),
    });
    setPausing(false);
  }

  return (
    <div
      id={`msg-${message.id}`}
      className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        isSelected
          ? "border-green-400 ring-2 ring-green-200 shadow-md"
          : !message.isRead
          ? "border-green-300"
          : "border-gray-200"
      }`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer select-none"
        onClick={handleClick}
      >
        {/* Unread indicator */}
        <div className="mt-1 flex-shrink-0">
          {!message.isRead ? (
            <div className="h-2 w-2 rounded-full bg-green-500" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-gray-200" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Phone className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                <p className={`text-sm truncate ${!message.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                  {message.subject}
                </p>
              </div>
              <p className="text-xs text-gray-400">{message.from}</p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(message.receivedAt)}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${callCfg.color}`}>
              <CallStatusIcon className="h-3 w-3" />
              {callCfg.label}
            </div>
            {message.callOutcome && (
              <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${outcomeCls}`}>
                <BrainCircuit className="h-3 w-3" />
                {message.callOutcome}
              </div>
            )}
            {message.automationPaused && (
              <div className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                <PauseCircle className="h-3 w-3" />
                Automation paused
              </div>
            )}
          </div>

          {message.invoice && (
            <p className="mt-1 text-xs text-gray-400">
              Re:{" "}
              <Link
                href={`/invoices/${message.invoiceId}`}
                className="text-blue-500 hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {message.invoice.invoiceNumber}
              </Link>
              {" · "}
              {message.contact?.name}
              {" · "}
              {formatCurrency(message.invoice.amount)}
            </p>
          )}
        </div>

        <div className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5 pointer-events-none">
          {isSelected ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded transcript */}
      {isSelected && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {message.callStatus === "needs_review" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
              <UserCheck className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                This call needs human review. Automation has been paused.
              </p>
            </div>
          )}
          {message.classification === "dispute" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                Dispute detected on this call. Follow-up paused — this invoice needs human review.
              </p>
            </div>
          )}
          {message.classification === "promise_to_pay" && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700 font-medium">
                AI call recorded a promise to pay. Automation is on hold pending payment.
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Call Transcript</p>
            <div className="rounded-md bg-gray-50 border border-gray-100 p-3 max-h-72 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed">
                {message.transcript || message.body}
              </pre>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {!message.automationPaused && (
              <button
                onClick={(e) => { e.stopPropagation(); pauseAutomation(); }}
                disabled={pausing}
                className="flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
              >
                <PauseCircle className="h-3.5 w-3.5" />
                {pausing ? "Pausing..." : "Pause Automation"}
              </button>
            )}
            <Link
              href={`/invoices/${message.invoiceId}`}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              onClick={(e) => e.stopPropagation()}
            >
              View Invoice →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Email message card ────────────────────────────────────────────────────────

function MessageCard({
  message,
  isSelected,
  onSelect,
  onPatch,
}: {
  message: Message;
  isSelected: boolean;
  onSelect: () => void;
  onPatch: (changes: Partial<Message>) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [replying, setReplying] = useState(false);

  const cfg = classificationConfig[message.classification] ?? classificationConfig.unclassified;
  const Icon = cfg.icon;

  function handleClick() {
    onSelect();
    if (!message.isRead) onPatch({ isRead: true });
  }

  async function pauseAutomation() {
    setPausing(true);
    onPatch({ automationPaused: true, isRead: true });
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: message.id, automationPaused: true, isRead: true }),
    });
    setPausing(false);
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    setReplying(true);
    onPatch({ isReplied: true, isRead: true });
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: message.id, isReplied: true, isRead: true }),
    });
    setReplyText("");
    setShowReply(false);
    setReplying(false);
  }

  return (
    <div
      id={`msg-${message.id}`}
      className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        isSelected
          ? "border-blue-400 ring-2 ring-blue-200 shadow-md"
          : !message.isRead
          ? "border-blue-200"
          : "border-gray-200"
      }`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer select-none"
        onClick={handleClick}
      >
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
            <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(message.receivedAt)}</span>
          </div>

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

          {message.invoice && (
            <p className="mt-1 text-xs text-gray-400">
              Re:{" "}
              <Link
                href={`/invoices/${message.invoiceId}`}
                className="text-blue-500 hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {message.invoice.invoiceNumber}
              </Link>
              {" · "}
              {message.contact?.name}
              {" · "}
              {formatCurrency(message.invoice.amount)}
            </p>
          )}
        </div>

        <div className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5 pointer-events-none">
          {isSelected ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {isSelected && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
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

          <div className="rounded-md bg-gray-50 p-3">
            <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed">
              {message.body}
            </pre>
          </div>

          <div className="flex gap-2 flex-wrap">
            {!message.automationPaused && (
              <button
                onClick={(e) => { e.stopPropagation(); pauseAutomation(); }}
                disabled={pausing}
                className="flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
              >
                <PauseCircle className="h-3.5 w-3.5" />
                {pausing ? "Pausing..." : "Pause Automation"}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowReply(!showReply); }}
              className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
            <Link
              href={`/invoices/${message.invoiceId}`}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              onClick={(e) => e.stopPropagation()}
            >
              View Invoice →
            </Link>
          </div>

          {showReply && (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
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

// ── Page content ──────────────────────────────────────────────────────────────

function InboxPageContent() {
  const searchParams = useSearchParams();
  const focusedMessageId = searchParams.get("message");

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const deepLinkInitialized = useRef(false);

  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/inbox");
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  }, []);

  // Initial load only
  useEffect(() => { load(); }, [load]);

  // Initialize selected message from deep link query param (once, after first load)
  useEffect(() => {
    if (!loading && focusedMessageId && !deepLinkInitialized.current) {
      setSelectedMessageId(focusedMessageId);
      deepLinkInitialized.current = true;
    }
  }, [loading, focusedMessageId]);

  // Scroll to selected message when it changes (handles both deep links and normal clicks)
  useEffect(() => {
    if (!selectedMessageId || loading) return;
    const el = document.getElementById(`msg-${selectedMessageId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedMessageId, loading]);

  // Optimistic local update + background API sync — no re-fetch, no loading flash
  function patchMessage(id: string, changes: Partial<Message>) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...changes } : m));
    fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    });
  }

  function toggleSelect(id: string) {
    setSelectedMessageId(prev => (prev === id ? null : id));
  }

  const emailMessages = messages.filter(m => !m.type || m.type === "email");
  const callMessages  = messages.filter(m => m.type === "call");
  const unread = messages.filter(m => !m.isRead).length;

  const filtered = messages
    .filter(m => {
      if (filter === "all") return true;
      if (filter === "calls") return m.type === "call";
      if (filter === "emails") return !m.type || m.type === "email";
      if (filter === "unread") return !m.isRead;
      return m.classification === filter;
    })
    .filter(m => {
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const classLabel = (classificationConfig[m.classification]?.label ?? m.classification).toLowerCase();
      const callLabel  = m.callStatus ? (callStatusConfig[m.callStatus]?.label ?? "").toLowerCase() : "";
      return (
        m.from.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (m.transcript ?? "").toLowerCase().includes(q) ||
        (m.callOutcome ?? "").toLowerCase().includes(q) ||
        (m.invoice?.invoiceNumber ?? "").toLowerCase().includes(q) ||
        (m.contact?.name ?? "").toLowerCase().includes(q) ||
        (m.contact?.company ?? "").toLowerCase().includes(q) ||
        m.classification.toLowerCase().includes(q) ||
        classLabel.includes(q) ||
        callLabel.includes(q)
      );
    })
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  const filterTabs = [
    { value: "all",            label: "All" },
    { value: "emails",         label: `Emails (${emailMessages.length})` },
    { value: "calls",          label: `AI Calls (${callMessages.length})` },
    { value: "unread",         label: "Unread" },
    { value: "promise_to_pay", label: "Promise to Pay" },
    { value: "dispute",        label: "Disputes" },
    { value: "payment_query",  label: "Queries" },
    { value: "out_of_office",  label: "Out of Office" },
    { value: "unclassified",   label: "Unclassified" },
  ];

  return (
    <div>
      <TopBar
        title="Inbox"
        subtitle={`${unread} unread · ${emailMessages.length} email${emailMessages.length !== 1 ? "s" : ""} · ${callMessages.length} AI call${callMessages.length !== 1 ? "s" : ""}`}
        actions={
          <button
            onClick={load}
            title="Refresh"
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />
      <div className="p-4 sm:p-6 space-y-5">
        {/* AI notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 flex items-start gap-3">
            <BrainCircuit className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-700">
              <strong>AI email classification is active.</strong> Replies are classified as promises to pay,
              disputes, out-of-office, or payment queries. Automations are held when a promise or dispute is detected.
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-3">
            <Phone className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-700">
              <strong>AI call transcripts appear here.</strong> Each call outcome is classified and logged.
              Disputes and promises to pay automatically pause automation follow-ups.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search sender, subject, transcript, invoice…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-gray-200 pl-8 pr-8 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => { clear(); searchRef.current?.focus(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 shrink-0 ml-auto">
              {loading ? "Loading…" : `Showing ${filtered.length} of ${messages.length}`}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.value
                  ? tab.value === "calls" ? "bg-green-600 text-white" : "bg-blue-600 text-white"
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

        {/* List */}
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
            {filtered.map((message) =>
              message.type === "call" ? (
                <CallCard
                  key={message.id}
                  message={message}
                  isSelected={message.id === selectedMessageId}
                  onSelect={() => toggleSelect(message.id)}
                  onPatch={(changes) => patchMessage(message.id, changes)}
                />
              ) : (
                <MessageCard
                  key={message.id}
                  message={message}
                  isSelected={message.id === selectedMessageId}
                  onSelect={() => toggleSelect(message.id)}
                  onPatch={(changes) => patchMessage(message.id, changes)}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense>
      <InboxPageContent />
    </Suspense>
  );
}

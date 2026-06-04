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
  Mail,
  ArrowLeft,
  Inbox as InboxIcon,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import { formatDateTime, formatCurrency, agingColor } from "@/lib/utils";
import type { MessageClassification, CallStatus } from "@/lib/types";

type CustomerAccountContext = {
  overdueCount: number;
  totalOverdueBalance: number;
  maxDaysPastDue: number;
  overdueInvoices: { id: string; invoiceNumber: string; amount: number; daysPastDue: number; status: string }[];
};

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
  customerAccount?: CustomerAccountContext | null;
};

// ── Configs (used for search label lookups) ───────────────────────────────────

const classificationConfig: Record<MessageClassification, { label: string }> = {
  promise_to_pay: { label: "Promise to Pay" },
  dispute:        { label: "Dispute" },
  out_of_office:  { label: "Out of Office" },
  payment_query:  { label: "Payment Query" },
  unclassified:   { label: "Unclassified" },
};

const callStatusConfig: Record<CallStatus, { label: string }> = {
  completed:    { label: "Completed" },
  no_answer:    { label: "No Answer" },
  voicemail:    { label: "Voicemail Left" },
  needs_review: { label: "Needs Human Review" },
};

// ── TranscriptView ─────────────────────────────────────────────────────────────

function TranscriptView({ text }: { text: string }) {
  const lines = (text || "").split("\n").map(l => l.trim()).filter(Boolean);
  // seeded data uses "Contact:" for customer; also handle "Customer:" for future data
  const hasSpeakers = lines.some(l => /^(AI( caller)?|Customer|Contact):/i.test(l));

  if (!hasSpeakers) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-4 max-h-96 overflow-y-auto">
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {lines.map((line, i) => {
        const aiMatch   = line.match(/^(AI( caller)?): /i);
        // recognise both "Customer:" and "Contact:" as the human speaker
        const custMatch = line.match(/^(Customer|Contact): /i);

        if (aiMatch) {
          return (
            <div key={i} className="rounded-lg bg-green-50 border border-green-100 px-3 py-2.5">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">AI Caller</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {line.slice(aiMatch[0].length)}
              </p>
            </div>
          );
        }
        if (custMatch) {
          return (
            <div key={i} className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Customer</p>
              <p className="text-sm text-gray-800 leading-relaxed italic">
                {line.slice(custMatch[0].length)}
              </p>
            </div>
          );
        }
        return (
          <p key={i} className="text-xs text-gray-400 italic px-1">{line}</p>
        );
      })}
    </div>
  );
}

// ── AI Overview (generated from classification/callStatus, no real AI) ────────

function AIOverview({ message }: { message: Message }) {
  const isCall      = message.type === "call";
  const isVoicemail = message.callStatus === "voicemail";
  const isNoAnswer  = message.callStatus === "no_answer";
  const paused      = message.automationPaused;

  let points: string[];

  if (!isCall) {
    // Email reply
    switch (message.classification) {
      case "promise_to_pay":
        points = [
          "Customer promised to pay this invoice.",
          "Automation is on hold for 7 days while payment is monitored.",
          "Recommended: Monitor and resume automation if unpaid after the promised date.",
        ];
        break;
      case "dispute":
        points = [
          "Customer has raised a dispute about this invoice.",
          "All automated follow-ups are paused until this is resolved.",
          "Recommended: Review the invoice and contact the customer directly.",
        ];
        break;
      case "out_of_office":
        points = [
          "Customer is currently out of office.",
          paused
            ? "Automation is on hold until they return."
            : "Automation will hold until the customer is back.",
          "Recommended: Check the return date in their reply and follow up then.",
        ];
        break;
      case "payment_query":
        points = [
          "Customer has a question about this invoice.",
          "Recommended: Reply with the full invoice breakdown before sending more reminders.",
        ];
        break;
      default:
        points = [
          "A reply was received but could not be automatically classified.",
          "Recommended: Review this message and decide on the next step.",
        ];
    }
  } else if (isVoicemail) {
    points = [
      "The AI caller reached voicemail and left a message.",
      "The customer has not yet responded.",
      "Recommended: Follow up manually if no callback within 2 business days.",
    ];
  } else if (isNoAnswer) {
    points = [
      "The AI caller did not reach the contact — no answer.",
      "No message was left.",
      "Recommended: Retry at a different time or follow up via email.",
    ];
  } else {
    // Completed call
    switch (message.classification) {
      case "promise_to_pay":
        points = [
          "AI call completed. The customer promised to pay this invoice.",
          "Automation is on hold while payment is monitored.",
          "Recommended: Monitor the payment date and resume automation if unpaid.",
        ];
        break;
      case "dispute":
        points = [
          "AI call completed. The customer raised a dispute during the call.",
          "Automation is paused. This invoice needs human review.",
          "Recommended: Contact the customer directly to resolve the dispute.",
        ];
        break;
      default:
        if (message.callStatus === "needs_review") {
          points = [
            "AI call completed but the outcome was unclear.",
            "Automation is paused pending human review.",
            "Recommended: Review the call transcript below and decide on next steps.",
          ];
        } else {
          points = [
            "AI call was completed with this contact.",
            message.callOutcome
              ? `Detected: ${message.callOutcome}.`
              : "No specific outcome was captured.",
          ];
        }
    }
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2.5">AI Overview</p>
      <ul className="space-y-1.5">
        {points.map((pt, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-blue-300 mt-1 flex-shrink-0 text-xs">·</span>
            <p className="text-sm text-blue-900 leading-snug">{pt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── MessageDetail ──────────────────────────────────────────────────────────────

function MessageDetail({
  message,
  onClose,
  onPatch,
}: {
  message: Message;
  onClose: () => void;
  onPatch: (changes: Partial<Message>) => void;
}) {
  const [showReply, setShowReply]     = useState(false);
  const [replyText, setReplyText]     = useState("");
  const [pausing, setPausing]         = useState(false);
  const [replying, setReplying]       = useState(false);
  // showContent removed — message/transcript always visible

  const isCall      = message.type === "call";
  const isVoicemail = message.callStatus === "voicemail";
  const TypeIcon    = isVoicemail ? Voicemail : isCall ? Phone : Mail;
  // voicemail/no-answer never reach MessageDetail (filtered at source)
  const typeLabel = isCall ? "Customer call transcript" : "Email Reply";
  const typeColor   = isCall ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";

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

  // Exception warning — ONLY for genuinely high-risk exceptions that the AI Overview alone
  // may not convey urgently enough. Normal outcomes (promise, OOO, query) are fully covered
  // by AI Overview — no separate banner needed.
  const exceptionWarning = (() => {
    if (message.classification === "dispute")
      return { text: "Dispute raised — review this invoice before sending more reminders. Automation is paused.", urgent: true };
    if (isCall && message.callStatus === "needs_review")
      return { text: "This call needs human review. Automation is paused until you decide on the next step.", urgent: true };
    return null;
  })();

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Inbox</span>
          <span className="sm:hidden">Back</span>
        </button>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor}`}>
          <TypeIcon className="h-3 w-3" />
          {typeLabel}
        </span>
        {!message.isRead && (
          <span className="ml-auto text-xs font-medium text-blue-500">Unread</span>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">

        {/* 1. AI Overview — answer first, raw content second */}
        <AIOverview message={message} />

        {/* 2. Subject + sender + date — context after the summary */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 leading-snug mb-1.5">
            {message.subject}
          </h2>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
            <span className="font-medium text-gray-800">{message.contact?.name || message.from}</span>
            {message.contact?.company && (
              <span className="text-gray-400">· {message.contact.company}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{formatDateTime(message.receivedAt)}</p>
        </div>

        {/* 3. Customer account context — shown when contact has multiple overdue invoices */}
        {message.customerAccount && message.customerAccount.overdueCount > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Customer Account
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {message.contact?.name}
                  {message.contact?.company && (
                    <span className="font-normal text-gray-500"> · {message.contact.company}</span>
                  )}
                </p>
              </div>
              <Link
                href={`/contacts/${message.contactId}`}
                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap flex-shrink-0"
              >
                View account →
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`text-sm font-bold ${agingColor(message.customerAccount.maxDaysPastDue)}`}>
                {formatCurrency(message.customerAccount.totalOverdueBalance)}
              </span>
              <span className="text-xs text-gray-400">
                overdue across {message.customerAccount.overdueCount} invoice{message.customerAccount.overdueCount !== 1 ? "s" : ""}
              </span>
            </div>
            {message.customerAccount.overdueCount > 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {message.customerAccount.overdueInvoices.map(inv => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    <span className="font-mono font-medium">{inv.invoiceNumber}</span>
                    <span className="text-gray-400">{formatCurrency(inv.amount)}</span>
                    <span className={`font-medium ${agingColor(inv.daysPastDue)}`}>{inv.daysPastDue}d</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Invoice link */}
        {message.invoice && (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-sm font-semibold text-gray-800">{message.invoice.invoiceNumber}</span>
              <span className="text-sm text-gray-500">{formatCurrency(message.invoice.amount)}</span>
              {message.contact?.company && (
                <span className="hidden sm:inline text-sm text-gray-400">· {message.contact.company}</span>
              )}
            </div>
            <Link
              href={`/invoices/${message.invoiceId}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap ml-4 flex-shrink-0"
            >
              View invoice →
            </Link>
          </div>
        )}

        {/* 5. Message / transcript — always visible, no accordion */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {isCall ? "Call Transcript" : "Message"}
            </p>
          </div>
          <div className="px-4 py-4">
            {isCall
              ? <TranscriptView text={message.transcript || message.body} />
              : <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{message.body}</p>
            }
          </div>
        </div>

        {/* 6. Exception warning — only for dispute or needs_review (high-risk).
               Normal outcomes (promise, OOO, payment query) are covered by AI Overview alone. */}
        {exceptionWarning && (
          <div className={`rounded-lg border px-4 py-3 ${
            exceptionWarning.urgent ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
          }`}>
            <p className={`text-sm font-medium ${exceptionWarning.urgent ? "text-red-700" : "text-amber-700"}`}>
              {exceptionWarning.text}
            </p>
          </div>
        )}

        {/* Reply form */}
        {!isCall && showReply && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reply</p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${message.from}…`}
              rows={4}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={sendReply}
                disabled={replying || !replyText.trim()}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {replying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Reply className="h-3.5 w-3.5" />}
                {replying ? "Sending…" : "Send Reply (simulated)"}
              </button>
              <button
                onClick={() => setShowReply(false)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action footer ── */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3 flex gap-2 flex-wrap items-center">
        {!message.automationPaused && (
          <button
            onClick={pauseAutomation}
            disabled={pausing}
            className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-colors"
          >
            <PauseCircle className="h-3.5 w-3.5" />
            {pausing ? "Pausing…" : "Pause Automation"}
          </button>
        )}
        {message.automationPaused && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
            <PauseCircle className="h-3.5 w-3.5" />
            Automation paused
          </span>
        )}
        {!isCall && !showReply && (
          <button
            onClick={() => setShowReply(true)}
            className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Reply className="h-3.5 w-3.5" />
            Reply
          </button>
        )}
        <button
          onClick={onClose}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="hidden sm:inline">Back to inbox</span>
          <span className="sm:hidden">Back</span>
        </button>
      </div>
    </div>
  );
}

// ── InboxRow — simplified, no inline expansion ────────────────────────────────

function InboxRow({
  message,
  isSelected,
  onClick,
}: {
  message: Message;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isCall      = message.type === "call";
  const isVoicemail = message.callStatus === "voicemail";
  const TypeIcon    = isVoicemail ? Voicemail : isCall ? Phone : Mail;
  const typeColor   = isCall ? "text-green-500" : "text-blue-400";
  const senderName  = message.contact?.name || message.from;
  const company     = message.contact?.company;
  const preview     = (message.transcript || message.body || "").replace(/\n/g, " ").trim();

  const badge = (() => {
    if (message.classification === "dispute")        return { label: "Dispute",        cls: "bg-red-100 text-red-700" };
    if (message.automationPaused)                    return { label: "Paused",          cls: "bg-amber-100 text-amber-700" };
    if (message.callStatus === "needs_review")       return { label: "Needs Review",    cls: "bg-red-100 text-red-700" };
    if (message.classification === "promise_to_pay") return { label: "Promise to Pay",  cls: "bg-green-100 text-green-700" };
    if (message.callStatus === "voicemail")          return { label: "Voicemail",       cls: "bg-blue-100 text-blue-600" };
    if (message.classification === "payment_query")  return { label: "Payment Query",   cls: "bg-blue-100 text-blue-600" };
    return null;
  })();

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex items-start gap-2.5 px-4 py-3.5 cursor-pointer select-none transition-colors ${
        isSelected
          ? "bg-blue-50/70 border-l-[3px] border-l-blue-500"
          : "hover:bg-gray-50/70"
      }`}
      onClick={onClick}
    >
      {/* Unread dot */}
      <div className="w-3 flex-shrink-0 flex items-center justify-center pt-2">
        {!message.isRead && <div className="h-2 w-2 rounded-full bg-blue-500" />}
      </div>

      {/* Source icon */}
      <div className="flex-shrink-0 pt-0.5">
        <TypeIcon className={`h-4 w-4 ${typeColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Line 1: Sender · Company | Badge + Date */}
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-sm truncate ${!message.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-600"}`}>
            {senderName}
            {company && <span className="ml-1.5 font-normal text-xs text-gray-400">· {company}</span>}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {badge && (
              <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                {badge.label}
              </span>
            )}
            <span className={`text-xs whitespace-nowrap ${!message.isRead ? "font-medium text-gray-700" : "text-gray-400"}`}>
              {formatDateTime(message.receivedAt)}
            </span>
          </div>
        </div>

        {/* Line 2: Subject */}
        <p className={`text-xs mt-0.5 truncate ${!message.isRead ? "font-semibold text-gray-800" : "text-gray-500"}`}>
          {message.subject}
        </p>

        {/* Line 3: Preview (desktop only) */}
        {preview && (
          <p className="hidden sm:block text-xs text-gray-400 mt-0.5 truncate">
            {preview.slice(0, 120)}
          </p>
        )}

        {/* Mobile badge */}
        {badge && (
          <span className={`sm:hidden mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Filter dropdown ───────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: "unread",         label: "Unread" },
  { value: "dispute",        label: "Disputes" },
  { value: "promise_to_pay", label: "Promises" },
  { value: "payment_query",  label: "Payment Questions" },
  { value: "needs_action",   label: "Needs Action" },
];

function FilterDropdown({
  filter,
  onFilter,
  unread,
}: {
  filter: string;
  onFilter: (f: string) => void;
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const dropRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const active    = FILTER_OPTIONS.find(o => o.value === filter);
  const isFiltered = filter !== "all";

  return (
    <div ref={dropRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          isFiltered
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="hidden xs:inline sm:inline">
          {isFiltered ? active?.label : "Filter"}
        </span>
        <span className="xs:hidden sm:hidden">
          {isFiltered ? active?.label : "Filter"}
        </span>
        {isFiltered && filter === "unread" && unread > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {isFiltered && (
            <>
              <button
                onClick={() => { onFilter("all"); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <X className="h-3.5 w-3.5 flex-shrink-0" />
                Clear filter
              </button>
              <div className="border-t border-gray-100" />
            </>
          )}
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onFilter(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{opt.label}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {opt.value === "unread" && unread > 0 && (
                  <span className="text-[10px] text-gray-400">{unread}</span>
                )}
                {filter === opt.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page content ──────────────────────────────────────────────────────────────

function InboxPageContent() {
  const searchParams    = useSearchParams();
  const focusedId       = searchParams.get("message");

  const [messages, setMessages]               = useState<Message[]>([]);
  const [loading, setLoading]                 = useState(true);
  // Initialise filter from URL param so Dashboard "View all →" links land pre-filtered
  const [filter, setFilter]                   = useState<string>(searchParams.get("filter") ?? "all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [mobileView, setMobileView]           = useState<"list" | "detail">("list");
  const deepLinkDone                          = useRef(false);

  const { query, setQuery, clear } = useSearchStore();
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/inbox");
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Deep-link: open detail for a specific message on first load
  useEffect(() => {
    if (!loading && focusedId && !deepLinkDone.current) {
      const msg = messages.find(m => m.id === focusedId);
      if (msg) {
        setSelectedMessage(msg);
        setMobileView("detail");
        if (!msg.isRead) patchMessage(msg.id, { isRead: true });
      }
      deepLinkDone.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, focusedId, messages]);

  function patchMessage(id: string, changes: Partial<Message>) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...changes } : m));
    setSelectedMessage(prev => prev?.id === id ? { ...prev, ...changes } : prev);
    fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    });
  }

  function handleSelectMessage(msg: Message) {
    setSelectedMessage(msg);
    setMobileView("detail");
    if (!msg.isRead) patchMessage(msg.id, { isRead: true });
  }

  function handleCloseDetail() {
    setSelectedMessage(null);
    setMobileView("list");
  }

  function handleFilterChange(newFilter: string) {
    setFilter(newFilter);
    // Clear the detail panel when filter changes — avoids showing a message
    // that no longer appears in the filtered list
    setSelectedMessage(null);
    setMobileView("list");
  }

  // Inbox = email replies only.
  // All call-type messages (voicemail, no-answer, transcripts) belong in Actions,
  // not Inbox. Call outcomes surface on the Invoice Detail customer reply panel
  // and in the Actions page lookup results.
  const isCallMessage = (m: Message) => m.type === "call";

  const emailMessages = messages.filter(m => !isCallMessage(m));
  const unread        = messages.filter(m => !m.isRead && !isCallMessage(m)).length;

  const filtered = messages
    .filter(m => {
      // Inbox is email-only — all calls excluded from every view
      if (isCallMessage(m)) return false;

      if (filter === "all")          return true;
      if (filter === "emails")       return true;   // same as all (calls already gone)
      if (filter === "unread")       return !m.isRead;
      if (filter === "needs_action") return m.automationPaused === true;
      return m.classification === filter;
    })
    .filter(m => {
      if (!query.trim()) return true;
      const q         = query.toLowerCase().trim();
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

  // filterTabs removed — filter options moved to FilterDropdown component

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Inbox"
        subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
        description="Customer email replies — disputes, payment promises, and questions. AI call outcomes appear in Actions."
        actions={
          <button
            onClick={load}
            title="Refresh inbox"
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      {/* ── Two-panel layout ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Inbox list */}
        <div className={`flex flex-col overflow-hidden border-r border-gray-200 bg-white ${
          mobileView === "detail"
            ? "hidden md:flex md:w-2/5 lg:w-[380px] md:flex-none"
            : "flex w-full md:w-2/5 lg:w-[380px] md:flex-none"
        }`}>

          {/* Search + filter — single combined row */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0 flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search sender, subject, transcript…"
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
            <FilterDropdown
              filter={filter}
              onFilter={handleFilterChange}
              unread={unread}
            />
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="px-4 py-3 flex gap-2.5 animate-pulse">
                    <div className="w-3 h-2 rounded-full bg-gray-100 mt-2 flex-shrink-0" />
                    <div className="w-4 h-4 rounded bg-gray-100 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <InboxIcon className="h-8 w-8 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">
                  {query
                    ? `No messages match "${query}".`
                    : filter === "calls"
                    ? "No customer call transcripts to review."
                    : "No messages in this category."}
                </p>
                {query && (
                  <button onClick={clear} className="mt-2 text-xs text-blue-500 hover:underline">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map(msg => (
                  <InboxRow
                    key={msg.id}
                    message={msg}
                    isSelected={selectedMessage?.id === msg.id}
                    onClick={() => handleSelectMessage(msg)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Count footer */}
          {!loading && emailMessages.length > 0 && (
            <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2 bg-gray-50/50 flex items-center justify-between">
              <p className="text-[11px] text-gray-400">
                {filtered.length} of {emailMessages.length}
              </p>
              <p className="text-[11px] text-gray-400">
                {emailMessages.length} email repl{emailMessages.length !== 1 ? "ies" : "y"}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Detail panel */}
        {selectedMessage ? (
          <div className={`overflow-hidden flex-1 ${mobileView === "list" ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
            <MessageDetail
              message={selectedMessage}
              onClose={handleCloseDetail}
              onPatch={changes => patchMessage(selectedMessage.id, changes)}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50/20 text-center px-8">
            <InboxIcon className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-400 mb-1">No message selected</p>
            <p className="text-xs text-gray-400">
              Select a message from the list to view the full details.
            </p>
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

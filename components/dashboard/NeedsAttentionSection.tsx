"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldX, AlertTriangle, AlertCircle, Clock,
  CheckCircle2, PauseCircle, MessageSquare, ThumbsUp,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  AttentionDetails,
  AttentionInvItem,
  AttentionActionItem,
  AttentionMsgItem,
} from "@/lib/server-data";

type CardKey = keyof AttentionDetails;

// ── Card config ────────────────────────────────────────────────────────────────

const CONFIGS: Record<CardKey, {
  label: string;
  description: string;
  iconBg: string;
  border: string;
  urgentBg: string;
  Icon: React.ElementType;
  urgent?: boolean;
  viewAllHref: string;
}> = {
  disputes: {
    label: "customer dispute(s)",
    description: "Automation paused — review account before sending more reminders.",
    iconBg: "bg-red-500", border: "border-red-200", urgentBg: "bg-red-50",
    Icon: ShieldX, urgent: true,
    viewAllHref: "/invoices?filter=disputed",
  },
  blocked: {
    label: "action(s) blocked",
    description: "A safety check blocked an automated action.",
    iconBg: "bg-red-400", border: "border-red-200", urgentBg: "bg-red-50",
    Icon: AlertTriangle, urgent: true,
    viewAllHref: "/scheduled?filter=blocked",
  },
  overdue60plus: {
    label: "account(s) overdue 60+ days",
    description: "High risk — consider escalation or write-off review.",
    iconBg: "bg-red-500", border: "border-red-200", urgentBg: "bg-red-50",
    Icon: AlertCircle, urgent: true,
    viewAllHref: "/invoices?filter=overdue",
  },
  overdue30to60: {
    label: "account(s) overdue 30–60 days",
    description: "May need a personal call or escalation.",
    iconBg: "bg-orange-400", border: "border-gray-200", urgentBg: "bg-white",
    Icon: Clock,
    viewAllHref: "/invoices?filter=overdue",
  },
  awaitingApproval: {
    label: "action(s) need approval",
    description: "Actions waiting for your approval.",
    iconBg: "bg-purple-500", border: "border-gray-200", urgentBg: "bg-white",
    Icon: CheckCircle2,
    viewAllHref: "/scheduled?filter=awaiting_approval",
  },
  pausedAutomations: {
    label: "automation(s) paused",
    description: "Customer replied — automation on hold.",
    iconBg: "bg-amber-500", border: "border-gray-200", urgentBg: "bg-white",
    Icon: PauseCircle,
    viewAllHref: "/inbox?filter=needs_action",
  },
  unreadReplies: {
    label: "new customer replies",
    description: "New replies or messages from customers.",
    iconBg: "bg-blue-500", border: "border-gray-200", urgentBg: "bg-white",
    Icon: MessageSquare,
    viewAllHref: "/inbox?filter=unread",
  },
  promisesToPay: {
    label: "promise(s) to pay",
    description: "Customer confirmed payment — monitor and follow up.",
    iconBg: "bg-green-500", border: "border-gray-200", urgentBg: "bg-white",
    Icon: ThumbsUp,
    viewAllHref: "/inbox?filter=promise_to_pay",
  },
};

// ── Item renderers ─────────────────────────────────────────────────────────────

function InvItemRow({ item, cardKey }: { item: AttentionInvItem; cardKey: CardKey }) {
  const actionLabel = cardKey === "disputes" ? "Review dispute" : "View invoice";
  return (
    // Whole row is a link — no nested links needed
    <Link
      href={`/invoices/${item.id}`}
      className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer -mx-3 px-3 rounded"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {item.invoiceNumber}
          {item.contactName !== "Unknown" && (
            <span className="font-normal text-gray-500"> · {item.contactName}</span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs font-medium text-gray-700">{formatCurrency(item.amount)}</span>
          {item.daysPastDue > 0 && (
            <span className="text-xs text-red-600 font-medium">{item.daysPastDue} days overdue</span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-xs font-medium text-blue-600 whitespace-nowrap">
        {actionLabel} →
      </span>
    </Link>
  );
}

function ActionItemRow({ item }: { item: AttentionActionItem }) {
  const typeLabel = item.stepType === "email" ? "Email" : item.stepType === "sms" ? "SMS" : item.stepType === "call" ? "AI Call" : item.stepType;
  const reason = item.lookupReason ?? item.skipReason ?? "Safety check result";
  return (
    <Link
      href={`/scheduled`}
      className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer -mx-3 px-3 rounded"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {typeLabel} · {item.invoiceNumber}
          {item.contactName !== "Unknown" && (
            <span className="font-normal text-gray-500"> · {item.contactName}</span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{reason}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-blue-600 whitespace-nowrap">
        View →
      </span>
    </Link>
  );
}

function MsgItemRow({ item }: { item: AttentionMsgItem }) {
  const classLabels: Record<string, string> = {
    promise_to_pay: "Promise to Pay",
    dispute: "Dispute",
    out_of_office: "Out of Office",
    payment_query: "Payment Query",
    unclassified: "Unclassified",
  };
  const classLabel = classLabels[item.classification] ?? item.classification;
  return (
    <Link
      href={`/inbox`}
      className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer -mx-3 px-3 rounded"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {item.contactName}
          {item.invoiceNumber !== "—" && (
            <span className="font-normal text-gray-500"> · {item.invoiceNumber}</span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subject || classLabel}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-blue-600 whitespace-nowrap">
        View reply →
      </span>
    </Link>
  );
}

// ── Single accordion card ──────────────────────────────────────────────────────

const MAX_PREVIEW = 3;

function AttentionCard({
  cardKey,
  items,
  isOpen,
  onToggle,
}: {
  cardKey: CardKey;
  items: AttentionInvItem[] | AttentionActionItem[] | AttentionMsgItem[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (items.length === 0) return null;
  const cfg = CONFIGS[cardKey];
  const { Icon } = cfg;

  // Invoice-type cards show unique customer/account count, not raw invoice count
  const isInvCard = cardKey === "disputes" || cardKey === "overdue60plus" || cardKey === "overdue30to60";
  const count = isInvCard
    ? new Set((items as AttentionInvItem[]).map(i => i.contactId)).size
    : items.length;

  const preview = items.slice(0, MAX_PREVIEW);
  const hasMore = items.length > MAX_PREVIEW;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      cfg.urgent ? `${cfg.border} ${cfg.urgentBg}` : "border-gray-200 bg-white"
    }`}>
      {/* ── Header ── */}
      <button
        className="w-full flex items-center gap-3 p-3.5 sm:p-4 text-left hover:bg-black/[0.04] transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">{count}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700">{cfg.label}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug hidden sm:block">{cfg.description}</p>
        </div>
        <div className="shrink-0 text-gray-400">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* ── Expanded items ── */}
      {isOpen && (
        <div className={`border-t px-4 pt-1.5 pb-3 ${cfg.urgent ? "border-gray-100 bg-black/[0.03]" : "border-gray-200 bg-gray-50"}`}>
          {(cardKey === "disputes" || cardKey === "overdue60plus" || cardKey === "overdue30to60")
            ? (preview as AttentionInvItem[]).map((item) => (
                <InvItemRow key={item.id} item={item} cardKey={cardKey} />
              ))
            : (cardKey === "blocked" || cardKey === "awaitingApproval")
            ? (preview as AttentionActionItem[]).map((item) => (
                <ActionItemRow key={item.id} item={item} />
              ))
            : (preview as AttentionMsgItem[]).map((item) => (
                <MsgItemRow key={item.id} item={item} />
              ))
          }
          {hasMore && (
            <Link
              href={cfg.viewAllHref}
              className="block text-center text-xs font-medium text-blue-600 hover:underline pt-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              View all {count} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────

// Promises to pay are GOOD NEWS — shown separately below, not as an alert
const CARD_ORDER: CardKey[] = [
  "disputes", "blocked",
  // overdue30to60 and overdue60plus merged into one combined card (see below)
  "awaitingApproval", "pausedAutomations", "unreadReplies",
];

export function NeedsAttentionSection({
  details,
}: {
  details: AttentionDetails;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Combined overdue items (30+ days), sorted by most overdue first
  const overdueItems: AttentionInvItem[] = [
    ...details.overdue60plus,
    ...details.overdue30to60,
  ].sort((a, b) => b.daysPastDue - a.daysPastDue);

  // Unique overdue customer count (one customer may have multiple overdue invoices)
  const overdueCustomerCount = new Set(overdueItems.map(i => i.contactId)).size;

  const alertCategories = CARD_ORDER.filter(k => details[k].length > 0).length
    + (overdueItems.length > 0 ? 1 : 0);

  const hasAnyAlerts = alertCategories > 0;

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="space-y-3">
      {/* ── Needs Attention box ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Needs Attention</h2>
            <p className="text-xs text-gray-400 mt-0.5">Act on these to keep your cash flow moving.</p>
          </div>
          {/* Show category count, not item total — much less alarming */}
          {alertCategories > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-100 px-2 text-xs font-bold text-red-600">
              {alertCategories}
            </span>
          )}
        </div>

        {!hasAnyAlerts ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">All clear</p>
              <p className="text-xs text-green-600 mt-0.5">No items currently need your attention.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Urgent cards first */}
            {CARD_ORDER.filter(k => k === "disputes" || k === "blocked").map((key) => (
              <AttentionCard
                key={key}
                cardKey={key}
                items={details[key] as AttentionInvItem[] & AttentionActionItem[] & AttentionMsgItem[]}
                isOpen={openKey === key}
                onToggle={() => toggle(key)}
              />
            ))}

            {/* Merged overdue card */}
            {overdueItems.length > 0 && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-3.5 sm:p-4 text-left hover:bg-black/[0.04] transition-colors"
                  onClick={() => toggle("overdue_combined")}
                  aria-expanded={openKey === "overdue_combined"}
                >
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-base sm:text-xl font-bold text-gray-900">{overdueCustomerCount}</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        customer{overdueCustomerCount !== 1 ? "s" : ""} overdue 30+ days
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-snug hidden xs:block sm:block">
                      {details.overdue60plus.length > 0
                        ? `${new Set(details.overdue60plus.map(i => i.contactId)).size} high risk (60+ days) · ${new Set(details.overdue30to60.map(i => i.contactId)).size} need follow-up`
                        : "May need a personal call or escalation."}
                    </p>
                  </div>
                  <div className="shrink-0 text-gray-400">
                    {openKey === "overdue_combined" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {openKey === "overdue_combined" && (
                  <div className="border-t border-orange-100 bg-black/[0.03] px-4 pt-1 pb-3">
                    {overdueItems.slice(0, 3).map((item) => (
                      <InvItemRow key={item.id} item={item} cardKey="overdue60plus" />
                    ))}
                    {overdueItems.length > 3 && (
                      <Link href="/invoices?filter=overdue" className="block text-center text-xs font-medium text-blue-600 hover:underline pt-2" onClick={(e) => e.stopPropagation()}>
                        View all {overdueCustomerCount} account{overdueCustomerCount !== 1 ? "s" : ""} →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Remaining alert cards */}
            {CARD_ORDER.filter(k => k !== "disputes" && k !== "blocked").map((key) => (
              <AttentionCard
                key={key}
                cardKey={key}
                items={details[key] as AttentionInvItem[] & AttentionActionItem[] & AttentionMsgItem[]}
                isOpen={openKey === key}
                onToggle={() => toggle(key)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Good news — promises to pay (not an alert, shown separately) ── */}
      {details.promisesToPay.length > 0 && (
        <Link
          href="/inbox?filter=promise_to_pay"
          className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 hover:bg-green-100 transition-colors"
        >
          <ThumbsUp className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">
              {details.promisesToPay.length} customer{details.promisesToPay.length !== 1 ? "s" : ""} promised to pay
            </p>
            <p className="text-[10px] sm:text-xs text-green-600 mt-0.5 hidden sm:block">Monitor and follow up when the payment date arrives.</p>
          </div>
          <span className="text-xs font-medium text-green-600 whitespace-nowrap shrink-0">View →</span>
        </Link>
      )}
    </div>
  );
}

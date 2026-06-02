"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
  ShieldX,
  PauseCircle,
  PlayCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { ScheduledAction, Invoice, Contact, AutomationFlow, LookupOutcome } from "@/lib/types";

type FullAction = ScheduledAction & {
  invoice?: Invoice;
  contact?: Contact;
  flow?: AutomationFlow;
};

const stepTypeConfig = {
  email: { icon: Mail, color: "text-blue-600", bg: "bg-blue-50", label: "Email" },
  sms: { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", label: "SMS" },
  call: { icon: Phone, color: "text-green-600", bg: "bg-green-50", label: "Call" },
};

const outcomeConfig: Record<LookupOutcome, { label: string; color: string; icon: React.ElementType }> = {
  proceed:           { label: "Safety check passed — cleared to send",   color: "text-green-700 bg-green-50 border-green-200",  icon: CheckCircle2 },
  skip:              { label: "Skipped — invoice is now paid",           color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: SkipForward },
  block:             { label: "Contact excluded from automations",        color: "text-red-700 bg-red-50 border-red-200",       icon: ShieldX },
  hold:              { label: "Automation paused",                        color: "text-orange-700 bg-orange-50 border-orange-200", icon: PauseCircle },
  awaiting_approval: { label: "Needs your approval to send",             color: "text-blue-700 bg-blue-50 border-blue-200",    icon: Clock },
};

const statusConfig = {
  pending:           { label: "Upcoming",        className: "bg-gray-100 text-gray-600 border-gray-200" },
  sent:              { label: "Sent",            className: "bg-green-100 text-green-700 border-green-200" },
  skipped:           { label: "Skipped",         className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  blocked:           { label: "Action blocked",  className: "bg-red-100 text-red-700 border-red-200" },
  approved:          { label: "Approved",        className: "bg-green-100 text-green-700 border-green-200" },
  awaiting_approval: { label: "Needs Approval",  className: "bg-blue-100 text-blue-700 border-blue-200" },
};

export function ScheduledActionCard({ action, onRefresh }: { action: FullAction; onRefresh: () => void }) {
  const [firing, setFiring]     = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [result, setResult]     = useState<{ outcome: LookupOutcome; reason: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const stepCfg   = stepTypeConfig[action.stepType as keyof typeof stepTypeConfig];
  const statusCfg = statusConfig[action.status] ?? statusConfig.pending;
  const Icon      = stepCfg?.icon ?? Mail;

  // Historical details that can be expanded (lookup result, skip reason)
  const hasDetails = !!(action.lookupResult || action.skipReason);

  async function handleFire() {
    setFiring(true);
    const res  = await fetch(`/api/scheduled/${action.id}/fire`, { method: "POST" });
    const data = await res.json();
    if (data.lookupResult) {
      setResult({ outcome: data.lookupResult.outcome, reason: data.lookupResult.reason });
    }
    setFiring(false);
    setTimeout(onRefresh, 1000);
  }

  async function handleSkip() {
    setSkipping(true);
    await fetch(`/api/scheduled/${action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "skipped", skipReason: "Manually skipped" }),
    });
    setSkipping(false);
    onRefresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ── Main row ── clicking this expands historical details */}
      <div
        className={`flex items-start gap-3 p-4 ${
          hasDetails ? "cursor-pointer hover:bg-gray-50/40 transition-colors" : ""
        }`}
        onClick={hasDetails ? () => setExpanded(p => !p) : undefined}
      >
        {/* Step type icon */}
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${stepCfg?.bg ?? "bg-gray-100"}`}>
          <Icon className={`h-4 w-4 ${stepCfg?.color ?? "text-gray-500"}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Status + type */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {stepCfg?.label ?? action.stepType} Action
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
          </div>

          {/* Contact · Invoice · Automation */}
          <div className="text-xs text-gray-500 space-y-0.5 mb-2">
            {(action.contact || action.invoice) && (
              <p className="flex flex-wrap items-center gap-1">
                {action.contact && (
                  <Link
                    href={`/contacts/${action.contactId}`}
                    className="font-medium text-gray-800 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {action.contact.name}
                  </Link>
                )}
                {action.invoice && (
                  <>
                    {action.contact && <span className="text-gray-300">·</span>}
                    <Link
                      href={`/invoices/${action.invoiceId}`}
                      className="font-medium text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {action.invoice.invoiceNumber}
                    </Link>
                    <span className="text-gray-700">{formatCurrency(action.invoice.amount)}</span>
                  </>
                )}
              </p>
            )}
            {action.flow && (
              <p className="text-gray-400">{action.flow.name}</p>
            )}
          </div>

          {/* Scheduled time */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <Clock className="h-3 w-3" />
            {formatDateTime(action.scheduledAt)}
          </div>

          {/* Live result after firing — always visible when present */}
          {result && (
            <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 mb-2 ${outcomeConfig[result.outcome]?.color ?? ""}`}>
              {(() => {
                const ResultIcon = outcomeConfig[result.outcome]?.icon ?? RefreshCw;
                return <ResultIcon className="h-3.5 w-3.5" />;
              })()}
              <p className="text-xs font-medium">{result.reason}</p>
            </div>
          )}

          {/* Action buttons — stopPropagation so they never trigger card expand */}
          {(action.status === "pending" || action.status === "awaiting_approval") && (
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleFire(); }}
                disabled={firing}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                {firing ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : action.status === "awaiting_approval" ? (
                  "Approve & Send"
                ) : (
                  "Send Now"
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                disabled={skipping}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Skip
              </button>
            </div>
          )}
        </div>

        {/* Expand/collapse chevron — only when historical details exist */}
        {hasDetails && (
          <button
            className="flex-shrink-0 self-start mt-0.5 flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(p => !p); }}
            title={expanded ? "Hide details" : "Show details"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* ── Expandable historical details ── */}
      {expanded && hasDetails && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 ml-12 space-y-2">
          {action.lookupResult && (
            <div className={`flex items-start gap-1.5 rounded-md border px-2.5 py-1.5 ${outcomeConfig[action.lookupResult.outcome]?.color ?? ""}`}>
              {(() => {
                const LookupIcon = outcomeConfig[action.lookupResult!.outcome]?.icon ?? RefreshCw;
                return <LookupIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />;
              })()}
              <div>
                <p className="text-xs font-semibold">
                  {outcomeConfig[action.lookupResult.outcome]?.label}
                </p>
                <p className="text-xs opacity-75">{action.lookupResult.reason}</p>
                <p className="text-xs opacity-50 mt-0.5">
                  Safety check at {formatDateTime(action.lookupResult.performedAt)}
                </p>
              </div>
            </div>
          )}
          {action.skipReason && !action.lookupResult && (
            <p className="text-xs text-gray-400">{action.skipReason}</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail, MessageSquare, Phone,
  RefreshCw, CheckCircle2, XCircle, Clock,
  SkipForward, ShieldX, PauseCircle, PlayCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { formatDateTime, formatCurrency, agingColor } from "@/lib/utils";
import type { ScheduledAction, Invoice, Contact, AutomationFlow, LookupOutcome } from "@/lib/types";

type CustomerAccountContext = {
  overdueCount: number;
  totalOverdueBalance: number;
  maxDaysPastDue: number;
  mostOverdueInvoiceNumber: string | null;
  overdueInvoices: { id: string; invoiceNumber: string; amount: number; daysPastDue: number; status: string }[];
};

type FullAction = ScheduledAction & {
  invoice?: Invoice;
  contact?: Contact;
  flow?: AutomationFlow;
  customerAccount?: CustomerAccountContext | null;
};

// ── Step type config ──────────────────────────────────────────────────────────

const stepTypeConfig = {
  email: { icon: Mail,          color: "text-blue-600",   bg: "bg-blue-50",   label: "Email" },
  sms:   { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", label: "SMS" },
  call:  { icon: Phone,         color: "text-green-600",  bg: "bg-green-50",  label: "Call" },
} as const;

// ── Status chip (M3 tonal chip) ───────────────────────────────────────────────

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:           { label: "Upcoming",       cls: "bg-gray-100 text-gray-600" },
  sent:              { label: "Sent",           cls: "bg-green-100 text-green-700" },
  skipped:           { label: "Skipped",        cls: "bg-amber-100 text-amber-700" },
  blocked:           { label: "Blocked",        cls: "bg-red-100 text-red-700" },
  approved:          { label: "Approved",       cls: "bg-green-100 text-green-700" },
  awaiting_approval: { label: "Waiting for approval", cls: "bg-blue-100 text-blue-700" },
};

// ── Outcome config (safety check result) ─────────────────────────────────────

const outcomeConfig: Record<LookupOutcome, { label: string; cls: string; icon: React.ElementType }> = {
  proceed:           { label: "Safety check passed — cleared to send", cls: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 },
  skip:              { label: "Skipped — invoice is now paid",         cls: "bg-amber-50 text-amber-700 border-amber-200",  icon: SkipForward },
  block:             { label: "Contact excluded from automations",      cls: "bg-red-50 text-red-700 border-red-200",        icon: ShieldX },
  hold:              { label: "Automation paused",                      cls: "bg-orange-50 text-orange-700 border-orange-200", icon: PauseCircle },
  awaiting_approval: { label: "Needs your approval to send",           cls: "bg-blue-50 text-blue-700 border-blue-200",     icon: Clock },
};

// ── Card ──────────────────────────────────────────────────────────────────────

export function ScheduledActionCard({ action, onRefresh }: { action: FullAction; onRefresh: () => void }) {
  const [firing, setFiring]     = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [result, setResult]     = useState<{ outcome: LookupOutcome; reason: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const stepCfg   = stepTypeConfig[action.stepType as keyof typeof stepTypeConfig];
  const statusCfg = statusConfig[action.status] ?? statusConfig.pending;
  const StepIcon  = stepCfg?.icon ?? Mail;
  const hasDetails = !!(action.lookupResult || action.skipReason);
  const isPending = action.status === "pending" || action.status === "awaiting_approval";
  const isNeedsApproval = action.status === "awaiting_approval";

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
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${
      isNeedsApproval ? "border-blue-200" : action.status === "blocked" ? "border-red-200" : "border-gray-200"
    }`}>

      {/* ── Main card body ── */}
      <div
        className={`flex items-start gap-4 p-5 ${hasDetails ? "cursor-pointer hover:bg-gray-50/60 transition-colors" : ""}`}
        onClick={hasDetails ? () => setExpanded(p => !p) : undefined}
      >
        {/* Step type icon — M3 rounded-2xl container */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${stepCfg?.bg ?? "bg-gray-100"}`}>
          <StepIcon className={`h-5 w-5 ${stepCfg?.color ?? "text-gray-500"}`} />
        </div>

        <div className="flex-1 min-w-0">

          {/* Row 1: WHO + status chip — the human headline */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-base font-semibold text-gray-900 leading-snug">
              {stepCfg?.label ?? action.stepType} to{" "}
              {action.contact ? (
                <Link
                  href={`/contacts/${action.contactId}`}
                  className="hover:text-blue-600 hover:underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {action.contact.name}
                </Link>
              ) : "Customer"}
            </p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
          </div>

          {/* Row 2: company */}
          {action.contact?.company && (
            <p className="text-xs text-gray-400 mb-2">{action.contact.company}</p>
          )}

          {/* Row 3: WHEN — prominent date */}
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">{formatDateTime(action.scheduledAt)}</span>
          </div>

          {/* Row 4: customer account context — secondary */}
          {action.customerAccount && action.customerAccount.overdueCount > 0 && (
            <p className="text-xs text-gray-500 mb-2">
              <span className={`font-semibold ${agingColor(action.customerAccount.maxDaysPastDue)}`}>
                {formatCurrency(action.customerAccount.totalOverdueBalance)}
              </span>
              {" overdue · "}
              {action.customerAccount.overdueCount} invoice{action.customerAccount.overdueCount !== 1 ? "s" : ""}
              {action.customerAccount.mostOverdueInvoiceNumber && (
                <> · oldest {action.customerAccount.maxDaysPastDue}d</>
              )}
            </p>
          )}

          {/* Row 5: flow name */}
          {action.flow && (
            <p className="text-xs text-gray-400 mb-3">{action.flow.name}</p>
          )}

          {/* Live fire result */}
          {result && (
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 mb-3 text-xs font-medium ${outcomeConfig[result.outcome]?.cls ?? ""}`}>
              {(() => { const R = outcomeConfig[result.outcome]?.icon ?? RefreshCw; return <R className="h-3.5 w-3.5 flex-shrink-0" />; })()}
              <span>{result.reason}</span>
            </div>
          )}

          {/* Action buttons — M3 filled + outlined (rounded-full) */}
          {isPending && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleFire(); }}
                disabled={firing}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50 ${
                  isNeedsApproval ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {firing ? (
                  <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Sending…</>
                ) : (
                  <><PlayCircle className="h-3.5 w-3.5" />{isNeedsApproval ? "Approve & send" : "Send now"}</>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                disabled={skipping}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Skip
              </button>
            </div>
          )}
        </div>

        {/* Expand chevron — only when historical details exist */}
        {hasDetails && (
          <button
            className="flex-shrink-0 self-start mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(p => !p); }}
            title={expanded ? "Hide safety check details" : "Show safety check details"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* ── Expanded safety check details — inset grey container ── */}
      {expanded && hasDetails && (
        <div className="px-5 pb-4 pt-2">
          <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 space-y-2">
          {action.lookupResult && (
            <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${outcomeConfig[action.lookupResult.outcome]?.cls ?? ""}`}>
              {(() => { const L = outcomeConfig[action.lookupResult!.outcome]?.icon ?? RefreshCw; return <L className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />; })()}
              <div>
                <p className="font-semibold">{outcomeConfig[action.lookupResult.outcome]?.label}</p>
                <p className="opacity-80 mt-0.5">{action.lookupResult.reason}</p>
                <p className="opacity-50 mt-0.5">Safety check at {formatDateTime(action.lookupResult.performedAt)}</p>
              </div>
            </div>
          )}
          {action.skipReason && !action.lookupResult && (
            <p className="text-xs text-gray-400 px-1">{action.skipReason}</p>
          )}
          </div>{/* end inset container */}
        </div>
      )}
    </div>
  );
}

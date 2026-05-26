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
  proceed: { label: "Lookup passed", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  skip: { label: "Action skipped: invoice is now paid", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: SkipForward },
  block: { label: "Contact excluded from all automations", color: "text-red-700 bg-red-50 border-red-200", icon: ShieldX },
  hold: { label: "Automation paused", color: "text-orange-700 bg-orange-50 border-orange-200", icon: PauseCircle },
  awaiting_approval: { label: "Manual approval mode is enabled", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
};

const statusConfig = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-600 border-gray-200" },
  sent: { label: "Sent", className: "bg-green-100 text-green-700 border-green-200" },
  skipped: { label: "Skipped", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  blocked: { label: "Blocked", className: "bg-red-100 text-red-700 border-red-200" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700 border-green-200" },
  awaiting_approval: { label: "Awaiting Approval", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

export function ScheduledActionCard({ action, onRefresh }: { action: FullAction; onRefresh: () => void }) {
  const [firing, setFiring] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [result, setResult] = useState<{ outcome: LookupOutcome; reason: string } | null>(null);

  const stepCfg = stepTypeConfig[action.stepType as keyof typeof stepTypeConfig];
  const statusCfg = statusConfig[action.status] ?? statusConfig.pending;
  const Icon = stepCfg?.icon ?? Mail;

  async function handleFire() {
    setFiring(true);
    const res = await fetch(`/api/scheduled/${action.id}/fire`, { method: "POST" });
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Step type icon */}
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stepCfg?.bg ?? "bg-gray-100"} flex-shrink-0`}>
          <Icon className={`h-4 w-4 ${stepCfg?.color ?? "text-gray-500"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {stepCfg?.label ?? action.stepType} Action
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
          </div>

          {/* Invoice + Contact info */}
          <div className="text-xs text-gray-500 space-y-0.5 mb-2">
            {action.invoice && (
              <p>
                Invoice:{" "}
                <Link href={`/invoices/${action.invoiceId}`} className="font-medium text-blue-600 hover:underline">
                  {action.invoice.invoiceNumber}
                </Link>
                {" "}·{" "}
                <span className="font-medium text-gray-700">{formatCurrency(action.invoice.amount)}</span>
              </p>
            )}
            {action.contact && (
              <p>
                Contact:{" "}
                <Link href={`/contacts/${action.contactId}`} className="font-medium text-gray-700 hover:underline">
                  {action.contact.name}
                </Link>
                {" — "}{action.contact.company}
              </p>
            )}
            {action.flow && (
              <p>Flow: <span className="text-gray-600">{action.flow.name}</span></p>
            )}
          </div>

          {/* Scheduled time */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <Clock className="h-3 w-3" />
            {action.status === "pending" || action.status === "awaiting_approval"
              ? `Scheduled: ${formatDateTime(action.scheduledAt)}`
              : `Was scheduled: ${formatDateTime(action.scheduledAt)}`}
          </div>

          {/* Lookup result */}
          {action.lookupResult && (
            <div
              className={`flex items-start gap-1.5 rounded-md border px-2.5 py-1.5 mb-2 ${outcomeConfig[action.lookupResult.outcome]?.color ?? ""}`}
            >
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
                  Lookup at {formatDateTime(action.lookupResult.performedAt)}
                </p>
              </div>
            </div>
          )}

          {/* Skip reason */}
          {action.skipReason && !action.lookupResult && (
            <p className="text-xs text-gray-400 mb-2">{action.skipReason}</p>
          )}

          {/* Live result after firing */}
          {result && (
            <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 mb-2 ${outcomeConfig[result.outcome]?.color ?? ""}`}>
              {(() => {
                const ResultIcon = outcomeConfig[result.outcome]?.icon ?? RefreshCw;
                return <ResultIcon className="h-3.5 w-3.5" />;
              })()}
              <p className="text-xs font-medium">{result.reason}</p>
            </div>
          )}

          {/* Action buttons */}
          {(action.status === "pending" || action.status === "awaiting_approval") && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleFire}
                disabled={firing}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                {firing ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Running lookup...
                  </>
                ) : action.status === "awaiting_approval" ? (
                  "Approve & Run Lookup"
                ) : (
                  "Run Lookup & Fire"
                )}
              </button>
              <button
                onClick={handleSkip}
                disabled={skipping}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

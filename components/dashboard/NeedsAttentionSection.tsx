"use client";

import Link from "next/link";
import {
  ShieldX, AlertTriangle, AlertCircle, Clock,
  CheckCircle2, PauseCircle, MessageSquare, ThumbsUp, ArrowRight,
} from "lucide-react";
import type { AttentionDetails } from "@/lib/server-data";

// ── Priority row — flat, no accordion ─────────────────────────────────────────

function PriorityRow({
  icon: Icon,
  iconBg,
  label,
  detail,
  href,
  actionLabel,
  urgent = false,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  detail: string;
  href: string;
  actionLabel: string;
  urgent?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
      urgent
        ? "border-red-100 bg-red-50/40"
        : "border-gray-200 bg-white"
    }`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{detail}</p>
      </div>
      <Link
        href={href}
        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
          urgent
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {actionLabel}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────

export function NeedsAttentionSection({
  details,
  monitoringCount = 0,
  scheduledCount = 0,
}: {
  details: AttentionDetails;
  monitoringCount?: number;
  scheduledCount?: number;
}) {
  // Unique customer counts for each category
  const disputeCount      = new Set(details.disputes.map(i => i.contactId)).size;
  const blockedCount      = details.blocked.length;
  const overdue60Count    = new Set(details.overdue60plus.map(i => i.contactId)).size;
  const overdue30Count    = new Set(details.overdue30to60.map(i => i.contactId)).size;
  const overdueCount      = overdue60Count + overdue30Count;
  const approvalCount     = details.awaitingApproval.length;
  const pausedCount       = new Set(details.pausedAutomations.map(i => i.contactId)).size;
  const unreadCount       = new Set(details.unreadReplies.map(i => i.contactId)).size;
  const promiseCount      = new Set(details.promisesToPay.map(i => i.contactId)).size;

  const hasAnyAlerts = disputeCount + blockedCount + overdueCount + approvalCount + pausedCount + unreadCount > 0;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900">What needs attention</h2>
          <p className="text-xs text-gray-400 mt-0.5">Today's priorities — act on these to keep cash flowing.</p>
        </div>

        {!hasAnyAlerts ? (
          // ── "CollectPilot is working" empty state ──────────────────────────
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">All clear — nothing urgent right now</p>
                {monitoringCount > 0 ? (
                  <p className="text-xs text-green-700 mt-1 leading-relaxed">
                    CollectPilot is monitoring <strong>{monitoringCount}</strong> overdue customer{monitoringCount !== 1 ? "s" : ""}.
                    {scheduledCount > 0 && <> <strong>{scheduledCount}</strong> reminder{scheduledCount !== 1 ? "s" : ""} are scheduled this week.</>}
                  </p>
                ) : (
                  <p className="text-xs text-green-700 mt-1">
                    No overdue customers right now. CollectPilot is watching for new overdue invoices.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // ── Flat priority list ────────────────────────────────────────────
          <div className="space-y-2">

            {disputeCount > 0 && (
              <PriorityRow
                icon={ShieldX}
                iconBg="bg-red-500"
                label={disputeCount === 1 ? "A customer disputed an invoice" : `${disputeCount} customers disputed an invoice`}
                detail="Reminders are paused. Review before sending anything."
                href="/invoices?filter=disputed"
                actionLabel="Review"
                urgent
              />
            )}

            {blockedCount > 0 && (
              <PriorityRow
                icon={AlertTriangle}
                iconBg="bg-red-400"
                label={blockedCount === 1 ? "1 reminder was blocked" : `${blockedCount} reminders were blocked`}
                detail="A safety check flagged them. Review to find out why."
                href="/scheduled?filter=blocked"
                actionLabel="View blocked"
                urgent
              />
            )}

            {overdue60Count > 0 && (
              <PriorityRow
                icon={AlertCircle}
                iconBg="bg-orange-500"
                label={overdue60Count === 1 ? "1 account is 60+ days overdue" : `${overdue60Count} accounts are 60+ days overdue`}
                detail="High risk — consider calling or escalating personally."
                href="/invoices?filter=overdue"
                actionLabel="View accounts"
                urgent
              />
            )}

            {approvalCount > 0 && (
              <PriorityRow
                icon={CheckCircle2}
                iconBg="bg-purple-500"
                label={approvalCount === 1 ? "1 reminder is waiting for your approval" : `${approvalCount} reminders need your approval`}
                detail="Review them before CollectPilot sends them."
                href="/scheduled?filter=awaiting_approval"
                actionLabel="Approve"
              />
            )}

            {pausedCount > 0 && (
              <PriorityRow
                icon={PauseCircle}
                iconBg="bg-amber-500"
                label={pausedCount === 1 ? "1 follow-up is paused" : `${pausedCount} follow-ups are paused`}
                detail="A customer replied — check their message and decide next step."
                href="/inbox?filter=needs_action"
                actionLabel="View replies"
              />
            )}

            {unreadCount > 0 && (
              <PriorityRow
                icon={MessageSquare}
                iconBg="bg-blue-500"
                label={unreadCount === 1 ? "1 new customer reply" : `${unreadCount} new customer replies`}
                detail="A customer got in touch — read what they said."
                href="/inbox?filter=unread"
                actionLabel="Read"
              />
            )}

            {overdue30Count > 0 && overdue60Count === 0 && (
              <PriorityRow
                icon={Clock}
                iconBg="bg-orange-400"
                label={overdue30Count === 1 ? "1 account is 30–60 days overdue" : `${overdue30Count} accounts are 30–60 days overdue`}
                detail="May need a personal call or extra follow-up soon."
                href="/invoices?filter=overdue"
                actionLabel="View accounts"
              />
            )}

          </div>
        )}
      </div>

      {/* ── Good news — promises to pay ── */}
      {promiseCount > 0 && (
        <Link
          href="/inbox?filter=promise_to_pay"
          className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 hover:bg-green-100 transition-colors"
        >
          <ThumbsUp className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">
              {promiseCount} customer{promiseCount !== 1 ? "s" : ""} promised to pay
            </p>
            <p className="text-xs text-green-600 mt-0.5 hidden sm:block">Monitor and follow up when the payment date arrives.</p>
          </div>
          <span className="text-xs font-medium text-green-600 whitespace-nowrap shrink-0">View →</span>
        </Link>
      )}
    </div>
  );
}

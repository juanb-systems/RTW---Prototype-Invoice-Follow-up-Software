import Link from "next/link";
import {
  AlertCircle, DollarSign, Clock, Zap,
  ShieldX, PauseCircle, MessageSquare, ThumbsUp, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AgingChart } from "@/components/dashboard/AgingChart";
import { CollectionsTrendChart } from "@/components/dashboard/CollectionsTrendChart";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { DemoScenarioButton } from "@/components/dashboard/DemoScenarioButton";
import { getDashboardData } from "@/lib/server-data";
import { formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

function AttentionCard({
  count,
  label,
  description,
  href,
  icon: Icon,
  color,
  urgent,
}: {
  count: number;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  urgent?: boolean;
}) {
  if (count === 0) return null;
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-lg border p-3.5 transition-all hover:shadow-md ${
        urgent
          ? "border-red-200 bg-red-50 hover:border-red-300"
          : "border-gray-200 bg-white hover:border-blue-200"
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-gray-900">{count}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
      </div>
      <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
        View →
      </span>
    </Link>
  );
}

export default function DashboardPage() {
  const { kpis, agingBuckets, collectionsTrend, recentActivity, needsAttention } = getDashboardData();

  const totalAttentionItems =
    needsAttention.disputes +
    needsAttention.blocked +
    needsAttention.awaitingApproval +
    needsAttention.pausedAutomations +
    needsAttention.unreadReplies +
    needsAttention.promisesToPay +
    needsAttention.overdue30to60 +
    needsAttention.overdue60plus;

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle="Overview of your receivables"
        description="See what needs attention today — overdue invoices, customer replies, and blocked actions."
        actions={<DemoScenarioButton />}
      />
      <div className="p-4 sm:p-6 space-y-6">

        {/* Needs Attention */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Needs Attention</h2>
              <p className="text-xs text-gray-400 mt-0.5">Act on these before anything else today.</p>
            </div>
            {totalAttentionItems > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-100 px-2 text-xs font-bold text-red-600">
                {totalAttentionItems}
              </span>
            )}
          </div>
          {totalAttentionItems === 0 ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">All clear</p>
                <p className="text-xs text-green-600 mt-0.5">No items currently need your attention.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <AttentionCard
                count={needsAttention.disputes}
                label="dispute(s) raised"
                description="Automation paused — review before sending more."
                href="/invoices?status=disputed"
                icon={ShieldX}
                color="bg-red-500"
                urgent
              />
              <AttentionCard
                count={needsAttention.blocked}
                label="action(s) blocked"
                description="A safety check blocked an automated action."
                href="/scheduled"
                icon={AlertTriangle}
                color="bg-red-400"
                urgent
              />
              <AttentionCard
                count={needsAttention.overdue60plus}
                label="overdue 60+ days"
                description="High-risk. Consider escalation or write-off review."
                href="/invoices"
                icon={AlertCircle}
                color="bg-red-500"
                urgent
              />
              <AttentionCard
                count={needsAttention.overdue30to60}
                label="overdue 30-60 days"
                description="May need a personal call or escalation."
                href="/invoices"
                icon={Clock}
                color="bg-orange-400"
              />
              <AttentionCard
                count={needsAttention.awaitingApproval}
                label="action(s) need approval"
                description="Actions waiting for your approval."
                href="/scheduled"
                icon={CheckCircle2}
                color="bg-purple-500"
              />
              <AttentionCard
                count={needsAttention.pausedAutomations}
                label="automation(s) paused"
                description="Customer replied, automation on hold."
                href="/inbox"
                icon={PauseCircle}
                color="bg-amber-500"
              />
              <AttentionCard
                count={needsAttention.unreadReplies}
                label="unread reply or call"
                description="New customer messages waiting."
                href="/inbox"
                icon={MessageSquare}
                color="bg-blue-500"
              />
              <AttentionCard
                count={needsAttention.promisesToPay}
                label="promise(s) to pay"
                description="Customer confirmed payment — monitor and follow up."
                href="/inbox?filter=promise_to_pay"
                icon={ThumbsUp}
                color="bg-green-500"
              />
            </div>
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Overdue Invoices"
            value={kpis.totalOverdue.toString()}
            subtitle={`${formatCurrency(kpis.totalOverdueAmount)} at risk`}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBg="bg-red-50"
          />
          <KpiCard
            title="Outstanding Balance"
            value={formatCurrency(kpis.totalOverdueAmount)}
            subtitle="Across all overdue invoices"
            icon={DollarSign}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
          <KpiCard
            title="Avg Days Overdue"
            value={`${kpis.avgDaysPastDue} days`}
            subtitle="Across all overdue invoices"
            icon={Clock}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-50"
          />
          <KpiCard
            title="Pending Actions"
            value={kpis.pendingActions.toString()}
            subtitle="Awaiting send or approval"
            icon={Zap}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AgingChart data={agingBuckets} />
          <CollectionsTrendChart data={collectionsTrend} />
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900">System Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">What CollectPilot has done recently</p>
          <RecentActivityFeed items={recentActivity} />
        </div>
      </div>
    </div>
  );
}

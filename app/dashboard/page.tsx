import { TopBar } from "@/components/layout/TopBar";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { DemoScenarioButton } from "@/components/dashboard/DemoScenarioButton";
import { NeedsAttentionSection } from "@/components/dashboard/NeedsAttentionSection";
import { PerformanceSummary } from "@/components/dashboard/PerformanceSummary";
import { getDashboardData, getAttentionDetails } from "@/lib/server-data";
import { CollapsibleSection } from "@/components/invoices/CollapsibleSection";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { kpis, agingBuckets, collectionsTrend, recentActivity } = getDashboardData();
  const attentionDetails = getAttentionDetails();

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle="Overview of your receivables"
        description="See who owes, what needs attention, and what is scheduled."
        actions={<DemoScenarioButton />}
      />
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* ── Hero KPI cards ──────────────────────────────────────────────
            Mobile:  Total Overdue full width (row 1)
                     Avg Days · Actions · Replies compact 3-col (row 2)
            Desktop: all 4 equal columns
         ──────────────────────────────────────────────────────────────── */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-4">

          {/* Total Overdue — full width on mobile */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-6">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest">Total Overdue</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1.5 tabular-nums leading-none">
              {formatCurrency(kpis.totalOverdueAmount)}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">across {kpis.totalOverdue} invoices</p>
          </div>

          {/* 3 compact cards — 3-col on mobile, 3 separate cols on desktop */}
          <div className="grid grid-cols-3 gap-3 sm:contents">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-3 sm:p-6">
              <p className="text-[9px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest leading-tight">Avg Days</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-1.5 tabular-nums">{kpis.avgDaysPastDue}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 leading-tight">days overdue</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-3 sm:p-6">
              <p className="text-[9px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest leading-tight">Actions</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-1.5 tabular-nums">{kpis.pendingActions}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 leading-tight">need approval</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-3 sm:p-6">
              <p className="text-[9px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest leading-tight">Replies</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-1.5 tabular-nums">
                {attentionDetails.unreadReplies.length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 leading-tight">
                {attentionDetails.disputes.length > 0
                  ? `${attentionDetails.disputes.length} dispute${attentionDetails.disputes.length > 1 ? "s" : ""}`
                  : "unread"}
              </p>
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        <NeedsAttentionSection details={attentionDetails} />

        {/* Performance Summary — tabbed on mobile, side-by-side on desktop */}
        <CollapsibleSection title="Performance Summary" defaultOpen={false}>
          <div className="p-3 sm:p-5">
            <PerformanceSummary agingBuckets={agingBuckets} collectionsTrend={collectionsTrend} />
          </div>
        </CollapsibleSection>

        {/* Recent Activity */}
        <CollapsibleSection title="Recent Activity" defaultOpen={false}>
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <RecentActivityFeed items={recentActivity} />
          </div>
        </CollapsibleSection>

      </div>
    </div>
  );
}

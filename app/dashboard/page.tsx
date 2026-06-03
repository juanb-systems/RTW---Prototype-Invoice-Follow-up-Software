import { TopBar } from "@/components/layout/TopBar";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { AgingChart } from "@/components/dashboard/AgingChart";
import { CollectionsTrendChart } from "@/components/dashboard/CollectionsTrendChart";
import { DemoScenarioButton } from "@/components/dashboard/DemoScenarioButton";
import { NeedsAttentionSection } from "@/components/dashboard/NeedsAttentionSection";
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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* ── Hero KPI cards — always full width ─────────────────────── */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-4">

          {/* Total Overdue — full width on mobile */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-6">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest">Total Overdue</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1.5 tabular-nums leading-none">
              {formatCurrency(kpis.totalOverdueAmount)}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">across {kpis.totalOverdue} invoices</p>
          </div>

          {/* 3 compact cards */}
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

        {/* ── Two-column layout ───────────────────────────────────────────
            Desktop:  Left 2/3 (priorities) + Right 1/3 (insights)
            Mobile:   Stack in order: priorities → insights
         ──────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-5">

          {/* ── LEFT: Daily priorities ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <NeedsAttentionSection details={attentionDetails} />
          </div>

          {/* ── RIGHT: Supporting insights ──────────────────────────── */}
          <div className="space-y-4 sm:space-y-5">

            {/* Performance Summary — open on desktop, collapsible on mobile */}
            <div className="lg:block">
              {/* Desktop: always visible */}
              <div className="hidden lg:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Performance Summary</h3>
                </div>
                <div className="p-4 space-y-4">
                  <AgingChart data={agingBuckets} height={160} compact />
                  <CollectionsTrendChart data={collectionsTrend} height={160} compact />
                </div>
              </div>

              {/* Mobile: collapsible to save space */}
              <div className="lg:hidden">
                <CollapsibleSection title="Performance Summary" defaultOpen={false}>
                  <div className="p-3 space-y-4">
                    <AgingChart data={agingBuckets} height={180} compact />
                    <CollectionsTrendChart data={collectionsTrend} height={180} compact />
                  </div>
                </CollapsibleSection>
              </div>
            </div>

            {/* Recent Activity — 5 items, open on desktop */}
            <div className="hidden lg:block">
              <RecentActivityFeed items={recentActivity.slice(0, 5)} />
            </div>

            {/* Mobile: collapsible Recent Activity */}
            <div className="lg:hidden">
              <CollapsibleSection title="Recent Activity" defaultOpen={false}>
                <div className="px-4 py-3">
                  <RecentActivityFeed items={recentActivity.slice(0, 5)} />
                </div>
              </CollapsibleSection>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

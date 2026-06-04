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
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">

        {/* ── KPI cards ────────────────────────────────────────────────── */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-4">

          {/* Hero card: Total Overdue — M3 primary container */}
          <div className="rounded-2xl bg-blue-600 p-5 sm:p-6 shadow-md">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Total Overdue</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-2 tabular-nums leading-none">
              {formatCurrency(kpis.totalOverdueAmount)}
            </p>
            <p className="text-sm text-blue-200 mt-2 leading-snug">
              {kpis.customersWithOverdue} customer{kpis.customersWithOverdue !== 1 ? "s" : ""} · {kpis.totalOverdue} invoice{kpis.totalOverdue !== 1 ? "s" : ""}
            </p>
          </div>

          {/* 3 compact stat cards */}
          <div className="grid grid-cols-3 gap-3 sm:contents">
            {/* Customers overdue */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 sm:p-6 flex flex-col">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 leading-snug">Customers</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1.5 sm:mt-2 tabular-nums leading-none">{kpis.customersWithOverdue}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 leading-snug">overdue</p>
            </div>
            {/* Approvals */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 sm:p-6 flex flex-col">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 leading-snug">Approvals</p>
              <p className={`text-xl sm:text-3xl font-bold mt-1.5 sm:mt-2 tabular-nums leading-none ${kpis.awaitingApproval > 0 ? "text-amber-600" : "text-gray-900"}`}>
                {kpis.awaitingApproval}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 leading-snug">need approval</p>
            </div>
            {/* Replies */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 sm:p-6 flex flex-col">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 leading-snug">Replies</p>
              <p className={`text-xl sm:text-3xl font-bold mt-1.5 sm:mt-2 tabular-nums leading-none ${attentionDetails.unreadReplies.length > 0 ? "text-blue-600" : "text-gray-900"}`}>
                {attentionDetails.unreadReplies.length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 leading-snug">
                {attentionDetails.disputes.length > 0
                  ? `${attentionDetails.disputes.length} dispute${attentionDetails.disputes.length !== 1 ? "s" : ""}`
                  : "unread"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ─────────────────────────────────────────
            Desktop:  Left 2/3 (priorities) + Right 1/3 (charts)
            Mobile:   priorities → charts (stacked)
         ──────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 sm:gap-6">

          {/* LEFT: Needs Attention */}
          <div className="lg:col-span-2">
            <NeedsAttentionSection details={attentionDetails} />
          </div>

          {/* RIGHT: Supporting insights */}
          <div className="space-y-5 sm:space-y-6">

            {/* Performance Summary */}
            <div className="hidden lg:block rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
              </div>
              <div className="p-4 space-y-5">
                <AgingChart data={agingBuckets} height={160} compact />
                <CollectionsTrendChart data={collectionsTrend} height={160} compact />
              </div>
            </div>

            {/* Mobile: collapsible Performance */}
            <div className="lg:hidden">
              <CollapsibleSection title="Performance Summary" defaultOpen={false}>
                <div className="p-3 space-y-4">
                  <AgingChart data={agingBuckets} height={180} compact />
                  <CollectionsTrendChart data={collectionsTrend} height={180} compact />
                </div>
              </CollapsibleSection>
            </div>

            {/* Recent Activity — desktop only */}
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

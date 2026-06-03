import { TopBar } from "@/components/layout/TopBar";
import { AgingChart } from "@/components/dashboard/AgingChart";
import { CollectionsTrendChart } from "@/components/dashboard/CollectionsTrendChart";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
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
        description="Your receivables at a glance — see who owes, what needs attention, and what is scheduled."
        actions={<DemoScenarioButton />}
      />
      <div className="p-4 sm:p-6 space-y-6">

        {/* Hero summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Overdue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(kpis.totalOverdueAmount)}</p>
            <p className="text-xs text-gray-400 mt-1">across {kpis.totalOverdue} invoices</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Days Overdue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.avgDaysPastDue} days</p>
            <p className="text-xs text-gray-400 mt-1">average across overdue invoices</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions Pending</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.pendingActions}</p>
            <p className="text-xs text-gray-400 mt-1">awaiting send or approval</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unread Replies</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{attentionDetails.unreadReplies.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {attentionDetails.disputes.length > 0
                ? `+ ${attentionDetails.disputes.length} active dispute${attentionDetails.disputes.length > 1 ? "s" : ""}`
                : "inbox messages needing a response"}
            </p>
          </div>
        </div>

        {/* Needs Attention — expandable accordion */}
        <NeedsAttentionSection details={attentionDetails} />

        {/* Charts Row */}
        <CollapsibleSection title="Performance Summary" defaultOpen={false}>
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AgingChart data={agingBuckets} />
            <CollectionsTrendChart data={collectionsTrend} />
          </div>
        </CollapsibleSection>

        {/* Activity Feed */}
        <CollapsibleSection title="Recent Activity" defaultOpen={false}>
          <div className="px-5 py-4">
            <RecentActivityFeed items={recentActivity} />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

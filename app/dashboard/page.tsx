import {
  AlertCircle, DollarSign, Clock, Zap,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AgingChart } from "@/components/dashboard/AgingChart";
import { CollectionsTrendChart } from "@/components/dashboard/CollectionsTrendChart";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { DemoScenarioButton } from "@/components/dashboard/DemoScenarioButton";
import { NeedsAttentionSection } from "@/components/dashboard/NeedsAttentionSection";
import { getDashboardData, getAttentionDetails } from "@/lib/server-data";
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
        description="See what needs attention today — overdue invoices, customer replies, and blocked actions."
        actions={<DemoScenarioButton />}
      />
      <div className="p-4 sm:p-6 space-y-6">

        {/* Needs Attention — expandable accordion */}
        <NeedsAttentionSection details={attentionDetails} />

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

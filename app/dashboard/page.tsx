import { AlertCircle, DollarSign, Clock, Zap } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AgingChart } from "@/components/dashboard/AgingChart";
import { CollectionsTrendChart } from "@/components/dashboard/CollectionsTrendChart";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { DemoScenarioButton } from "@/components/dashboard/DemoScenarioButton";
import { getDashboardData } from "@/lib/server-data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { kpis, agingBuckets, collectionsTrend, recentActivity } = getDashboardData();

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle="Overview of your receivables"
        actions={<DemoScenarioButton />}
      />
      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            title="Overdue Invoices"
            value={kpis.totalOverdue.toString()}
            subtitle={`${formatCurrency(kpis.totalOverdueAmount)} at risk`}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBg="bg-red-50"
          />
          <KpiCard
            title="Total at Risk"
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
        <div className="grid grid-cols-2 gap-4">
          <AgingChart data={agingBuckets} />
          <CollectionsTrendChart data={collectionsTrend} />
        </div>

        {/* Activity Feed */}
        <RecentActivityFeed items={recentActivity} />
      </div>
    </div>
  );
}

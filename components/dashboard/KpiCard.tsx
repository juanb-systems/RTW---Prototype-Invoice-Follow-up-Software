import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  trend,
}: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5 shadow-sm overflow-hidden">
      {/* Title + icon share the top row so the value below can span full width */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs sm:text-sm font-medium text-gray-500 leading-tight">{title}</p>
        <div className={cn("flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-3.5 w-3.5 sm:h-5 sm:w-5", iconColor)} />
        </div>
      </div>
      {/* Value spans the full card width — no icon competing for space */}
      <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-gray-400 leading-snug">{subtitle}</p>}
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-green-600" : "text-red-500")}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  );
}

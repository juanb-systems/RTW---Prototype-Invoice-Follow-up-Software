"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface AgingBucket {
  label: string;
  count: number;
  amount: number;
}

interface AgingChartProps {
  data: AgingBucket[];
}

const COLORS = ["#fbbf24", "#f97316", "#ef4444", "#dc2626", "#991b1b"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        <p className="text-gray-600">{payload[0].payload.count} invoices</p>
        <p className="text-gray-800 font-medium">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export function AgingChart({ data, height = 220, compact = false }: AgingChartProps & { height?: number; compact?: boolean }) {
  const chartData = data.map((d, i) => ({ ...d, fill: COLORS[i] ?? "#6b7280" }));

  return (
    <div className={compact ? "" : "rounded-xl border border-gray-200 bg-white p-5 shadow-sm"}>
      <h3 className={`font-semibold text-gray-900 mb-0.5 ${compact ? "text-xs" : "text-sm mb-1"}`}>Overdue Aging</h3>
      {!compact && <p className="text-xs text-gray-400 mb-4">Invoice amounts by days overdue</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#f97316">
            {chartData.map((entry, index) => (
              <rect key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

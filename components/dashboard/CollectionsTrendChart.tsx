"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TrendData {
  month: string;
  collected: number;
  target: number;
}

interface CollectionsTrendChartProps {
  data: TrendData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((p: { color: string; name: string; value: number }) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function CollectionsTrendChart({ data, height = 220, compact = false }: CollectionsTrendChartProps & { height?: number; compact?: boolean }) {
  return (
    <div className={compact ? "" : "rounded-xl border border-gray-200 bg-white p-5 shadow-sm"}>
      <h3 className={`font-semibold text-gray-900 mb-0.5 ${compact ? "text-xs" : "text-sm mb-1"}`}>Collections Trend</h3>
      {!compact && <p className="text-xs text-gray-400 mb-4">Collected vs target (last 6 months)</p>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          />
          <Line
            type="monotone"
            dataKey="collected"
            name="Collected"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3b82f6" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="#d1d5db"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

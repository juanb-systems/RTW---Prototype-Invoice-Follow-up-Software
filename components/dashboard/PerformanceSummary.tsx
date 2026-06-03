"use client";

import { useState } from "react";
import { AgingChart } from "@/components/dashboard/AgingChart";
import { CollectionsTrendChart } from "@/components/dashboard/CollectionsTrendChart";

interface Props {
  agingBuckets: { label: string; count: number; amount: number }[];
  collectionsTrend: { month: string; collected: number; target: number }[];
}

export function PerformanceSummary({ agingBuckets, collectionsTrend }: Props) {
  const [activeTab, setActiveTab] = useState<"aging" | "trend">("aging");

  return (
    <div>
      {/* Mobile: tab switcher */}
      <div className="flex sm:hidden gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("aging")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            activeTab === "aging"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Overdue Aging
        </button>
        <button
          onClick={() => setActiveTab("trend")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            activeTab === "trend"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Collections Trend
        </button>
      </div>

      {/* Mobile: one chart at a time */}
      <div className="sm:hidden">
        {activeTab === "aging"
          ? <AgingChart data={agingBuckets} />
          : <CollectionsTrendChart data={collectionsTrend} />
        }
      </div>

      {/* Desktop: both side by side */}
      <div className="hidden sm:grid grid-cols-2 gap-4">
        <AgingChart data={agingBuckets} />
        <CollectionsTrendChart data={collectionsTrend} />
      </div>
    </div>
  );
}

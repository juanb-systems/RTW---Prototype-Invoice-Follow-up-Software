"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";

export function TriggerNode({ data, selected }: NodeProps) {
  const cfg = data as { label?: string; days?: number };
  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md w-52 ${
        selected ? "border-blue-500" : "border-gray-300"
      }`}
    >
      <div className="flex items-center gap-2 rounded-t-lg bg-gray-900 px-3 py-2">
        <Zap className="h-3.5 w-3.5 text-yellow-400" />
        <span className="text-xs font-semibold text-white">Trigger</span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-700">
          {cfg.label ?? "When invoice is overdue"}
        </p>
        {cfg.days !== undefined && (
          <p className="text-xs text-gray-400 mt-0.5">{cfg.days} days past due</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400" />
    </div>
  );
}

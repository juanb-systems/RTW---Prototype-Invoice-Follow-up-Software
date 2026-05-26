"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";

export function WaitNode({ data, selected }: NodeProps) {
  const cfg = data as { label?: string; days?: number };
  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md w-52 ${
        selected ? "border-gray-500" : "border-gray-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400" />
      <div className="flex items-center gap-2 rounded-t-lg bg-gray-500 px-3 py-2">
        <Clock className="h-3.5 w-3.5 text-white" />
        <span className="text-xs font-semibold text-white">Wait</span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-700">
          {cfg.days !== undefined ? `Wait ${cfg.days} days` : (cfg.label ?? "Wait")}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Before proceeding to next step</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400" />
    </div>
  );
}

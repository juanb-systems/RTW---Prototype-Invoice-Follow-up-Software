"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export function ConditionNode({ data, selected }: NodeProps) {
  const cfg = data as { label?: string; condition?: string };
  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md w-52 ${
        selected ? "border-indigo-500" : "border-indigo-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-indigo-400" />
      <div className="flex items-center gap-2 rounded-t-lg bg-indigo-500 px-3 py-2">
        <GitBranch className="h-3.5 w-3.5 text-white" />
        <span className="text-xs font-semibold text-white">Condition</span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-700">{cfg.label ?? "If / Else"}</p>
        {cfg.condition && (
          <p className="text-xs text-gray-400 mt-1 italic">{cfg.condition}</p>
        )}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-green-600 font-medium">↙ Yes</span>
          <span className="text-xs text-red-500 font-medium">No ↘</span>
        </div>
      </div>
      {/* Two source handles: Yes (left-bottom) and No (right-bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: "30%" }}
        className="!w-3 !h-3 !bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: "70%" }}
        className="!w-3 !h-3 !bg-red-500"
      />
    </div>
  );
}

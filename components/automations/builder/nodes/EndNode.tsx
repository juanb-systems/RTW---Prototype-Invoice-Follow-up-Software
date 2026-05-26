"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { StopCircle } from "lucide-react";

export function EndNode({ data: _data, selected }: NodeProps) {
  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md w-52 ${
        selected ? "border-gray-600" : "border-gray-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400" />
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-3">
        <StopCircle className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-500">End Automation</span>
      </div>
    </div>
  );
}

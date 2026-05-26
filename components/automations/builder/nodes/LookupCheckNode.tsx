"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { RefreshCw, ShieldCheck } from "lucide-react";

export function LookupCheckNode({ data, selected }: NodeProps) {
  const cfg = data as { label?: string };
  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md w-52 ${
        selected ? "border-amber-500" : "border-amber-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-amber-400" />
      <div className="flex items-center gap-2 rounded-t-lg bg-amber-500 px-3 py-2">
        <RefreshCw className="h-3.5 w-3.5 text-white" />
        <span className="text-xs font-semibold text-white">Fresh Xero Check</span>
        <ShieldCheck className="h-3.5 w-3.5 text-amber-100 ml-auto" />
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-semibold text-amber-800">
          Fresh lookup required before sending
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          {cfg.label ?? "Checks invoice status, contact exclusion, disputes, and promises."}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-amber-400" />
    </div>
  );
}

"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Phone } from "lucide-react";

export function CallNode({ data, selected }: NodeProps) {
  const cfg = data as { label?: string; notes?: string };
  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md w-52 ${
        selected ? "border-green-500" : "border-green-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-green-400" />
      <div className="flex items-center gap-2 rounded-t-lg bg-green-500 px-3 py-2">
        <Phone className="h-3.5 w-3.5 text-white" />
        <span className="text-xs font-semibold text-white">Schedule Call</span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-700">{cfg.label ?? "Schedule collection call"}</p>
        {cfg.notes && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cfg.notes}</p>
        )}
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 rounded-b-xl">
        <label className="flex items-center gap-1.5 cursor-not-allowed select-none">
          <input
            type="checkbox"
            checked
            disabled
            readOnly
            className="h-3 w-3 accent-amber-500 cursor-not-allowed"
          />
          <span className="text-[10px] font-medium text-gray-600 leading-tight">Check still unpaid in Xero</span>
        </label>
        <p className="text-[9px] text-gray-400 mt-0.5 pl-[18px] leading-tight">Required safety check before this action runs.</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-green-400" />
    </div>
  );
}

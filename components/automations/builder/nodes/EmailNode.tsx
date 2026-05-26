"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mail } from "lucide-react";

export function EmailNode({ data, selected }: NodeProps) {
  const cfg = data as { label?: string; subject?: string; senderName?: string };
  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md w-52 ${
        selected ? "border-blue-500" : "border-blue-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-400" />
      <div className="flex items-center gap-2 rounded-t-lg bg-blue-500 px-3 py-2">
        <Mail className="h-3.5 w-3.5 text-white" />
        <span className="text-xs font-semibold text-white">Send Email</span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-700">{cfg.label ?? "Send email"}</p>
        {cfg.subject && (
          <p className="text-xs text-gray-400 mt-1 italic truncate">&ldquo;{cfg.subject}&rdquo;</p>
        )}
        {cfg.senderName && (
          <p className="text-xs text-gray-400 mt-0.5">From: {cfg.senderName}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-400" />
    </div>
  );
}

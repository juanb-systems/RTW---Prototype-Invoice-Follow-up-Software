"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MessageSquare } from "lucide-react";

export function SMSNode({ data, selected }: NodeProps) {
  const cfg = data as { label?: string; template?: string };
  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md w-52 ${
        selected ? "border-purple-500" : "border-purple-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-purple-400" />
      <div className="flex items-center gap-2 rounded-t-lg bg-purple-500 px-3 py-2">
        <MessageSquare className="h-3.5 w-3.5 text-white" />
        <span className="text-xs font-semibold text-white">Send SMS</span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-700">{cfg.label ?? "Send SMS"}</p>
        {cfg.template && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 italic">&ldquo;{cfg.template}&rdquo;</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-purple-400" />
    </div>
  );
}

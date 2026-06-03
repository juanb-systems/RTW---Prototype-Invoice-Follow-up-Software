"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
  headerRight,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  headerRight?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge !== undefined && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {headerRight !== undefined && (
            <span className="text-sm font-semibold text-gray-600">{headerRight}</span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

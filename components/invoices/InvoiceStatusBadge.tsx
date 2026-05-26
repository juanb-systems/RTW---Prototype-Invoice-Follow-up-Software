import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";

const config: Record<InvoiceStatus, { label: string; className: string }> = {
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700 border-red-200" },
  paid: { label: "Paid", className: "bg-green-100 text-green-700 border-green-200" },
  disputed: { label: "Disputed", className: "bg-amber-100 text-amber-700 border-amber-200" },
  voided: { label: "Voided", className: "bg-gray-100 text-gray-500 border-gray-200" },
  partial: { label: "Partial", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, className } = config[status] ?? config.overdue;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

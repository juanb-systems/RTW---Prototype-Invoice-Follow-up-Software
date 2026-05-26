import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/lib/types";

const config: Record<ContactStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
  excluded: { label: "Excluded", className: "bg-red-100 text-red-700 border-red-200" },
  on_hold: { label: "On Hold", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const { label, className } = config[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

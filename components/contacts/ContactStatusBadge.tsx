import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/lib/types";

// M3-style assist chips — tonal background, no border
const config: Record<ContactStatus, { label: string; className: string }> = {
  active:   { label: "Active",    className: "bg-green-100 text-green-700" },
  excluded: { label: "Excluded",  className: "bg-red-100 text-red-700" },
  on_hold:  { label: "On Hold",   className: "bg-amber-100 text-amber-700" },
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const { label, className } = config[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

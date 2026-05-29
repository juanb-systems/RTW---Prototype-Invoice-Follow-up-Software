import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  ArrowLeftRight,
  Reply,
  SkipForward,
  ShieldX,
  PenLine,
  GitBranch,
  PauseCircle,
} from "lucide-react";
import { formatActivityTimestamp } from "@/lib/utils";
import type { TimelineEventType } from "@/lib/types";

interface ActivityItem {
  id: string;
  invoiceId: string;
  eventType: TimelineEventType;
  timestamp: string;
  message: string;
  invoice?: { invoiceNumber: string } | null;
  contact?: { name: string; company: string } | null;
}

const eventConfig: Record<
  TimelineEventType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  email_sent: { icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
  sms_sent: { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
  call_scheduled: { icon: Phone, color: "text-green-600", bg: "bg-green-50" },
  lookup_performed: { icon: RefreshCw, color: "text-gray-500", bg: "bg-gray-100" },
  status_changed: { icon: ArrowLeftRight, color: "text-indigo-600", bg: "bg-indigo-50" },
  reply_received: { icon: Reply, color: "text-teal-600", bg: "bg-teal-50" },
  action_skipped: { icon: SkipForward, color: "text-yellow-600", bg: "bg-yellow-50" },
  action_blocked: { icon: ShieldX, color: "text-red-600", bg: "bg-red-50" },
  manual_note: { icon: PenLine, color: "text-gray-600", bg: "bg-gray-100" },
  flow_assigned: { icon: GitBranch, color: "text-blue-500", bg: "bg-blue-50" },
  automation_paused: { icon: PauseCircle, color: "text-orange-600", bg: "bg-orange-50" },
};

export function RecentActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        <Link href="/invoices" className="text-xs text-blue-600 hover:underline">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-gray-50">
        {items.map((item) => {
          const cfg = eventConfig[item.eventType] ?? eventConfig.manual_note;
          const Icon = cfg.icon;
          return (
            <li key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/50">
              <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed">{item.message}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
                  {item.invoice && (
                    <Link
                      href={`/invoices/${item.invoiceId}`}
                      className="whitespace-nowrap font-medium text-blue-500 hover:underline"
                    >
                      {item.invoice.invoiceNumber}
                    </Link>
                  )}
                  {item.contact && (
                    <span className="truncate">{item.contact.name}</span>
                  )}
                  <span className="sm:ml-auto flex-shrink-0">{formatActivityTimestamp(item.timestamp)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
import { cn, formatDateTime } from "@/lib/utils";
import type { TimelineEventType } from "@/lib/types";

interface TimelineEventItemProps {
  eventType: TimelineEventType;
  timestamp: string;
  message: string;
  isLast?: boolean;
}

const eventConfig: Record<
  TimelineEventType,
  { icon: React.ElementType; color: string; bg: string; borderColor: string }
> = {
  email_sent: { icon: Mail, color: "text-blue-600", bg: "bg-blue-50", borderColor: "border-blue-200" },
  sms_sent: { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", borderColor: "border-purple-200" },
  call_scheduled: { icon: Phone, color: "text-green-600", bg: "bg-green-50", borderColor: "border-green-200" },
  lookup_performed: { icon: RefreshCw, color: "text-gray-500", bg: "bg-gray-100", borderColor: "border-gray-200" },
  status_changed: { icon: ArrowLeftRight, color: "text-indigo-600", bg: "bg-indigo-50", borderColor: "border-indigo-200" },
  reply_received: { icon: Reply, color: "text-teal-600", bg: "bg-teal-50", borderColor: "border-teal-200" },
  action_skipped: { icon: SkipForward, color: "text-yellow-600", bg: "bg-yellow-50", borderColor: "border-yellow-200" },
  action_blocked: { icon: ShieldX, color: "text-red-600", bg: "bg-red-50", borderColor: "border-red-200" },
  manual_note: { icon: PenLine, color: "text-gray-600", bg: "bg-gray-100", borderColor: "border-gray-200" },
  flow_assigned: { icon: GitBranch, color: "text-blue-500", bg: "bg-blue-50", borderColor: "border-blue-200" },
  automation_paused: { icon: PauseCircle, color: "text-orange-600", bg: "bg-orange-50", borderColor: "border-orange-200" },
};

const eventLabels: Record<TimelineEventType, string> = {
  email_sent: "Email Sent",
  sms_sent: "SMS Sent",
  call_scheduled: "Call Scheduled",
  lookup_performed: "Lookup Performed",
  status_changed: "Status Changed",
  reply_received: "Reply Received",
  action_skipped: "Action Skipped",
  action_blocked: "Action Blocked",
  manual_note: "Note Added",
  flow_assigned: "Flow Assigned",
  automation_paused: "Automation Paused",
};

export function TimelineEventItem({
  eventType,
  timestamp,
  message,
  isLast = false,
}: TimelineEventItemProps) {
  const cfg = eventConfig[eventType] ?? eventConfig.manual_note;
  const Icon = cfg.icon;
  const label = eventLabels[eventType] ?? eventType;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border", cfg.bg, cfg.borderColor)}>
          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200 min-h-4" />}
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-gray-700">{label}</span>
          <span className="text-xs text-gray-400">{formatDateTime(timestamp)}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

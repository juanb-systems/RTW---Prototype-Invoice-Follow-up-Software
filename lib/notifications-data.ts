export type NotifCategory =
  | "dispute"
  | "approval"
  | "overdue"
  | "reply"
  | "call"
  | "automation"
  | "system";

export interface AppNotification {
  id: string;
  text: string;
  detail?: string;
  timeLabel: string;
  dotColor: string;
  href: string;
  category: NotifCategory;
  isRead: boolean;
}

// ── Deep-link routing rules ────────────────────────────────────────────────────
//
// Each notification links to the most specific available destination:
//   - Invoice-specific → /invoices/[invoiceId]          (invoice detail)
//   - Needs approval   → /scheduled?filter=awaiting_approval
//   - Blocked actions  → /scheduled?filter=blocked
//   - Overdue group    → /invoices?filter=overdue        (Receivables filtered)
//   - Specific reply   → /inbox?message=[messageId]     (opens thread)
//   - Reply type       → /inbox?filter=[classification] (pre-filtered inbox)
//   - Call outcomes    → /scheduled                     (calls surface in Actions)
//   - Paused autos     → /inbox?filter=needs_action

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    text: "INV-2026-017 has an active dispute — review recommended",
    detail: "Pinnacle Systems raised a billing dispute. Automation is paused pending resolution.",
    timeLabel: "2 min ago",
    dotColor: "bg-red-500",
    href: "/invoices/INV017",
    category: "dispute",
    isRead: false,
  },
  {
    id: "n2",
    text: "2 scheduled actions require manual approval",
    detail: "Manual approval mode is active. Actions are queued and waiting.",
    timeLabel: "14 min ago",
    dotColor: "bg-purple-500",
    href: "/scheduled?filter=awaiting_approval",
    category: "approval",
    isRead: false,
  },
  {
    id: "n3",
    text: "3 invoices are now 60+ days overdue",
    detail: "These invoices may require escalation or a personal call.",
    timeLabel: "1 hr ago",
    dotColor: "bg-orange-400",
    href: "/invoices?filter=overdue",
    category: "overdue",
    isRead: false,
  },
  {
    id: "n4",
    text: "Promise to pay received from Metro Supplies",
    detail: "Customer confirmed payment by end of week. Automation paused for 7 days.",
    timeLabel: "3 hrs ago",
    dotColor: "bg-teal-500",
    href: "/inbox?filter=promise_to_pay",
    category: "reply",
    isRead: true,
  },
  {
    id: "n5",
    text: "AI call to Harbour View Logistics completed — voicemail left",
    detail: "No answer. Voicemail left per call template. No classification recorded.",
    timeLabel: "5 hrs ago",
    dotColor: "bg-green-500",
    href: "/scheduled",
    category: "call",
    isRead: true,
  },
  {
    id: "n6",
    text: "Automation paused for INV-2026-012",
    detail: "Customer replied with a payment query. Automation held pending manual review.",
    timeLabel: "6 hrs ago",
    dotColor: "bg-amber-500",
    href: "/inbox?message=MSG005",
    category: "automation",
    isRead: true,
  },
  {
    id: "n7",
    text: "Dispute raised on INV-2026-022 by Green Valley Engineering",
    detail: "Invoice amount disputed. All follow-up automations have been blocked.",
    timeLabel: "Yesterday",
    dotColor: "bg-red-500",
    href: "/invoices/INV022",
    category: "dispute",
    isRead: true,
  },
  {
    id: "n8",
    text: "Email action for INV-2026-009 awaiting approval",
    detail: "Scheduled email to Coastal Freight is queued for manual approval before sending.",
    timeLabel: "Yesterday",
    dotColor: "bg-purple-500",
    href: "/scheduled?filter=awaiting_approval",
    category: "approval",
    isRead: true,
  },
  {
    id: "n9",
    text: "AI call transcript needs review — Coastal Freight",
    detail: "Call classification is uncertain. Manual review of the transcript is recommended.",
    timeLabel: "2 days ago",
    dotColor: "bg-green-500",
    href: "/scheduled",
    category: "call",
    isRead: true,
  },
  {
    id: "n10",
    text: "5 invoices entered the 30+ day overdue bracket",
    detail: "These invoices have crossed the 30-day threshold and may need escalation.",
    timeLabel: "2 days ago",
    dotColor: "bg-orange-400",
    href: "/invoices?filter=overdue",
    category: "overdue",
    isRead: true,
  },
  {
    id: "n11",
    text: "Xero lookup blocked action for INV-2026-008",
    detail: "Fresh lookup returned a 'block' outcome — contact is excluded from automations.",
    timeLabel: "3 days ago",
    dotColor: "bg-gray-500",
    href: "/scheduled?filter=blocked",
    category: "system",
    isRead: true,
  },
  {
    id: "n12",
    text: "Out-of-office reply received from Harbour View Logistics",
    detail: "Auto-reply detected. Automation paused for 5 business days.",
    timeLabel: "3 days ago",
    dotColor: "bg-teal-500",
    href: "/inbox?filter=needs_action",
    category: "reply",
    isRead: true,
  },
  {
    id: "n13",
    text: "Standard Follow-up flow completed for INV-2026-011",
    detail: "All flow steps have been executed. No further automated actions are scheduled.",
    timeLabel: "4 days ago",
    dotColor: "bg-amber-500",
    href: "/invoices/INV011",
    category: "automation",
    isRead: true,
  },
  {
    id: "n14",
    text: "Manual approval mode was enabled",
    detail: "All outgoing actions will require manual approval before sending.",
    timeLabel: "5 days ago",
    dotColor: "bg-gray-500",
    href: "/settings",
    category: "system",
    isRead: true,
  },
  {
    id: "n15",
    text: "INV-2026-003 is now 91 days overdue",
    detail: "This invoice has passed the 90-day mark. Consider escalation or write-off.",
    timeLabel: "6 days ago",
    dotColor: "bg-orange-400",
    href: "/invoices/INV003",
    category: "overdue",
    isRead: true,
  },
];

export const UNREAD_COUNT = NOTIFICATIONS.filter((n) => !n.isRead).length;

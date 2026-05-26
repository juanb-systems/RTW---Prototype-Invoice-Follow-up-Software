export type ISO8601 = string;

export type ContactStatus = "active" | "excluded" | "on_hold";
export type InvoiceStatus = "overdue" | "paid" | "disputed" | "voided" | "partial";
export type TimelineEventType =
  | "email_sent"
  | "sms_sent"
  | "call_scheduled"
  | "lookup_performed"
  | "status_changed"
  | "reply_received"
  | "action_skipped"
  | "action_blocked"
  | "manual_note"
  | "flow_assigned"
  | "automation_paused";
export type FlowStatus = "active" | "paused" | "draft";
export type StepType = "trigger" | "email" | "sms" | "call" | "wait" | "condition" | "lookup_check" | "end";
export type ScheduledActionStatus =
  | "pending"
  | "sent"
  | "skipped"
  | "blocked"
  | "approved"
  | "awaiting_approval";
export type MessageClassification =
  | "promise_to_pay"
  | "dispute"
  | "out_of_office"
  | "payment_query"
  | "unclassified";

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ContactStatus;
  notes: string;
  tags: string[];
  createdAt: ISO8601;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  contactId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: ISO8601;
  issueDate: ISO8601;
  status: InvoiceStatus;
  daysPastDue: number;
  lineItems: LineItem[];
  notes: string;
  excludedFromAutomation: boolean;
  assignedFlowId: string | null;
}

export interface TimelineEvent {
  id: string;
  invoiceId: string;
  eventType: TimelineEventType;
  timestamp: ISO8601;
  message: string;
  metadata: Record<string, unknown>;
}

export interface FlowTrigger {
  type: "days_overdue";
  value: number;
}

export interface FlowStep {
  id: string;
  type: StepType;
  order: number;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface AutomationFlow {
  id: string;
  name: string;
  description: string;
  status: FlowStatus;
  trigger: FlowTrigger;
  steps: FlowStep[];
  edges: FlowEdge[];
}

export type LookupOutcome = "proceed" | "skip" | "block" | "hold" | "awaiting_approval";

export interface LookupResult {
  invoiceStatus: InvoiceStatus;
  contactStatus: ContactStatus;
  hasOpenDispute: boolean;
  hasPromiseToPay: boolean;
  manualApprovalMode: boolean;
  outcome: LookupOutcome;
  reason: string;
  performedAt: ISO8601;
}

export interface ScheduledAction {
  id: string;
  invoiceId: string;
  contactId: string;
  flowId: string;
  stepId: string;
  stepType: StepType;
  scheduledAt: ISO8601;
  status: ScheduledActionStatus;
  skipReason: string | null;
  lookupResult: LookupResult | null;
}

export interface InboxMessage {
  id: string;
  invoiceId: string;
  contactId: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: ISO8601;
  classification: MessageClassification;
  isRead: boolean;
  isReplied: boolean;
  automationPaused: boolean;
}

export interface AppSettings {
  manualApprovalMode: boolean;
  lookupOnEveryAction: boolean;
  blockedKeywords: string[];
  defaultSenderName: string;
  defaultSenderEmail: string;
  companyName: string;
}

export interface DataStore {
  contacts: Contact[];
  invoices: Invoice[];
  timelineEvents: TimelineEvent[];
  automationFlows: AutomationFlow[];
  scheduledActions: ScheduledAction[];
  inboxMessages: InboxMessage[];
  settings: AppSettings;
}

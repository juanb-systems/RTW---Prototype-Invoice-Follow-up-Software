import { getDb } from "./store";
import type {
  Contact,
  Invoice,
  AutomationFlow,
  TimelineEvent,
  ScheduledAction,
  InboxMessage,
} from "./types";

// Server-side data access functions used by Server Components
// These read directly from the in-memory store without HTTP round-trips.

export function getInvoicesWithContacts() {
  const db = getDb();
  return db.invoices.map((inv) => {
    const contact = db.contacts.find((c) => c.id === inv.contactId) ?? null;
    return { ...inv, contact } as Invoice & { contact: Contact | null };
  });
}

export function getInvoiceWithContact(id: string) {
  const db = getDb();
  const invoice = db.invoices.find((i) => i.id === id);
  if (!invoice) return null;
  const contact = db.contacts.find((c) => c.id === invoice.contactId) ?? null;
  return { ...invoice, contact } as Invoice & { contact: Contact | null };
}

export function getTimelineForInvoice(invoiceId: string): TimelineEvent[] {
  const db = getDb();
  return db.timelineEvents
    .filter((e) => e.invoiceId === invoiceId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getContactsWithStats() {
  const db = getDb();
  return db.contacts.map((contact) => {
    const invoices = db.invoices.filter((i) => i.contactId === contact.id);
    const overdueInvoices = invoices.filter(
      (i) => i.status === "overdue" || i.status === "partial"
    );
    const totalOwed = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
    return {
      ...contact,
      invoiceCount: invoices.length,
      overdueCount: overdueInvoices.length,
      totalOwed,
    };
  });
}

export function getContactWithInvoices(id: string) {
  const db = getDb();
  const contact = db.contacts.find((c) => c.id === id);
  if (!contact) return null;
  const invoices = db.invoices.filter((i) => i.contactId === id);
  return { ...contact, invoices } as Contact & { invoices: Invoice[] };
}

export function getAutomationFlows(): AutomationFlow[] {
  return getDb().automationFlows;
}

export function getAutomationFlow(id: string): AutomationFlow | null {
  return getDb().automationFlows.find((f) => f.id === id) ?? null;
}

export function getScheduledActionsWithDetails() {
  const db = getDb();
  return db.scheduledActions.map((action) => {
    const invoice = db.invoices.find((i) => i.id === action.invoiceId) ?? null;
    const contact = db.contacts.find((c) => c.id === action.contactId) ?? null;
    const flow = db.automationFlows.find((f) => f.id === action.flowId) ?? null;
    return { ...action, invoice, contact, flow } as ScheduledAction & {
      invoice: Invoice | null;
      contact: Contact | null;
      flow: AutomationFlow | null;
    };
  });
}

export function getLatestInboxMessageForInvoice(invoiceId: string): InboxMessage | null {
  const db = getDb();
  const messages = db.inboxMessages
    .filter((m) => m.invoiceId === invoiceId)
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  return messages[0] ?? null;
}

// ── Attention detail items (passed to NeedsAttentionSection client component) ─

export type AttentionInvItem = {
  id: string;
  invoiceNumber: string;
  amount: number;
  daysPastDue: number;
  status: string;
  contactName: string;
  contactCompany: string;
};

export type AttentionActionItem = {
  id: string;
  stepType: string;
  invoiceId: string;
  invoiceNumber: string;
  contactName: string;
  lookupReason: string | null;
  skipReason: string | null;
};

export type AttentionMsgItem = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  subject: string;
  classification: string;
  contactName: string;
};

export type AttentionDetails = {
  disputes: AttentionInvItem[];
  blocked: AttentionActionItem[];
  overdue60plus: AttentionInvItem[];
  overdue30to60: AttentionInvItem[];
  awaitingApproval: AttentionActionItem[];
  pausedAutomations: AttentionMsgItem[];
  unreadReplies: AttentionMsgItem[];
  promisesToPay: AttentionMsgItem[];
};

export function getAttentionDetails(): AttentionDetails {
  const db = getDb();
  const overdueInvoices = db.invoices.filter(
    (i) => i.status === "overdue" || i.status === "partial"
  );

  const toInvItem = (inv: Invoice): AttentionInvItem => {
    const contact = db.contacts.find((c) => c.id === inv.contactId);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      daysPastDue: inv.daysPastDue,
      status: inv.status,
      contactName: contact?.name ?? "Unknown",
      contactCompany: contact?.company ?? "",
    };
  };

  const toActionItem = (a: ScheduledAction): AttentionActionItem => {
    const inv = db.invoices.find((i) => i.id === a.invoiceId);
    const contact = db.contacts.find((c) => c.id === a.contactId);
    return {
      id: a.id,
      stepType: a.stepType,
      invoiceId: a.invoiceId,
      invoiceNumber: inv?.invoiceNumber ?? "—",
      contactName: contact?.name ?? "Unknown",
      lookupReason: a.lookupResult?.reason ?? null,
      skipReason: a.skipReason,
    };
  };

  const toMsgItem = (m: InboxMessage): AttentionMsgItem => {
    const inv = db.invoices.find((i) => i.id === m.invoiceId);
    const contact = db.contacts.find((c) => c.id === m.contactId);
    return {
      id: m.id,
      invoiceId: m.invoiceId,
      invoiceNumber: inv?.invoiceNumber ?? "—",
      subject: m.subject,
      classification: m.classification,
      contactName: contact?.name ?? (m.from ? m.from.split("@")[0] : "Unknown"),
    };
  };

  return {
    disputes: db.invoices.filter((i) => i.status === "disputed").map(toInvItem),
    blocked: db.scheduledActions.filter((a) => a.status === "blocked").map(toActionItem),
    overdue60plus: overdueInvoices
      .filter((i) => i.daysPastDue >= 60)
      .sort((a, b) => b.daysPastDue - a.daysPastDue)
      .map(toInvItem),
    overdue30to60: overdueInvoices
      .filter((i) => i.daysPastDue >= 30 && i.daysPastDue < 60)
      .sort((a, b) => b.daysPastDue - a.daysPastDue)
      .map(toInvItem),
    awaitingApproval: db.scheduledActions
      .filter((a) => a.status === "awaiting_approval")
      .map(toActionItem),
    pausedAutomations: db.inboxMessages
      .filter((m) => m.automationPaused)
      .map(toMsgItem),
    // Inbox is email-only — calls are surfaced in Actions, not Inbox.
    // Counts here must match what Inbox actually shows so dashboard totals are trustworthy.
    unreadReplies: db.inboxMessages
      .filter((m) => !m.isRead && m.type !== "call")
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .map(toMsgItem),
    promisesToPay: db.inboxMessages
      .filter((m) => m.classification === "promise_to_pay" && m.type !== "call")
      .map(toMsgItem),
  };
}

// ── Customer account summary (one entry per contact, grouped across all invoices) ─

export type CustomerAccount = {
  contactId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  contactStatus: string;
  tags: string[];
  invoiceCount: number;
  overdueCount: number;
  paidCount: number;
  disputedCount: number;
  totalOverdueBalance: number;
  maxDaysPastDue: number;
  // Most overdue invoice drives the automation stage
  mostOverdueInvoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    daysPastDue: number;
    status: string;
    assignedFlowId: string | null;
    assignedFlowName: string | null;
  } | null;
  // Latest email reply (calls excluded — they live in Actions)
  latestMessageClassification: string | null;
  latestMessageId: string | null;
  latestMessageReceivedAt: string | null;
  automationPaused: boolean;
  pendingActionCount: number;
  awaitingApprovalCount: number;
  // Overdue invoices sorted most-overdue-first for the expandable list
  overdueInvoices: {
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
    status: string;
    assignedFlowId: string | null;
  }[];
};

export function getCustomerAccounts(): CustomerAccount[] {
  const db = getDb();

  const accounts = db.contacts.map((contact) => {
    const allInvoices = db.invoices.filter((i) => i.contactId === contact.id);
    if (allInvoices.length === 0) return null;

    const overdueInvoices = allInvoices.filter(
      (i) => i.status === "overdue" || i.status === "partial"
    );
    const totalOverdueBalance = overdueInvoices.reduce((s, i) => s + i.amount, 0);

    const mostOverdueInvoice = overdueInvoices.reduce<Invoice | null>(
      (prev, curr) => (!prev || curr.daysPastDue > prev.daysPastDue ? curr : prev),
      null
    );

    const assignedFlow = mostOverdueInvoice?.assignedFlowId
      ? db.automationFlows.find((f) => f.id === mostOverdueInvoice.assignedFlowId) ?? null
      : null;

    // Latest email reply only — calls belong in Actions, not Inbox
    const latestMsg = db.inboxMessages
      .filter((m) => m.contactId === contact.id && m.type !== "call")
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())[0] ?? null;

    const contactActions = db.scheduledActions.filter((a) => a.contactId === contact.id);

    return {
      contactId: contact.id,
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      contactStatus: contact.status,
      tags: contact.tags,
      invoiceCount: allInvoices.length,
      overdueCount: overdueInvoices.length,
      paidCount: allInvoices.filter((i) => i.status === "paid").length,
      disputedCount: allInvoices.filter((i) => i.status === "disputed").length,
      totalOverdueBalance,
      maxDaysPastDue: mostOverdueInvoice?.daysPastDue ?? 0,
      mostOverdueInvoice: mostOverdueInvoice
        ? {
            id: mostOverdueInvoice.id,
            invoiceNumber: mostOverdueInvoice.invoiceNumber,
            amount: mostOverdueInvoice.amount,
            daysPastDue: mostOverdueInvoice.daysPastDue,
            status: mostOverdueInvoice.status,
            assignedFlowId: mostOverdueInvoice.assignedFlowId,
            assignedFlowName: assignedFlow?.name ?? null,
          }
        : null,
      latestMessageClassification: latestMsg?.classification ?? null,
      latestMessageId: latestMsg?.id ?? null,
      latestMessageReceivedAt: latestMsg?.receivedAt ?? null,
      automationPaused: latestMsg?.automationPaused ?? false,
      pendingActionCount: contactActions.filter((a) => a.status === "pending").length,
      awaitingApprovalCount: contactActions.filter((a) => a.status === "awaiting_approval").length,
      overdueInvoices: overdueInvoices
        .sort((a, b) => b.daysPastDue - a.daysPastDue)
        .map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          amount: i.amount,
          dueDate: i.dueDate,
          daysPastDue: i.daysPastDue,
          status: i.status,
          assignedFlowId: i.assignedFlowId,
        })),
    };
  });

  return accounts.filter(Boolean) as CustomerAccount[];
}

export function getDashboardData() {
  const db = getDb();

  const overdueInvoices = db.invoices.filter(
    (i) => i.status === "overdue" || i.status === "partial"
  );
  const totalOverdueAmount = overdueInvoices.reduce((s, i) => s + i.amount, 0);
  const avgDaysPastDue =
    overdueInvoices.length > 0
      ? Math.round(
          overdueInvoices.reduce((s, i) => s + i.daysPastDue, 0) /
            overdueInvoices.length
        )
      : 0;
  const pendingActions = db.scheduledActions.filter(
    (a) => a.status === "pending"
  ).length;
  const awaitingApproval = db.scheduledActions.filter(
    (a) => a.status === "awaiting_approval"
  ).length;
  const customersWithOverdue = new Set(overdueInvoices.map((i) => i.contactId)).size;

  const agingBuckets = [
    { label: "1–14d", count: 0, amount: 0 },
    { label: "15–30d", count: 0, amount: 0 },
    { label: "31–60d", count: 0, amount: 0 },
    { label: "61–90d", count: 0, amount: 0 },
    { label: "90d+", count: 0, amount: 0 },
  ];

  for (const inv of overdueInvoices) {
    const d = inv.daysPastDue;
    let bucket: (typeof agingBuckets)[0];
    if (d <= 14) bucket = agingBuckets[0];
    else if (d <= 30) bucket = agingBuckets[1];
    else if (d <= 60) bucket = agingBuckets[2];
    else if (d <= 90) bucket = agingBuckets[3];
    else bucket = agingBuckets[4];
    bucket.count++;
    bucket.amount += inv.amount;
  }

  const collectionsTrend = [
    { month: "Dec", collected: 48500, target: 60000 },
    { month: "Jan", collected: 62100, target: 60000 },
    { month: "Feb", collected: 55300, target: 65000 },
    { month: "Mar", collected: 71200, target: 65000 },
    { month: "Apr", collected: 58900, target: 70000 },
    { month: "May", collected: 34200, target: 70000 },
  ];

  const recentActivity = db.timelineEvents
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 8)
    .map((event) => {
      const invoice = db.invoices.find((i) => i.id === event.invoiceId) ?? null;
      const contact = invoice
        ? (db.contacts.find((c) => c.id === invoice.contactId) ?? null)
        : null;
      return { ...event, invoice, contact };
    });

  const needsAttention = {
    disputes: db.invoices.filter((i) => i.status === "disputed").length,
    promisesToPay: db.inboxMessages.filter((m) => m.classification === "promise_to_pay").length,
    unreadReplies: db.inboxMessages.filter((m) => !m.isRead).length,
    pausedAutomations: db.inboxMessages.filter((m) => m.automationPaused).length,
    awaitingApproval: db.scheduledActions.filter((a) => a.status === "awaiting_approval").length,
    blocked: db.scheduledActions.filter((a) => a.status === "blocked").length,
    overdue30to60: overdueInvoices.filter((i) => i.daysPastDue >= 30 && i.daysPastDue < 60).length,
    overdue60plus: overdueInvoices.filter((i) => i.daysPastDue >= 60).length,
  };

  return {
    kpis: { totalOverdue: overdueInvoices.length, totalOverdueAmount, avgDaysPastDue, pendingActions, awaitingApproval, customersWithOverdue },
    agingBuckets,
    collectionsTrend,
    recentActivity,
    needsAttention,
  };
}

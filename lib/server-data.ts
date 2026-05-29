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
    (a) => a.status === "pending" || a.status === "awaiting_approval"
  ).length;

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
  };

  return {
    kpis: { totalOverdue: overdueInvoices.length, totalOverdueAmount, avgDaysPastDue, pendingActions },
    agingBuckets,
    collectionsTrend,
    recentActivity,
    needsAttention,
  };
}

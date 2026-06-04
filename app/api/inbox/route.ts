import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/store";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const messages = db.inboxMessages.map((msg) => {
    const invoice = db.invoices.find((i) => i.id === msg.invoiceId);
    const contact = db.contacts.find((c) => c.id === msg.contactId);

    // Customer account context — all overdue invoices for this contact
    const contactInvoices = contact
      ? db.invoices.filter((i) => i.contactId === contact.id)
      : [];
    const overdueInvoices = contactInvoices.filter(
      (i) => i.status === "overdue" || i.status === "partial"
    );
    const totalOverdueBalance = overdueInvoices.reduce((s, i) => s + i.amount, 0);
    const mostOverdue = overdueInvoices.reduce<(typeof contactInvoices)[0] | null>(
      (prev, curr) => (!prev || curr.daysPastDue > prev.daysPastDue ? curr : prev),
      null
    );

    const customerAccount =
      contact && overdueInvoices.length > 0
        ? {
            overdueCount: overdueInvoices.length,
            totalOverdueBalance,
            maxDaysPastDue: mostOverdue?.daysPastDue ?? 0,
            overdueInvoices: overdueInvoices
              .sort((a, b) => b.daysPastDue - a.daysPastDue)
              .map((i) => ({
                id: i.id,
                invoiceNumber: i.invoiceNumber,
                amount: i.amount,
                daysPastDue: i.daysPastDue,
                status: i.status,
              })),
          }
        : null;

    return { ...msg, invoice, contact, customerAccount };
  });
  return NextResponse.json(messages);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const db = getDb();
  const idx = db.inboxMessages.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["isRead", "isReplied", "automationPaused", "classification"];
  for (const key of allowed) {
    if (key in updates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.inboxMessages[idx] as any)[key] = updates[key];
    }
  }

  // If pausing automation, add timeline event
  if (updates.automationPaused === true) {
    const msg = db.inboxMessages[idx];
    db.timelineEvents.push({
      id: generateId("TL"),
      invoiceId: msg.invoiceId,
      eventType: "automation_paused",
      timestamp: new Date().toISOString(),
      message: "Automation paused due to customer reply.",
      metadata: { messageId: msg.id, classification: msg.classification },
    });
  }

  return NextResponse.json(db.inboxMessages[idx]);
}

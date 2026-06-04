import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const actions = db.scheduledActions.map((action) => {
    const invoice = db.invoices.find((i) => i.id === action.invoiceId);
    const contact = db.contacts.find((c) => c.id === action.contactId);
    const flow = db.automationFlows.find((f) => f.id === action.flowId);

    // Build customer account context — all overdue invoices for this contact
    const contactInvoices = contact
      ? db.invoices.filter((i) => i.contactId === contact.id)
      : [];
    const contactOverdueInvoices = contactInvoices.filter(
      (i) => i.status === "overdue" || i.status === "partial"
    );
    const totalOverdueBalance = contactOverdueInvoices.reduce((s, i) => s + i.amount, 0);
    const mostOverdue = contactOverdueInvoices.reduce<(typeof contactInvoices)[0] | null>(
      (prev, curr) => (!prev || curr.daysPastDue > prev.daysPastDue ? curr : prev),
      null
    );

    const customerAccount =
      contact && contactOverdueInvoices.length > 0
        ? {
            overdueCount: contactOverdueInvoices.length,
            totalOverdueBalance,
            maxDaysPastDue: mostOverdue?.daysPastDue ?? 0,
            mostOverdueInvoiceNumber: mostOverdue?.invoiceNumber ?? null,
            overdueInvoices: contactOverdueInvoices
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

    return { ...action, invoice, contact, flow, customerAccount };
  });
  return NextResponse.json(actions);
}

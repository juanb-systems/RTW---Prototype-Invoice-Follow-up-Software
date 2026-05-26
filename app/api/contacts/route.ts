import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const contacts = db.contacts.map((contact) => {
    const invoices = db.invoices.filter((i) => i.contactId === contact.id);
    const overdueInvoices = invoices.filter((i) => i.status === "overdue" || i.status === "partial");
    const totalOwed = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
    return { ...contact, invoiceCount: invoices.length, overdueCount: overdueInvoices.length, totalOwed };
  });
  return NextResponse.json(contacts);
}

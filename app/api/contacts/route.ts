import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";
import type { ContactStatus } from "@/lib/types";

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

export async function POST(request: Request) {
  const db   = getDb();
  const body = await request.json();

  const allowed: ContactStatus[] = ["active", "excluded", "on_hold"];
  const status: ContactStatus = allowed.includes(body.status) ? body.status : "active";

  const newContact = {
    id:        `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name:      String(body.name   ?? "").trim(),
    company:   String(body.company ?? "").trim(),
    email:     String(body.email  ?? "").trim(),
    phone:     String(body.phone  ?? "").trim(),
    status,
    notes:     String(body.notes  ?? "").trim(),
    tags:      [] as string[],
    createdAt: new Date().toISOString(),
  };

  db.contacts.push(newContact);
  return NextResponse.json(newContact, { status: 201 });
}

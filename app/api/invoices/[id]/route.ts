import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const invoice = db.invoices.find((i) => i.id === id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const contact = db.contacts.find((c) => c.id === invoice.contactId);
  return NextResponse.json({ ...invoice, contact });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const idx = db.invoices.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const allowed = ["excludedFromAutomation", "assignedFlowId", "status", "notes"];
  for (const key of allowed) {
    if (key in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.invoices[idx] as any)[key] = body[key];
    }
  }
  return NextResponse.json(db.invoices[idx]);
}

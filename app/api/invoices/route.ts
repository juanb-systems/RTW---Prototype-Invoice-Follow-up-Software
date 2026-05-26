import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const invoices = db.invoices.map((inv) => {
    const contact = db.contacts.find((c) => c.id === inv.contactId);
    return { ...inv, contact };
  });
  return NextResponse.json(invoices);
}

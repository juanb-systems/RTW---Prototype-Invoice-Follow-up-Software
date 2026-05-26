import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const actions = db.scheduledActions.map((action) => {
    const invoice = db.invoices.find((i) => i.id === action.invoiceId);
    const contact = db.contacts.find((c) => c.id === action.contactId);
    const flow = db.automationFlows.find((f) => f.id === action.flowId);
    return { ...action, invoice, contact, flow };
  });
  return NextResponse.json(actions);
}

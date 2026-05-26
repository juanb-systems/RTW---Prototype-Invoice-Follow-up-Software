import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/store";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  const db = getDb();
  const events = db.timelineEvents
    .filter((e) => e.invoiceId === invoiceId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json(events);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  const db = getDb();
  const invoice = db.invoices.find((i) => i.id === invoiceId);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const event = {
    id: generateId("TL"),
    invoiceId,
    eventType: body.eventType ?? "manual_note",
    timestamp: new Date().toISOString(),
    message: body.message ?? "",
    metadata: body.metadata ?? {},
  };
  db.timelineEvents.push(event);
  return NextResponse.json(event, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const contact = db.contacts.find((c) => c.id === id);
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const invoices = db.invoices.filter((i) => i.contactId === id);
  return NextResponse.json({ ...contact, invoices });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const idx = db.contacts.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const allowed = ["status", "notes", "tags"];
  for (const key of allowed) {
    if (key in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.contacts[idx] as any)[key] = body[key];
    }
  }
  return NextResponse.json(db.contacts[idx]);
}

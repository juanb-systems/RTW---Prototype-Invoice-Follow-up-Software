import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const action = db.scheduledActions.find((a) => a.id === id);
  if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(action);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const idx = db.scheduledActions.findIndex((a) => a.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const allowed = ["status", "skipReason"];
  for (const key of allowed) {
    if (key in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.scheduledActions[idx] as any)[key] = body[key];
    }
  }
  return NextResponse.json(db.scheduledActions[idx]);
}

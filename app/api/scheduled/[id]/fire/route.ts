import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/store";
import { runFreshLookup } from "@/lib/lookup-engine";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const action = db.scheduledActions.find((a) => a.id === id);
  if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action.status === "sent") {
    return NextResponse.json({ error: "Action already sent" }, { status: 400 });
  }

  try {
    const lookupResult = runFreshLookup(id, db);
    const updatedAction = db.scheduledActions.find((a) => a.id === id);
    return NextResponse.json({ lookupResult, action: updatedAction });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.settings);
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const allowed = [
    "manualApprovalMode",
    "lookupOnEveryAction",
    "blockedKeywords",
    "defaultSenderName",
    "defaultSenderEmail",
    "companyName",
  ];
  for (const key of allowed) {
    if (key in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.settings as any)[key] = body[key];
    }
  }
  return NextResponse.json(db.settings);
}

import { NextResponse } from "next/server";
import { getCustomerAccounts } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getCustomerAccounts());
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";
import type { AutomationFlow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.automationFlows);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json().catch(() => ({}));

  const id = `FLOW-${Date.now()}`;
  const defaultSteps = [
    { id: `${id}-T`,   type: "trigger" as const, order: 1, config: { label: "Invoice 7 days overdue", days: 7 }, position: { x: 300, y: 50 } },
    { id: `${id}-END`, type: "end"     as const, order: 2, config: { label: "End" },                             position: { x: 300, y: 230 } },
  ];
  const defaultEdges = [{ id: `${id}-E1`, source: `${id}-T`, target: `${id}-END` }];

  const newFlow: AutomationFlow = {
    id,
    name: (typeof body.name === "string" && body.name.trim()) ? body.name.trim() : "Untitled Flow",
    description: "New automation flow",
    status: "draft",
    trigger: { type: "days_overdue", value: 7 },
    // Accept steps/edges from the builder if provided (save from /new/builder)
    steps: Array.isArray(body.steps) && body.steps.length > 0 ? body.steps : defaultSteps,
    edges: Array.isArray(body.edges) ? body.edges : defaultEdges,
  };

  db.automationFlows.push(newFlow);
  return NextResponse.json(newFlow, { status: 201 });
}

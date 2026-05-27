"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { FlowBuilder } from "@/components/automations/builder/FlowBuilder";
import type { AutomationFlow, FlowStep, FlowEdge } from "@/lib/types";

function defaultFlow(name: string): AutomationFlow {
  return {
    id: "new",
    name,
    description: "New automation flow",
    status: "draft",
    trigger: { type: "days_overdue", value: 7 },
    steps: [
      {
        id: "new-T",
        type: "trigger",
        order: 1,
        config: { label: "Invoice 7 days overdue", days: 7 },
        position: { x: 300, y: 50 },
      },
      {
        id: "new-END",
        type: "end",
        order: 2,
        config: { label: "End" },
        position: { x: 300, y: 230 },
      },
    ],
    edges: [{ id: "new-E1", source: "new-T", target: "new-END" }],
  };
}

function NewBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get("name") || "Untitled Flow";
  const flow = defaultFlow(name);

  async function handleSaveNew(steps: FlowStep[], edges: FlowEdge[]) {
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, steps, edges }),
    });
    if (res.ok) {
      // Navigate to the list — the new flow appears there in the current
      // server instance. We avoid navigating to /automations/{id}/builder
      // directly because Vercel serverless may route that request to a fresh
      // instance where the in-memory store no longer has the new flow.
      router.push("/automations");
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/automations"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Automations
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900">{name}</h1>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            new draft
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-600">
          <RefreshCw className="h-3.5 w-3.5" />
          Fresh lookup required before sending
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <FlowBuilder flow={flow} onSaveNew={handleSaveNew} />
      </div>
    </div>
  );
}

export default function NewFlowBuilderPage() {
  return (
    <Suspense>
      <NewBuilderContent />
    </Suspense>
  );
}

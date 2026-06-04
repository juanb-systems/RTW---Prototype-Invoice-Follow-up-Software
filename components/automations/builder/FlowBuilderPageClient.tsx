"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { FlowBuilder } from "./FlowBuilder";
import { useFlowStore } from "@/lib/flow-store";
import { useNavGuardStore } from "@/lib/nav-guard-store";
import type { AutomationFlow } from "@/lib/types";

export function FlowBuilderPageClient({ id }: { id: string }) {
  const storeFlows = useFlowStore((s) => s.flows);
  const upsert = useFlowStore((s) => s.upsert);
  const [apiFlow, setApiFlow] = useState<AutomationFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isDirty } = useNavGuardStore();

  // Try localStorage store first; fall back to seeded API flow
  const storeFlow = storeFlows[id];

  useEffect(() => {
    if (storeFlow) {
      setLoading(false);
      return;
    }
    fetch(`/api/automations/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setApiFlow(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, storeFlow]);

  const flow: AutomationFlow | null = storeFlow ?? apiFlow;

  function handleBackClick() {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes in the flow builder. Leave without saving?")) return;
    }
    router.push("/automations");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-xs text-gray-400">Loading flow…</p>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center max-w-sm">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Flow not found</h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            This flow could not be loaded. The flow ID may be invalid. Go back to Automations to create or edit a flow.
          </p>
          <button
            onClick={() => router.push("/automations")}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Automations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Automations
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900">{flow.name}</h1>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
              flow.status === "active"
                ? "border-green-200 bg-green-100 text-green-700"
                : "border-gray-200 bg-gray-100 text-gray-500"
            }`}
          >
            {flow.status}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-600">
          <RefreshCw className="h-3.5 w-3.5" />
          Fresh lookup required before sending
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <FlowBuilder flow={flow} onAfterSave={(updated) => upsert(updated)} />
      </div>
    </div>
  );
}

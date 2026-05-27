import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { FlowBuilder } from "@/components/automations/builder/FlowBuilder";
import { getAutomationFlow } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function FlowBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = getAutomationFlow(id);

  if (!flow) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center max-w-sm">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Flow not found</h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            This flow could not be loaded. If you just created it, the server may have restarted and cleared in-memory data. Go back to Automations and use <strong>Edit Flow</strong> on an existing flow.
          </p>
          <Link
            href="/automations"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Automations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/automations" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Automations
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900">{flow.name}</h1>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            flow.status === "active" ? "border-green-200 bg-green-100 text-green-700" : "border-gray-200 bg-gray-100 text-gray-500"
          }`}>
            {flow.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Fresh lookup required before sending
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <FlowBuilder flow={flow} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PlayCircle, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

type DemoResult = {
  invoiceNumber: string;
  contactName: string;
  outcome: string;
  reason: string;
};

export function DemoScenarioButton() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  async function runDemo() {
    setRunning(true);
    setResult(null);
    setShowResult(false);

    // Get scheduled actions
    const actionsRes = await fetch("/api/scheduled");
    const actions = await actionsRes.json();
    const pending = actions.filter((a: { status: string }) => a.status === "pending");

    if (pending.length === 0) {
      setResult({
        invoiceNumber: "N/A",
        contactName: "N/A",
        outcome: "No pending actions to demo.",
        reason: "All pending scheduled actions have been processed.",
      });
      setRunning(false);
      setShowResult(true);
      return;
    }

    // Fire the first pending action
    const action = pending[0];
    const fireRes = await fetch(`/api/scheduled/${action.id}/fire`, { method: "POST" });
    const data = await fireRes.json();

    setResult({
      invoiceNumber: action.invoice?.invoiceNumber ?? action.invoiceId,
      contactName: action.contact?.name ?? action.contactId,
      outcome: data.lookupResult?.outcome ?? "unknown",
      reason: data.lookupResult?.reason ?? "No result",
    });
    setRunning(false);
    setShowResult(true);
  }

  const outcomeIcon =
    result?.outcome === "proceed"
      ? CheckCircle2
      : result?.outcome === "skip" || result?.outcome === "block" || result?.outcome === "hold"
      ? XCircle
      : RefreshCw;
  const OutcomeIcon = outcomeIcon;

  return (
    <div className="relative">
      <button
        onClick={runDemo}
        disabled={running}
        className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-50 shadow-sm"
      >
        {running ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <PlayCircle className="h-3.5 w-3.5" />
        )}
        {running ? "Running lookup..." : "Run Demo Scenario"}
      </button>

      {showResult && result && (
        <div className="absolute right-0 top-10 z-20 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-semibold text-gray-900">Demo Scenario Result</p>
            <button onClick={() => setShowResult(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          <div className="space-y-1 text-xs text-gray-600 mb-3">
            <p>Invoice: <span className="font-medium text-gray-900">{result.invoiceNumber}</span></p>
            <p>Contact: <span className="font-medium text-gray-900">{result.contactName}</span></p>
          </div>
          <div
            className={`flex items-start gap-2 rounded-md border px-3 py-2 ${
              result.outcome === "proceed"
                ? "border-green-200 bg-green-50"
                : result.outcome === "block"
                ? "border-red-200 bg-red-50"
                : result.outcome === "skip"
                ? "border-yellow-200 bg-yellow-50"
                : "border-orange-200 bg-orange-50"
            }`}
          >
            <OutcomeIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
              result.outcome === "proceed" ? "text-green-600" :
              result.outcome === "block" ? "text-red-600" :
              result.outcome === "skip" ? "text-yellow-600" : "text-orange-600"
            }`} />
            <p className="text-xs font-medium">{result.reason}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Check the invoice timeline to see this logged.
          </p>
        </div>
      )}
    </div>
  );
}

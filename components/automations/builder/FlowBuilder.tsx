"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "./nodeTypes";
import { NodeConfigPanel } from "./NodeConfigPanel";
import type { AutomationFlow, FlowStep, FlowEdge } from "@/lib/types";
import { Save, ZapOff, AlertCircle } from "lucide-react";

function stepsToNodes(steps: FlowStep[]): Node[] {
  return steps.map((step) => ({
    id: step.id,
    type: step.type,
    position: step.position ?? { x: 250, y: step.order * 130 },
    data: step.config,
  }));
}

function edgesToRfEdges(edges: FlowEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    style: { stroke: "#9ca3af" },
    animated: false,
  }));
}

interface FlowBuilderProps {
  flow: AutomationFlow;
}

function FlowCanvas({ flow }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(stepsToNodes(flow.steps));
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesToRfEdges(flow.edges));
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lookupWarning, setLookupWarning] = useState<string | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Enforce: email/sms/call nodes must have a lookup_check as source
      const targetNode = nodes.find((n) => n.id === connection.target);
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const requiresLookup = ["email", "sms", "call"].includes(targetNode?.type ?? "");
      if (requiresLookup && sourceNode?.type !== "lookup_check") {
        setLookupWarning(
          "A fresh lookup node is required before send actions (email, SMS, call). Connect a Lookup Check node first."
        );
        setTimeout(() => setLookupWarning(null), 4000);
        return;
      }
      setEdges((eds) =>
        addEdge({ ...connection, style: { stroke: "#9ca3af" } }, eds)
      );
    },
    [nodes, setEdges]
  );

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const steps: FlowStep[] = nodes.map((n, idx) => ({
      id: n.id,
      type: n.type as FlowStep["type"],
      order: idx + 1,
      config: n.data as Record<string, unknown>,
      position: n.position,
    }));
    const flowEdges: FlowEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
    }));
    const res = await fetch(`/api/automations/${flow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps, edges: flowEdges }),
    });
    if (!res.ok) setSaveError("Failed to save. Please try again.");
    setSaving(false);
  }

  function handleNodeConfigSave(nodeId: string, config: Record<string, unknown>) {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: config } : n))
    );
    setSelectedNode(null);
  }

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {lookupWarning && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 shadow-md">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {lookupWarning}
            </div>
          )}
          {saveError && (
            <span className="text-xs text-red-600">{saveError}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Flow"}
          </button>
        </div>

        {/* Lookup enforcement notice */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 shadow-md">
          <ZapOff className="h-3.5 w-3.5 flex-shrink-0" />
          Connecting email/SMS/call without a Lookup Check node is blocked.
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
          <Controls className="!shadow-sm" />
        </ReactFlow>
      </div>

      {/* Node config panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onSave={(config) => handleNodeConfigSave(selectedNode.id, config)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

export function FlowBuilder({ flow }: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas flow={flow} />
    </ReactFlowProvider>
  );
}

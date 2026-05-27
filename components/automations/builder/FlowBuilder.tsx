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
import { Save, CheckSquare } from "lucide-react";

function stepsToDisplayNodes(steps: FlowStep[]): Node[] {
  return steps
    .filter((step) => step.type !== "lookup_check")
    .map((step) => ({
      id: step.id,
      type: step.type,
      position: step.position ?? { x: 250, y: step.order * 130 },
      data: step.config,
    }));
}

function buildDisplayEdges(steps: FlowStep[], edges: FlowEdge[]): Edge[] {
  const lookupIds = new Set(steps.filter((s) => s.type === "lookup_check").map((s) => s.id));
  const displayEdges: Edge[] = [];
  const processedIds = new Set<string>();

  for (const lookupId of lookupIds) {
    const inEdge  = edges.find((e) => e.target === lookupId);
    const outEdge = edges.find((e) => e.source === lookupId);
    if (inEdge && outEdge) {
      displayEdges.push({
        id: `bypass-${lookupId}`,
        source: inEdge.source,
        target: outEdge.target,
        style: { stroke: "#9ca3af" },
        animated: false,
      });
      processedIds.add(inEdge.id);
      processedIds.add(outEdge.id);
    }
  }

  for (const edge of edges) {
    if (!processedIds.has(edge.id) && !lookupIds.has(edge.source) && !lookupIds.has(edge.target)) {
      displayEdges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        style: { stroke: "#9ca3af" },
        animated: false,
      });
    }
  }

  return displayEdges;
}

interface FlowBuilderProps {
  flow: AutomationFlow;
  // Provided for new (unsaved) flows. Called instead of PATCH on first save.
  onSaveNew?: (steps: FlowStep[], edges: FlowEdge[]) => Promise<void>;
}

function FlowCanvas({ flow, onSaveNew }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(stepsToDisplayNodes(flow.steps));
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildDisplayEdges(flow.steps, flow.edges));
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isNew = flow.id === "new";

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, style: { stroke: "#9ca3af" } }, eds));
    },
    [setEdges]
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

    if (isNew && onSaveNew) {
      await onSaveNew(steps, flowEdges);
      setSaving(false);
      return;
    }

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
          {saveError && (
            <span className="text-xs text-red-600">{saveError}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : isNew ? "Create Flow" : "Save Flow"}
          </button>
        </div>

        {/* Enforcement notice */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-md">
          <CheckSquare className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
          Each Email, SMS, and Call block includes a locked <strong className="font-semibold">&ldquo;Check still unpaid in Xero&rdquo;</strong> safety check.
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

export function FlowBuilder({ flow, onSaveNew }: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas flow={flow} onSaveNew={onSaveNew} />
    </ReactFlowProvider>
  );
}

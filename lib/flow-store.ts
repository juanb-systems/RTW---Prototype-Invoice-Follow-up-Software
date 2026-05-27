import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AutomationFlow } from "./types";

interface FlowStore {
  flows: Record<string, AutomationFlow>;
  upsert: (flow: AutomationFlow) => void;
  remove: (id: string) => void;
}

// Persisted to localStorage under "collectpilot-flows".
// This is the source of truth for any flow created or edited in the builder.
// Seeded flows (FLOW001 etc.) from the API are merged in at render time;
// once a user edits one it is also saved here and takes precedence.
export const useFlowStore = create<FlowStore>()(
  persist(
    (set) => ({
      flows: {},
      upsert: (flow) =>
        set((state) => ({ flows: { ...state.flows, [flow.id]: flow } })),
      remove: (id) =>
        set((state) => {
          const next = { ...state.flows };
          delete next[id];
          return { flows: next };
        }),
    }),
    { name: "collectpilot-flows" }
  )
);

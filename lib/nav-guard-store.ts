import { create } from "zustand";

interface NavGuardStore {
  isDirty: boolean;
  dirtySource: string;
  setDirty: (dirty: boolean, source?: string) => void;
}

export const useNavGuardStore = create<NavGuardStore>((set) => ({
  isDirty: false,
  dirtySource: "",
  setDirty: (dirty, source = "") =>
    set({ isDirty: dirty, dirtySource: dirty ? source : "" }),
}));

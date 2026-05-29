import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  compactMode: boolean;
  notificationSounds: boolean;
  emailDigest: boolean;
  setCompactMode: (v: boolean) => void;
  setNotificationSounds: (v: boolean) => void;
  setEmailDigest: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      compactMode: false,
      notificationSounds: false,
      emailDigest: true,
      setCompactMode: (v) => set({ compactMode: v }),
      setNotificationSounds: (v) => set({ notificationSounds: v }),
      setEmailDigest: (v) => set({ emailDigest: v }),
    }),
    { name: "collectpilot-preferences" }
  )
);

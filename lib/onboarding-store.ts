import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OnboardingState {
  step: number;          // 1–6
  completed: boolean;
  // Step 1
  xeroConnected: boolean;
  // Step 2
  businessName: string;
  accountsEmail: string;
  senderName: string;
  tone: "friendly" | "professional" | "firm";
  followUpStyle: "light" | "standard" | "proactive";
  // Step 3
  firstReminderDays: number;
  after14Days: "email" | "sms" | "call" | "review";
  after30Days: "call" | "escalate" | "final" | "pause";
  // Step 4
  channels: string[];
  // Step 5
  pauseOnReply: boolean;
  pauseOnPromise: boolean;
  pauseOnDispute: boolean;
  // Methods
  setField: <K extends keyof Omit<OnboardingState, "setField" | "nextStep" | "prevStep" | "complete" | "reset">>(
    key: K,
    value: OnboardingState[K]
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 1,
      completed: false,
      xeroConnected: false,
      businessName: "",
      accountsEmail: "",
      senderName: "",
      tone: "professional",
      followUpStyle: "standard",
      firstReminderDays: 7,
      after14Days: "sms",
      after30Days: "call",
      channels: ["email"],
      pauseOnReply: true,
      pauseOnPromise: true,
      pauseOnDispute: true,
      setField: (key, value) => set((s) => ({ ...s, [key]: value })),
      nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 6) })),
      prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
      complete: () => set({ completed: true }),
      reset: () =>
        set({
          step: 1,
          completed: false,
          xeroConnected: false,
          businessName: "",
          accountsEmail: "",
          senderName: "",
          tone: "professional",
          followUpStyle: "standard",
          firstReminderDays: 7,
          after14Days: "sms",
          after30Days: "call",
          channels: ["email"],
          pauseOnReply: true,
          pauseOnPromise: true,
          pauseOnDispute: true,
        }),
    }),
    { name: "collectpilot-onboarding" }
  )
);

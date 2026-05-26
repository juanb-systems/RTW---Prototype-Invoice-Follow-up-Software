import fs from "fs";
import path from "path";
import type {
  Contact,
  Invoice,
  TimelineEvent,
  AutomationFlow,
  ScheduledAction,
  InboxMessage,
  AppSettings,
  DataStore,
} from "./types";

function readJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "data", filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function initStore(): DataStore {
  return {
    contacts: readJson<Contact[]>("contacts.json"),
    invoices: readJson<Invoice[]>("invoices.json"),
    timelineEvents: readJson<TimelineEvent[]>("timeline-events.json"),
    automationFlows: readJson<AutomationFlow[]>("automation-flows.json"),
    scheduledActions: readJson<ScheduledAction[]>("scheduled-actions.json"),
    inboxMessages: readJson<InboxMessage[]>("inbox-messages.json"),
    settings: readJson<AppSettings>("settings.json"),
  };
}

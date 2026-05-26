import type { DataStore, LookupResult, ScheduledAction, TimelineEvent } from "./types";
import { generateId } from "./utils";

export function runFreshLookup(actionId: string, db: DataStore): LookupResult {
  const action = db.scheduledActions.find((a) => a.id === actionId);
  if (!action) throw new Error(`ScheduledAction ${actionId} not found`);

  const invoice = db.invoices.find((i) => i.id === action.invoiceId);
  if (!invoice) throw new Error(`Invoice ${action.invoiceId} not found`);

  const contact = db.contacts.find((c) => c.id === action.contactId);
  if (!contact) throw new Error(`Contact ${action.contactId} not found`);

  const settings = db.settings;
  const now = new Date().toISOString();

  let result: LookupResult;

  // Step 2 — Invoice terminal states
  if (invoice.status === "paid" || invoice.status === "voided") {
    result = {
      invoiceStatus: invoice.status,
      contactStatus: contact.status,
      hasOpenDispute: false,
      hasPromiseToPay: false,
      manualApprovalMode: settings.manualApprovalMode,
      outcome: "skip",
      reason: "Action skipped: invoice is now paid.",
      performedAt: now,
    };
  }
  // Step 3 — Contact exclusion
  else if (contact.status === "excluded") {
    result = {
      invoiceStatus: invoice.status,
      contactStatus: contact.status,
      hasOpenDispute: false,
      hasPromiseToPay: false,
      manualApprovalMode: settings.manualApprovalMode,
      outcome: "block",
      reason: "Contact excluded from all automations.",
      performedAt: now,
    };
  }
  // Step 4 — Invoice excluded manually
  else if (invoice.excludedFromAutomation) {
    result = {
      invoiceStatus: invoice.status,
      contactStatus: contact.status,
      hasOpenDispute: false,
      hasPromiseToPay: false,
      manualApprovalMode: settings.manualApprovalMode,
      outcome: "block",
      reason: "This invoice is excluded from all automations.",
      performedAt: now,
    };
  }
  // Step 5 — Dispute check
  else if (invoice.status === "disputed") {
    result = {
      invoiceStatus: invoice.status,
      contactStatus: contact.status,
      hasOpenDispute: true,
      hasPromiseToPay: false,
      manualApprovalMode: settings.manualApprovalMode,
      outcome: "hold",
      reason: "Dispute detected, follow-up paused.",
      performedAt: now,
    };
  }
  // Step 6 — Promise-to-pay check (within last 7 days)
  else {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    const hasPromise = db.inboxMessages.some(
      (m) =>
        m.invoiceId === invoice.id &&
        m.classification === "promise_to_pay" &&
        m.automationPaused === true &&
        new Date(m.receivedAt) >= cutoff
    );

    if (hasPromise) {
      result = {
        invoiceStatus: invoice.status,
        contactStatus: contact.status,
        hasOpenDispute: false,
        hasPromiseToPay: true,
        manualApprovalMode: settings.manualApprovalMode,
        outcome: "hold",
        reason: "Automation paused: customer promised payment.",
        performedAt: now,
      };
    }
    // Step 7 — Manual approval mode
    else if (settings.manualApprovalMode) {
      result = {
        invoiceStatus: invoice.status,
        contactStatus: contact.status,
        hasOpenDispute: false,
        hasPromiseToPay: false,
        manualApprovalMode: true,
        outcome: "awaiting_approval",
        reason: "Manual approval mode is enabled.",
        performedAt: now,
      };
    }
    // Step 8 — All checks pass
    else {
      result = {
        invoiceStatus: invoice.status,
        contactStatus: contact.status,
        hasOpenDispute: false,
        hasPromiseToPay: false,
        manualApprovalMode: false,
        outcome: "proceed",
        reason: "Fresh lookup passed — action cleared to send.",
        performedAt: now,
      };
    }
  }

  // Write lookup result onto action
  action.lookupResult = result;

  // Always log lookup_performed timeline event
  const lookupEvent: TimelineEvent = {
    id: generateId("TL"),
    invoiceId: invoice.id,
    eventType: "lookup_performed",
    timestamp: now,
    message: result.reason,
    metadata: { outcome: result.outcome, actionId },
  };
  db.timelineEvents.push(lookupEvent);

  // Handle non-proceed outcomes
  if (result.outcome === "skip") {
    action.status = "skipped";
    action.skipReason = result.reason;
    db.timelineEvents.push({
      id: generateId("TL"),
      invoiceId: invoice.id,
      eventType: "action_skipped",
      timestamp: now,
      message: result.reason,
      metadata: { actionId, stepType: action.stepType },
    });
  } else if (result.outcome === "block") {
    action.status = "blocked";
    action.skipReason = result.reason;
    db.timelineEvents.push({
      id: generateId("TL"),
      invoiceId: invoice.id,
      eventType: "action_blocked",
      timestamp: now,
      message: result.reason,
      metadata: { actionId, stepType: action.stepType },
    });
  } else if (result.outcome === "hold") {
    action.status = "skipped";
    action.skipReason = result.reason;
    db.timelineEvents.push({
      id: generateId("TL"),
      invoiceId: invoice.id,
      eventType: "automation_paused",
      timestamp: now,
      message: result.reason,
      metadata: { actionId, stepType: action.stepType },
    });
  } else if (result.outcome === "awaiting_approval") {
    action.status = "awaiting_approval";
  } else {
    // proceed — fire the action
    action.status = "sent";
    const stepTypeToEvent = {
      email: "email_sent",
      sms: "sms_sent",
      call: "call_scheduled",
    } as const;

    const eventType =
      stepTypeToEvent[action.stepType as keyof typeof stepTypeToEvent];
    if (eventType) {
      const flow = db.automationFlows.find((f) => f.id === action.flowId);
      const step = flow?.steps.find((s) => s.id === action.stepId);
      db.timelineEvents.push({
        id: generateId("TL"),
        invoiceId: invoice.id,
        eventType,
        timestamp: now,
        message: buildSentMessage(action.stepType, contact.name, contact.email, step?.config),
        metadata: { actionId, stepId: action.stepId, config: step?.config },
      });
    }
  }

  return result;
}

function buildSentMessage(
  stepType: string,
  contactName: string,
  contactEmail: string,
  config?: Record<string, unknown>
): string {
  if (stepType === "email") {
    const subject = config?.subject ?? "Follow-up email";
    return `Email sent to ${contactEmail}: "${subject}"`;
  }
  if (stepType === "sms") {
    return `SMS sent to ${contactName}.`;
  }
  if (stepType === "call") {
    return `Collection call scheduled for ${contactName}.`;
  }
  return `Action sent to ${contactName}.`;
}

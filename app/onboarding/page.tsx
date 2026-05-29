"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle, ChevronRight, ChevronLeft, RefreshCw, Rocket,
  Building2, Mail, Clock, Radio, Zap, ShieldCheck, Sparkles,
  Phone, MessageSquare, FileText, Check, AlertCircle,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { useFlowStore } from "@/lib/flow-store";
import { useCallTemplateStore } from "@/lib/call-template-store";
import type { AutomationFlow, FlowStep } from "@/lib/types";

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none bg-white";

function OptionCard({
  selected,
  onClick,
  title,
  description,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all ${
        selected
          ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {Icon && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-blue-600" : "bg-gray-100"}`}>
          <Icon className={`h-4 w-4 ${selected ? "text-white" : "text-gray-500"}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${selected ? "text-blue-800" : "text-gray-800"}`}>{title}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>}
      </div>
      {selected && <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
    </button>
  );
}

function CheckCard({
  checked,
  onChange,
  title,
  description,
  locked,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  title: string;
  description?: string;
  locked?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-3.5 transition-all ${
        locked
          ? "border-amber-200 bg-amber-50/50 cursor-not-allowed"
          : checked
          ? "border-blue-200 bg-blue-50 cursor-pointer hover:border-blue-300"
          : "border-gray-200 bg-white cursor-pointer hover:bg-gray-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        className={`mt-0.5 h-4 w-4 rounded ${locked ? "accent-amber-500 cursor-not-allowed" : "accent-blue-600"}`}
      />
      <div>
        <p className={`text-sm font-medium ${locked ? "text-amber-800" : checked ? "text-blue-800" : "text-gray-800"}`}>
          {title}
          {locked && <span className="ml-2 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">Required</span>}
        </p>
        {description && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>}
      </div>
    </label>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

const STEPS = [
  "Connect Xero",
  "Business Profile",
  "Reminder Timing",
  "Channels",
  "Safety Rules",
  "Your Setup",
];

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const done = stepNum < current;
          const active = stepNum === current;
          return (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done ? "bg-blue-600 text-white" : active ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${active ? "text-blue-600" : done ? "text-gray-500" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1.5 rounded-full bg-gray-100 mt-1">
        <div
          className="absolute left-0 top-0 h-1.5 rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Step 1: Connect Xero ──────────────────────────────────────────────────────

function StepXero() {
  const { xeroConnected, setField } = useOnboardingStore();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Connect to Xero</h2>
        <p className="text-sm text-gray-500 mt-1">
          CollectPilot reads your Xero invoices to keep your collection automation up to date.
          A fresh check runs before every email, SMS, or call to prevent chasing already-paid invoices.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1ab4d7]/10 border border-[#1ab4d7]/30">
          <RefreshCw className="h-7 w-7 text-[#1ab4d7]" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">Xero Integration</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            We need read access to invoices and contacts. We never modify your Xero data.
          </p>
        </div>
        {!xeroConnected ? (
          <button
            onClick={() => setField("xeroConnected", true)}
            className="flex items-center gap-2 rounded-lg bg-[#1ab4d7] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#17a3c4] transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Connect Xero
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-green-100 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Xero connected — demo mode active
          </div>
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Prototype:</strong> This is a dummy Xero connection. No real OAuth flow is triggered.
          In production, clicking "Connect Xero" would redirect to Xero&apos;s authentication page.
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Business Profile ──────────────────────────────────────────────────

function StepProfile() {
  const { businessName, accountsEmail, senderName, tone, followUpStyle, setField } = useOnboardingStore();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Business Profile</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tell CollectPilot about your business so we can personalise your collection messages.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Business name</label>
          <input type="text" value={businessName} onChange={e => setField("businessName", e.target.value)} placeholder="Refresh The Web" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Accounts email</label>
          <input type="email" value={accountsEmail} onChange={e => setField("accountsEmail", e.target.value)} placeholder="accounts@yourbiz.com.au" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Preferred sender name</label>
          <input type="text" value={senderName} onChange={e => setField("senderName", e.target.value)} placeholder="Accounts Team" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Communication tone</label>
        <div className="grid grid-cols-3 gap-2">
          <OptionCard selected={tone === "friendly"} onClick={() => setField("tone", "friendly")} icon={Mail} title="Friendly" description="Warm and conversational. Good for long-term customers." />
          <OptionCard selected={tone === "professional"} onClick={() => setField("tone", "professional")} icon={Building2} title="Professional" description="Clear and business-like. Neutral and respectful." />
          <OptionCard selected={tone === "firm"} onClick={() => setField("tone", "firm")} icon={ShieldCheck} title="Firm but polite" description="Assertive reminders with a professional edge." />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Follow-up style</label>
        <div className="grid grid-cols-3 gap-2">
          <OptionCard selected={followUpStyle === "light"} onClick={() => setField("followUpStyle", "light")} title="Light touch" description="Fewer reminders, longer gaps. Less pressure." />
          <OptionCard selected={followUpStyle === "standard"} onClick={() => setField("followUpStyle", "standard")} title="Standard" description="Balanced reminders at regular intervals. Most common." />
          <OptionCard selected={followUpStyle === "proactive"} onClick={() => setField("followUpStyle", "proactive")} title="More proactive" description="More frequent contact. Best for high-risk accounts." />
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Reminder Timing ───────────────────────────────────────────────────

function StepTiming() {
  const { firstReminderDays, after14Days, after30Days, setField } = useOnboardingStore();

  const dayOptions: { days: number; label: string }[] = [
    { days: 1, label: "1 day after due date" },
    { days: 3, label: "3 days after due date" },
    { days: 7, label: "7 days after due date" },
    { days: 14, label: "14 days after due date" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reminder Timing</h2>
        <p className="text-sm text-gray-500 mt-1">
          When should your first reminder go out, and what happens if the invoice is still unpaid after that?
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">First reminder</label>
        <div className="grid grid-cols-2 gap-2">
          {dayOptions.map(({ days, label }) => (
            <OptionCard key={days} selected={firstReminderDays === days} onClick={() => setField("firstReminderDays", days)} icon={Clock} title={label} />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">After 14 days — still unpaid</label>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard selected={after14Days === "email"} onClick={() => setField("after14Days", "email")} icon={Mail} title="Send another email" description="A firmer follow-up email." />
          <OptionCard selected={after14Days === "sms"} onClick={() => setField("after14Days", "sms")} icon={MessageSquare} title="Send SMS reminder" description="A short text message to the contact." />
          <OptionCard selected={after14Days === "call"} onClick={() => setField("after14Days", "call")} icon={Phone} title="Start AI call" description="An AI caller reaches out on your behalf." />
          <OptionCard selected={after14Days === "review"} onClick={() => setField("after14Days", "review")} icon={AlertCircle} title="Human review" description="Flag for manual follow-up by your team." />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">After 30 days — still unpaid</label>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard selected={after30Days === "call"} onClick={() => setField("after30Days", "call")} icon={Phone} title="AI call" description="Escalate to an AI phone call." />
          <OptionCard selected={after30Days === "escalate"} onClick={() => setField("after30Days", "escalate")} icon={AlertCircle} title="Escalate to human review" description="Assign to a team member for direct follow-up." />
          <OptionCard selected={after30Days === "final"} onClick={() => setField("after30Days", "final")} icon={Mail} title="Final written reminder" description="A firm final email before further action." />
          <OptionCard selected={after30Days === "pause"} onClick={() => setField("after30Days", "pause")} icon={ShieldCheck} title="Pause automation" description="Stop automated contact and wait for resolution." />
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Channel selection ─────────────────────────────────────────────────

function StepChannels() {
  const { channels, setField } = useOnboardingStore();

  function toggle(ch: string) {
    const next = channels.includes(ch) ? channels.filter(c => c !== ch) : [...channels, ch];
    setField("channels", next);
  }

  const CHANNEL_OPTIONS: { key: string; title: string; description: string; Icon: React.ElementType }[] = [
    { key: "email",  title: "Email",          description: "Automated email reminders to the invoice contact. Most common method.", Icon: Mail },
    { key: "sms",    title: "SMS",            description: "Short text message reminders. High open rate for time-sensitive follow-ups.", Icon: MessageSquare },
    { key: "call",   title: "AI Call",        description: "An AI caller follows up by phone on your behalf using your script. Prototype only.", Icon: Phone },
    { key: "review", title: "Manual review",  description: "Flag invoices for your team to follow up personally. No automation required.", Icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Communication Channels</h2>
        <p className="text-sm text-gray-500 mt-1">
          Which channels do you want to use for customer follow-up? Select all that apply.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CHANNEL_OPTIONS.map(({ key, title, description, Icon }) => {
          const selected = channels.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all ${
                selected ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-blue-600" : "bg-gray-100"}`}>
                <Icon className={`h-4 w-4 ${selected ? "text-white" : "text-gray-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${selected ? "text-blue-800" : "text-gray-800"}`}>{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
              </div>
              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-0.5 ${selected ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"}`}>
                {selected && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {channels.length === 0 && (
        <p className="text-xs text-amber-700 text-center">Select at least one channel to continue.</p>
      )}
    </div>
  );
}

// ── Step 5: Safety rules ──────────────────────────────────────────────────────

function StepSafety() {
  const { pauseOnReply, pauseOnPromise, pauseOnDispute, setField } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Safety &amp; Pause Rules</h2>
        <p className="text-sm text-gray-500 mt-1">
          These rules prevent automated messages going out at the wrong time — protecting your customer relationships.
        </p>
      </div>

      <div className="space-y-2">
        <CheckCard
          checked={pauseOnReply}
          onChange={(v) => setField("pauseOnReply", v)}
          title="Pause automation if customer replies"
          description="Any email or call reply from the customer will pause automation until you review it."
        />
        <CheckCard
          checked={pauseOnPromise}
          onChange={(v) => setField("pauseOnPromise", v)}
          title="Pause automation if customer promises payment"
          description="AI-classified promise-to-pay replies will pause follow-up for 7 days."
        />
        <CheckCard
          checked={pauseOnDispute}
          onChange={(v) => setField("pauseOnDispute", v)}
          title="Pause automation if invoice is disputed"
          description="All automated contact stops immediately when a dispute is raised."
        />
        <CheckCard
          checked={true}
          locked
          title="Always check Xero before sending"
          description="A live Xero lookup runs before every email, SMS, and call. If the invoice is paid or voided, the action is skipped. This cannot be disabled."
        />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 leading-relaxed">
        <strong>Recommended:</strong> Enable all three optional rules. They prevent over-contacting customers who are already engaging with you, and protect your business reputation.
      </div>
    </div>
  );
}

// ── Step 6: Generated setup ───────────────────────────────────────────────────

function StepComplete() {
  const store = useOnboardingStore();
  const upsertFlow = useFlowStore((s) => s.upsert);
  const upsertTemplate = useCallTemplateStore((s) => s.upsert);
  const { complete, reset } = store;
  const router = useRouter();
  const [applied, setApplied] = useState(false);

  const after14Label: Record<string, string> = {
    email: "Email reminder",
    sms: "SMS reminder",
    call: "AI call",
    review: "Human review",
  };
  const after30Label: Record<string, string> = {
    call: "AI call",
    escalate: "Escalate to human review",
    final: "Final written reminder",
    pause: "Pause automation",
  };

  const flowName = `${store.businessName || "My Business"} — ${
    store.followUpStyle === "light" ? "Light Touch" :
    store.followUpStyle === "proactive" ? "Proactive" : "Standard"
  } Collection`;

  function buildSteps(): FlowStep[] {
    const steps: FlowStep[] = [
      {
        id: "gen-trigger",
        type: "trigger",
        order: 0,
        config: { triggerType: "days_overdue", days: store.firstReminderDays },
      },
      {
        id: "gen-email1",
        type: "email",
        order: 1,
        config: {
          label: "First Reminder",
          to: "contact",
          subject: `Friendly reminder — Invoice {{invoice_number}} is overdue`,
          body: `Hi {{contact_name}},\n\nJust a friendly reminder that Invoice {{invoice_number}} for {{invoice_amount}} was due on {{due_date}} and remains outstanding.\n\nPlease arrange payment at your earliest convenience or reply to discuss.\n\nKind regards,\n${store.senderName || "Accounts Team"}\n${store.businessName || ""}`,
          senderName: store.senderName || "Accounts Team",
          replyTo: store.accountsEmail || "",
        },
      },
      {
        id: "gen-wait1",
        type: "wait",
        order: 2,
        config: { label: "Wait before escalation", days: 14 - store.firstReminderDays, unit: "days" },
      },
    ];

    if (store.after14Days === "sms") {
      steps.push({ id: "gen-sms", type: "sms", order: 3, config: { label: "14-day SMS Reminder", to: "contact", template: `Hi {{contact_name}}, a reminder that Invoice {{invoice_number}} for {{invoice_amount}} is overdue. Please contact ${store.businessName || "us"} to arrange payment.` } });
    } else if (store.after14Days === "email") {
      steps.push({ id: "gen-email2", type: "email", order: 3, config: { label: "14-day Follow-up", to: "contact", subject: `Second notice — Invoice {{invoice_number}} still outstanding`, body: `Hi {{contact_name}},\n\nWe haven't heard back regarding Invoice {{invoice_number}} for {{invoice_amount}} which is now ${store.firstReminderDays + 14} days overdue.\n\nPlease make payment or contact us urgently.\n\n${store.senderName || "Accounts Team"}`, senderName: store.senderName || "Accounts Team" } });
    } else if (store.after14Days === "call") {
      steps.push({ id: "gen-call1", type: "call", order: 3, config: { label: "14-day AI Call", timing: "immediately", templateId: "TPL001", templateName: "Overdue Invoice AI Call" } });
    }

    steps.push({
      id: "gen-wait2",
      type: "wait",
      order: steps.length,
      config: { label: "Wait before final step", days: 16, unit: "days" },
    });

    if (store.after30Days === "call") {
      steps.push({ id: "gen-call2", type: "call", order: steps.length, config: { label: "30-day AI Call", timing: "immediately", templateId: "TPL006", templateName: "Final Reminder Before Human Review" } });
    } else if (store.after30Days === "final") {
      steps.push({ id: "gen-email3", type: "email", order: steps.length, config: { label: "Final Notice", to: "contact", subject: `Final notice — Invoice {{invoice_number}}`, body: `Hi {{contact_name}},\n\nThis is a final notice regarding Invoice {{invoice_number}} for {{invoice_amount}}.\n\nIf payment is not received within 7 days, this matter will be escalated.\n\n${store.senderName || "Accounts Team"}`, senderName: store.senderName || "Accounts Team" } });
    }

    steps.push({ id: "gen-end", type: "end", order: steps.length, config: {} });
    return steps;
  }

  function handleApply() {
    const flowId = `FLOW-ONBOARDING-${Date.now()}`;
    const steps = buildSteps();
    const edges = steps.slice(0, -1).map((s, i) => ({
      id: `e-${s.id}-${steps[i + 1].id}`,
      source: s.id,
      target: steps[i + 1].id,
    }));

    const flow: AutomationFlow = {
      id: flowId,
      name: flowName,
      description: `Generated by Setup Wizard · ${store.followUpStyle} follow-up style`,
      status: "draft",
      trigger: { type: "days_overdue", value: store.firstReminderDays },
      steps,
      edges,
    };
    upsertFlow(flow);

    if (store.channels.includes("call")) {
      upsertTemplate({
        id: `TPL-ONBOARDING-${Date.now()}`,
        name: `${store.businessName || "My Business"} — AI Call Script`,
        status: "draft",
        category: "Overdue invoice follow-up",
        disclosure: `Hi, I'm an AI accounts receivable assistant calling on behalf of ${store.businessName || "our client"}. This is an automated and recorded business call regarding an outstanding invoice.`,
        prompt: `You are calling on behalf of ${store.businessName || "the business"} to follow up on an unpaid invoice.\n\nTone: ${store.tone}.\n\nAsk to speak with the accounts payable contact. Confirm you are speaking with the right person. Refer to Invoice {{invoice_number}} for {{invoice_amount}} which is {{days_overdue}} days overdue.\n\nAsk when payment can be expected. If they promise a date, note it. If they dispute the invoice, escalate immediately. If no answer, leave a voicemail.`,
        outcomeClassifications: ["Promise to pay", "Already paid", "Dispute raised", "Voicemail", "Needs human follow-up", "No commitment given"],
        voicemailBehavior: `Keep the message under 20 seconds. State the company name, invoice follow-up purpose, and contact method only. Do not mention the amount in the voicemail.`,
        escalationRules: `Escalate immediately if a dispute is raised. Escalate if the customer becomes upset or requests to speak to a human.`,
        createdAt: new Date().toISOString(),
      });
    }

    complete();
    setApplied(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Your Recommended Setup</h2>
        <p className="text-sm text-gray-500 mt-1">
          Based on your answers, we&apos;ve generated a personalised collection flow and starter templates.
          Review and apply when ready.
        </p>
      </div>

      {/* Generated flow summary */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">Generated Automation Flow</h3>
        </div>
        <p className="text-sm font-medium text-gray-900">{flowName}</p>
        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-medium text-gray-500">Day {store.firstReminderDays}</span>
            <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-blue-500" /> Email reminder sent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-medium text-gray-500">Day 14</span>
            <span className="flex items-center gap-1">
              {store.after14Days === "email" && <><Mail className="h-3 w-3 text-blue-500" /> Follow-up email</>}
              {store.after14Days === "sms" && <><MessageSquare className="h-3 w-3 text-purple-500" /> SMS reminder</>}
              {store.after14Days === "call" && <><Phone className="h-3 w-3 text-green-500" /> AI call</>}
              {store.after14Days === "review" && <><AlertCircle className="h-3 w-3 text-amber-500" /> Human review</>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-medium text-gray-500">Day 30</span>
            <span className="flex items-center gap-1">
              {store.after30Days === "call" && <><Phone className="h-3 w-3 text-green-500" /> AI call</>}
              {store.after30Days === "escalate" && <><AlertCircle className="h-3 w-3 text-red-500" /> Escalate to human</>}
              {store.after30Days === "final" && <><Mail className="h-3 w-3 text-blue-500" /> Final written reminder</>}
              {store.after30Days === "pause" && <><ShieldCheck className="h-3 w-3 text-gray-500" /> Pause automation</>}
            </span>
          </div>
        </div>
      </div>

      {/* Generated templates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Mail className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-semibold text-gray-700">Email Template</p>
          </div>
          <p className="text-xs text-gray-500">Personalised reminders using your business name, tone ({store.tone}), and sender name ({store.senderName || "Accounts Team"}).</p>
        </div>
        {store.channels.includes("sms") && (
          <div className="rounded-lg border border-gray-200 bg-white p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <p className="text-xs font-semibold text-gray-700">SMS Template</p>
            </div>
            <p className="text-xs text-gray-500">Short SMS reminder with invoice details and a call-to-action.</p>
          </div>
        )}
        {store.channels.includes("call") && (
          <div className="rounded-lg border border-gray-200 bg-white p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Phone className="h-4 w-4 text-green-500" />
              <p className="text-xs font-semibold text-gray-700">AI Call Template</p>
            </div>
            <p className="text-xs text-gray-500">Custom AI call script for your business tone and follow-up style.</p>
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-white p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-semibold text-gray-700">Safety Rules</p>
          </div>
          <p className="text-xs text-gray-500">
            {[
              store.pauseOnReply && "Pause on reply",
              store.pauseOnPromise && "Pause on promise",
              store.pauseOnDispute && "Pause on dispute",
              "Always check Xero",
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {!applied ? (
        <div className="flex items-center gap-3">
          <button
            onClick={handleApply}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Rocket className="h-4 w-4" />
            Apply Setup
          </button>
          <button onClick={() => router.push("/automations")} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Skip — I&apos;ll configure manually
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Setup applied!</p>
              <p className="text-xs text-green-600 mt-0.5">Your flow and templates have been created. You can edit them anytime.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/automations")} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700">
              <Zap className="h-3.5 w-3.5" /> View in Automations
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Go to Dashboard
            </button>
            {store.channels.includes("call") && (
              <button onClick={() => router.push("/call-templates")} className="flex items-center gap-1.5 rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                Edit Call Template
              </button>
            )}
            <button onClick={() => { reset(); }} className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline">
              Restart setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { step, xeroConnected, channels, nextStep, prevStep } = useOnboardingStore();

  function canProceed() {
    if (step === 1) return xeroConnected;
    if (step === 4) return channels.length > 0;
    return true;
  }

  return (
    <div>
      <TopBar
        title="Setup & Onboarding"
        subtitle="Get CollectPilot ready for your business in a few steps"
      />
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          <ProgressBar current={step} />

          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm min-h-[480px] flex flex-col">
            <div className="flex-1">
              {step === 1 && <StepXero />}
              {step === 2 && <StepProfile />}
              {step === 3 && <StepTiming />}
              {step === 4 && <StepChannels />}
              {step === 5 && <StepSafety />}
              {step === 6 && <StepComplete />}
            </div>

            {step < 6 && (
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
                <button
                  onClick={prevStep}
                  disabled={step === 1}
                  className="flex items-center gap-1.5 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <span className="text-xs text-gray-400">Step {step} of 6</span>
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {step === 5 ? "Generate Setup" : "Continue"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

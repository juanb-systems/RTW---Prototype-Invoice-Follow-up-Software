"use client";

import { useState } from "react";
import { X, Save, Mail, Eye, CheckCircle2 } from "lucide-react";
import type { Node } from "@xyflow/react";

interface NodeConfigPanelProps {
  node: Node;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

const EMAIL_TEMPLATES: Record<string, { name: string; subject: string; body: string }> = {
  gentle_reminder: {
    name: "Gentle Reminder",
    subject: "Friendly reminder — Invoice {{invoiceNumber}} is overdue",
    body: "Hi {{contactName}},\n\nI hope this message finds you well.\n\nJust a friendly reminder that Invoice {{invoiceNumber}} for {{amount}} was due on {{dueDate}} and remains outstanding.\n\nIf you've already arranged payment, please disregard this message. Otherwise, we'd appreciate you settling this at your earliest convenience, or reach out if you have any questions.\n\nKind regards,\n{{senderName}}\n{{companyName}}",
  },
  overdue_notice: {
    name: "Overdue Notice",
    subject: "Your account is overdue — Invoice {{invoiceNumber}}",
    body: "Dear {{contactName}},\n\nThis is a follow-up regarding Invoice {{invoiceNumber}} for {{amount}}, which was due on {{dueDate}} and has not yet been received.\n\nWe would appreciate payment at your earliest convenience. If there is an issue we can help resolve, please don't hesitate to get in touch.\n\nRegards,\n{{senderName}}\n{{companyName}}",
  },
  urgent_notice: {
    name: "Urgent Notice",
    subject: "URGENT: Invoice {{invoiceNumber}} requires immediate payment",
    body: "Dear {{contactName}},\n\nInvoice {{invoiceNumber}} for {{amount}} is now significantly overdue (due {{dueDate}}).\n\nDespite our previous reminders, payment has not been received. We require this matter to be resolved immediately.\n\nPlease arrange payment within 3 business days, or contact us urgently to discuss. Failure to respond may result in referral to our debt recovery team.\n\nRegards,\n{{senderName}}\n{{companyName}}",
  },
  final_warning: {
    name: "Final Warning",
    subject: "Final notice — Invoice {{invoiceNumber}} — Immediate action required",
    body: "Dear {{contactName}},\n\nThis is our final notice regarding Invoice {{invoiceNumber}} for {{amount}} (due {{dueDate}}).\n\nUnless payment is received or a payment arrangement is made within 5 business days, we will have no option but to refer this matter to our external debt collection agency, which may affect your credit rating.\n\nTo avoid this outcome, please contact us immediately.\n\n{{senderName}}\n{{companyName}}",
  },
  payment_confirmation: {
    name: "Payment Confirmation Request",
    subject: "Payment confirmation — Invoice {{invoiceNumber}}",
    body: "Dear {{contactName}},\n\nWe noticed a recent transaction that may relate to Invoice {{invoiceNumber}} for {{amount}}.\n\nCould you please confirm whether payment has been made? If so, please disregard any prior reminders.\n\nIf you need an updated invoice or have any questions, we're happy to help.\n\nThank you,\n{{senderName}}\n{{companyName}}",
  },
};

const PREVIEW_DATA = {
  contactName: "James Fletcher",
  invoiceNumber: "INV-2026-001",
  amount: "$12,500.00",
  dueDate: "18 May 2026",
  companyName: "Your Business Pty Ltd",
};

function fillMergeFields(text: string, senderName: string): string {
  return text
    .replace(/\{\{contactName\}\}/g, PREVIEW_DATA.contactName)
    .replace(/\{\{invoiceNumber\}\}/g, PREVIEW_DATA.invoiceNumber)
    .replace(/\{\{amount\}\}/g, PREVIEW_DATA.amount)
    .replace(/\{\{dueDate\}\}/g, PREVIEW_DATA.dueDate)
    .replace(/\{\{companyName\}\}/g, PREVIEW_DATA.companyName)
    .replace(/\{\{senderName\}\}/g, senderName || "Accounts Team");
}

const typeLabels: Record<string, string> = {
  trigger: "Trigger",
  lookup_check: "Fresh Xero Check",
  email: "Send Email",
  sms: "Send SMS",
  call: "Schedule Call",
  wait: "Wait",
  condition: "Condition",
  end: "End",
};

export function NodeConfigPanel({ node, onSave, onClose }: NodeConfigPanelProps) {
  const [values, setValues] = useState<Record<string, unknown>>(
    (node.data as Record<string, unknown>) ?? {}
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  function handleChange(key: string, value: string | number) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleTemplateChange(templateId: string) {
    const template = EMAIL_TEMPLATES[templateId];
    if (template) {
      setValues((prev) => ({
        ...prev,
        template: templateId,
        subject: template.subject,
        body: template.body,
      }));
    } else {
      setValues((prev) => ({ ...prev, template: templateId }));
    }
  }

  const isLookup = node.type === "lookup_check";
  const isEmail = node.type === "email";

  return (
    <div className="w-72 border-l border-gray-200 bg-white flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">
          {typeLabels[node.type ?? ""] ?? node.type ?? "Node"} Config
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* LOOKUP CHECK — static info, not editable */}
        {isLookup && (
          <>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1.5">Fresh Xero Check</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Checks your Xero account to confirm the invoice is still unpaid, not disputed, and still eligible before contacting the customer.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Checks performed:</p>
              <ul className="space-y-1.5">
                {[
                  "Invoice is still unpaid (not paid or voided in Xero)",
                  "Contact is not excluded from automations",
                  "No active dispute on the invoice",
                  "No recent promise to pay (last 7 days)",
                  "Manual approval mode status",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-3">
              This node is required before every email, SMS, or call action. Its behaviour cannot be customised.
            </p>
          </>
        )}

        {/* EMAIL — template dropdown, body, preview */}
        {isEmail && (
          <>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
              <label className="flex items-center gap-2 cursor-not-allowed select-none">
                <input type="checkbox" checked disabled readOnly className="h-3.5 w-3.5 accent-amber-500 cursor-not-allowed" />
                <span className="text-xs font-medium text-gray-700">Check still unpaid in Xero</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 pl-5 leading-relaxed">
                Required safety check. Automatically verified before this action runs — cannot be disabled.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input
                type="text"
                value={(values.label as string) ?? ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Template</label>
              <select
                value={(values.template as string) ?? ""}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none bg-white"
              >
                <option value="">— Select template —</option>
                {Object.entries(EMAIL_TEMPLATES).map(([id, tmpl]) => (
                  <option key={id} value={id}>{tmpl.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input
                type="text"
                value={(values.subject as string) ?? ""}
                onChange={(e) => handleChange("subject", e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                placeholder="Email subject line"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sender Name</label>
              <input
                type="text"
                value={(values.senderName as string) ?? ""}
                onChange={(e) => handleChange("senderName", e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
                placeholder="Accounts Team"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Body</label>
              <textarea
                value={(values.body as string) ?? ""}
                onChange={(e) => handleChange("body", e.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none resize-none"
                placeholder="Email body text..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Fields: {"{{"} contactName {"}}"} {"{{"} invoiceNumber {"}}"} {"{{"} amount {"}}"} {"{{"} dueDate {"}}"} {"{{"} companyName {"}}"}
              </p>
            </div>
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview Email
            </button>
          </>
        )}

        {/* SMS */}
        {node.type === "sms" && (
          <>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
              <label className="flex items-center gap-2 cursor-not-allowed select-none">
                <input type="checkbox" checked disabled readOnly className="h-3.5 w-3.5 accent-amber-500 cursor-not-allowed" />
                <span className="text-xs font-medium text-gray-700">Check still unpaid in Xero</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 pl-5 leading-relaxed">
                Required safety check. Automatically verified before this action runs — cannot be disabled.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input type="text" value={(values.label as string) ?? ""} onChange={(e) => handleChange("label", e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SMS Message</label>
              <textarea value={(values.template as string) ?? ""} onChange={(e) => handleChange("template", e.target.value)} rows={4} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none resize-none" />
              <p className="text-xs text-gray-400 mt-1">Fields: {"{{"} contactName {"}}"} {"{{"} invoiceNumber {"}}"} {"{{"} amount {"}}"} {"{{"} companyName {"}}"}</p>
            </div>
          </>
        )}

        {/* CALL */}
        {node.type === "call" && (
          <>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
              <label className="flex items-center gap-2 cursor-not-allowed select-none">
                <input type="checkbox" checked disabled readOnly className="h-3.5 w-3.5 accent-amber-500 cursor-not-allowed" />
                <span className="text-xs font-medium text-gray-700">Check still unpaid in Xero</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 pl-5 leading-relaxed">
                Required safety check. Automatically verified before this action runs — cannot be disabled.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input type="text" value={(values.label as string) ?? ""} onChange={(e) => handleChange("label", e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Call Notes</label>
              <textarea value={(values.notes as string) ?? ""} onChange={(e) => handleChange("notes", e.target.value)} rows={3} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none resize-none" />
            </div>
          </>
        )}

        {/* WAIT */}
        {node.type === "wait" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input type="text" value={(values.label as string) ?? ""} onChange={(e) => handleChange("label", e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Days to wait</label>
              <input type="number" value={(values.days as number) ?? ""} onChange={(e) => handleChange("days", parseInt(e.target.value) || 0)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
            </div>
          </>
        )}

        {/* TRIGGER */}
        {node.type === "trigger" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input type="text" value={(values.label as string) ?? ""} onChange={(e) => handleChange("label", e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trigger Type</label>
              <select
                value={(values.triggerType as string) ?? "days_overdue"}
                onChange={(e) => handleChange("triggerType", e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none bg-white"
              >
                <option value="days_overdue">Invoice X days overdue</option>
                <option value="invoice_created">Invoice created</option>
                <option value="reply_received">Reply received</option>
                <option value="manual">Manual / on demand</option>
              </select>
            </div>
            {(!(values.triggerType) || values.triggerType === "days_overdue") && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Days overdue to trigger</label>
                <input type="number" value={(values.days as number) ?? ""} onChange={(e) => handleChange("days", parseInt(e.target.value) || 0)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
              </div>
            )}
          </>
        )}

        {/* CONDITION */}
        {node.type === "condition" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input type="text" value={(values.label as string) ?? ""} onChange={(e) => handleChange("label", e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
              <input type="text" value={(values.condition as string) ?? ""} onChange={(e) => handleChange("condition", e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" placeholder="e.g. customer_replied" />
            </div>
          </>
        )}

        {/* END */}
        {node.type === "end" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
            <input type="text" value={(values.label as string) ?? ""} onChange={(e) => handleChange("label", e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none" />
          </div>
        )}
      </div>

      {!isLookup && (
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={() => onSave(values)}
            className="w-full flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Save className="h-3.5 w-3.5" />
            Apply Changes
          </button>
        </div>
      )}

      {/* Email Preview Modal (overlay within panel) */}
      {isPreviewOpen && (
        <div className="absolute inset-0 bg-white flex flex-col z-20 border-l border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900">Email Preview</h3>
            </div>
            <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-gray-400 mb-3 italic text-center">
              Preview using sample data — merge fields replaced with dummy values
            </p>
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 space-y-1.5">
                <div className="flex gap-2 text-xs">
                  <span className="text-gray-400 w-14 shrink-0">From:</span>
                  <span className="text-gray-700">{(values.senderName as string) || "Accounts Team"} &lt;noreply@yourbusiness.com.au&gt;</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-gray-400 w-14 shrink-0">To:</span>
                  <span className="text-gray-700">james.fletcher@fletcherit.com.au</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-gray-400 w-14 shrink-0">Subject:</span>
                  <span className="font-medium text-gray-900">
                    {fillMergeFields((values.subject as string) || "(no subject)", (values.senderName as string) || "")}
                  </span>
                </div>
              </div>
              <div className="px-4 py-4">
                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed">
                  {fillMergeFields(
                    (values.body as string) || "(No body configured — select a template or type your message above)",
                    (values.senderName as string) || ""
                  )}
                </pre>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Links are not active in this prototype.
            </p>
          </div>
          <div className="border-t border-gray-100 p-4">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="w-full rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

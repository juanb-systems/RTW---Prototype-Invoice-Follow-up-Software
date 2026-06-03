import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { BatchedTimeline } from "@/components/invoices/BatchedTimeline";
import { InvoiceDetailActions } from "@/components/invoices/InvoiceDetailActions";
import { formatCurrency, formatDate, agingColor } from "@/lib/utils";
import {
  getInvoiceWithContact,
  getTimelineForInvoice,
  getScheduledActionsWithDetails,
  getAutomationFlows,
  getLatestInboxMessageForInvoice,
  getContactWithInvoices,
} from "@/lib/server-data";
import { CollapsibleSection } from "@/components/invoices/CollapsibleSection";
import { AlertTriangle, Calendar, Building2, Mail, Phone, GitBranch, ShieldX, MessageSquare, PauseCircle, ExternalLink, Zap, CheckCircle2, Clock, Info } from "lucide-react";
import type { AutomationFlow, MessageClassification, InboxMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

const CLASSIFICATION_LABELS: Record<MessageClassification, string> = {
  promise_to_pay: "Promise to Pay",
  dispute: "Dispute",
  out_of_office: "Out of Office",
  payment_query: "Payment Query",
  unclassified: "Unclassified",
};

const CLASSIFICATION_COLORS: Record<MessageClassification, string> = {
  promise_to_pay: "bg-green-100 text-green-800 border-green-200",
  dispute: "bg-red-100 text-red-800 border-red-200",
  out_of_office: "bg-amber-100 text-amber-800 border-amber-200",
  payment_query: "bg-blue-100 text-blue-800 border-blue-200",
  unclassified: "bg-gray-100 text-gray-600 border-gray-200",
};

const RECOMMENDATIONS: Record<MessageClassification, string> = {
  promise_to_pay: "Pause automation until the customer's promised payment date. Mark promise-to-pay and monitor.",
  dispute: "Mark invoice as disputed and pause all automation. Assign to your accounts team for review.",
  out_of_office: "Delay follow-up until the customer returns. Check their return date in the message.",
  payment_query: "Reply with the full invoice breakdown and resend the original invoice.",
  unclassified: "Review this reply manually and classify it before taking any further action.",
};

function CustomerReplyPanel({ message }: { message: Pick<InboxMessage, "id" | "classification" | "from" | "subject" | "body" | "automationPaused" | "receivedAt"> }) {
  const borderColor =
    message.classification === "dispute" ? "border-red-200 bg-red-50/50" :
    message.classification === "promise_to_pay" ? "border-green-200 bg-green-50/50" :
    "border-blue-200 bg-blue-50/50";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${borderColor}`}>
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />
        Customer Reply
      </h3>

      {message.automationPaused && (
        <div className="mb-3 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5">
          <PauseCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-700">Automation paused due to customer reply</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 truncate">{message.from}</p>
          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium shrink-0 ${CLASSIFICATION_COLORS[message.classification]}`}>
            AI: {CLASSIFICATION_LABELS[message.classification]}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-700 line-clamp-1">{message.subject}</p>
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{message.body}</p>
      </div>

      <div className="mt-3 rounded-md border border-gray-200 bg-white p-2.5">
        <p className="text-xs font-medium text-gray-600 mb-1">Recommended Action</p>
        <p className="text-xs text-gray-500 leading-relaxed">{RECOMMENDATIONS[message.classification]}</p>
      </div>

      <Link
        href={`/inbox?message=${message.id}`}
        className="block text-center text-xs font-medium text-blue-600 hover:underline mt-3"
      >
        View full message in Inbox →
      </Link>
    </div>
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoiceWithContact(id);
  if (!invoice) notFound();

  const timeline = getTimelineForInvoice(id);
  const allActions = getScheduledActionsWithDetails();
  const flows = getAutomationFlows();
  const latestMessage = getLatestInboxMessageForInvoice(id);

  // Contact total overdue across all their invoices
  const contactWithInvoices = invoice.contact ? getContactWithInvoices(invoice.contact.id) : null;
  const contactOverdueInvoices = contactWithInvoices?.invoices.filter(
    (i) => i.status === "overdue" || i.status === "partial" || i.status === "disputed"
  ) ?? [];
  const contactTotalOverdue = contactOverdueInvoices.reduce((s, i) => s + i.amount, 0);

  const pendingActions = allActions.filter(
    (a) => a.invoiceId === id && (a.status === "pending" || a.status === "awaiting_approval")
  );

  const needsReview =
    invoice.status === "disputed" || invoice.contact?.status === "excluded";
  const disputeDetected = invoice.status === "disputed";
  const contactExcluded = invoice.contact?.status === "excluded";

  // Derive automation status for the summary panel
  const autoStatus = (() => {
    if (latestMessage?.automationPaused) return { label: "Paused", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: PauseCircle };
    if (invoice.status === "disputed") return { label: "Blocked (Dispute)", cls: "bg-red-100 text-red-700 border-red-200", icon: ShieldX };
    if (invoice.contact?.status === "excluded") return { label: "Blocked (Contact)", cls: "bg-red-100 text-red-700 border-red-200", icon: ShieldX };
    if (pendingActions.some(a => a.status === "awaiting_approval")) return { label: "Needs Approval", cls: "bg-purple-100 text-purple-700 border-purple-200", icon: Clock };
    if (pendingActions.some(a => a.status === "pending")) return { label: "Active", cls: "bg-green-100 text-green-700 border-green-200", icon: Zap };
    if (!invoice.assignedFlowId) return { label: "No Automation", cls: "bg-gray-100 text-gray-500 border-gray-200", icon: GitBranch };
    return { label: "No Actions", cls: "bg-gray-100 text-gray-400 border-gray-200", icon: CheckCircle2 };
  })();

  const nextAction = pendingActions.find(a => a.status === "pending" || a.status === "awaiting_approval");
  const assignedFlow = flows.find((f: AutomationFlow) => f.id === invoice.assignedFlowId);

  const recommendedNext = (() => {
    if (invoice.status === "disputed") return "Review the customer dispute before sending more reminders. Automation is paused.";
    if (invoice.contact?.status === "excluded") return "This contact is excluded from all automations. Assign a new contact or follow up manually.";
    if (latestMessage?.classification === "promise_to_pay") return "Payment promised. Automation paused — monitor the payment date and follow up if needed.";
    if (latestMessage?.classification === "dispute") return "Dispute raised by customer. Pause automation and assign to your accounts team for review.";
    if (latestMessage?.classification === "out_of_office") return "Customer is out of office. Delay follow-up until they return.";
    if (latestMessage?.classification === "payment_query") return "Customer has a payment query. Reply with the full invoice breakdown and resend the original.";
    if (pendingActions.some(a => a.status === "awaiting_approval")) return "Manual approval mode is enabled. Review and approve the next scheduled action.";
    if (nextAction?.status === "pending") return `Next automated action scheduled: ${nextAction.stepType} on ${formatDate(nextAction.scheduledAt)}.`;
    if (!invoice.assignedFlowId) return "No automation flow assigned. Assign a flow to start automated follow-up.";
    return null;
  })();

  return (
    <div>
      <TopBar
        title={invoice.invoiceNumber}
        subtitle={`${invoice.contact?.company ?? ""} · ${formatCurrency(invoice.amount)}`}
        description="Review invoice status, customer activity, automation progress, and next recommended action."
      />
      <div className="p-4 sm:p-6 space-y-6">

        {/* Status Overview */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Status Overview
          </h3>
          <div className="flex flex-wrap gap-3 mb-3">
            {/* Invoice status */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Status</span>
              <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium capitalize ${
                invoice.status === "overdue" || invoice.status === "disputed" ? "border-red-200 bg-red-50 text-red-700" :
                invoice.status === "paid" ? "border-green-200 bg-green-50 text-green-700" :
                invoice.status === "partial" ? "border-amber-200 bg-amber-50 text-amber-700" :
                "border-gray-200 bg-gray-50 text-gray-600"
              }`}>{invoice.status}</span>
            </div>
            {/* Days overdue */}
            {invoice.daysPastDue > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Days Overdue</span>
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${agingColor(invoice.daysPastDue)} border-current/20 bg-current/5`}>
                  {invoice.daysPastDue}d
                </span>
              </div>
            )}
            {/* Automation status — flow name shown in sidebar, no need to repeat here */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Auto Status</span>
              <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${autoStatus.cls}`}>
                <autoStatus.icon className="h-3 w-3" />
                {autoStatus.label}
              </span>
            </div>
            {/* Customer reply */}
            {latestMessage && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Customer Reply</span>
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${CLASSIFICATION_COLORS[latestMessage.classification]}`}>
                  {CLASSIFICATION_LABELS[latestMessage.classification]}
                </span>
              </div>
            )}
            {/* Next action */}
            {nextAction && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Next Action</span>
                <span className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize max-w-[200px]">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{nextAction.stepType} · {formatDate(nextAction.scheduledAt)}</span>
                </span>
              </div>
            )}
          </div>
          {/* Recommended next step */}
          {recommendedNext && (
            <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Recommended:</strong> {recommendedNext}
              </p>
            </div>
          )}
        </div>

        {needsReview && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">This invoice needs human review</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {disputeDetected && "Dispute detected, follow-up paused. "}
                {contactExcluded && "Contact excluded from all automations. "}
                No automated actions will be sent until this is resolved.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Invoice header */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Due {formatDate(invoice.dueDate)}</p>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center justify-end gap-2">
                    <InvoiceStatusBadge status={invoice.status} />
                    {/* Open in Xero — placeholder until xeroUrl is set on invoice records */}
                    {invoice.xeroUrl ? (
                      <a
                        href={invoice.xeroUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open this invoice in Xero"
                        className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open in Xero
                      </a>
                    ) : (
                      <span
                        title="Xero URL not configured — add xeroUrl to invoice data"
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400 cursor-not-allowed select-none"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open in Xero
                      </span>
                    )}
                  </div>
                  {invoice.daysPastDue > 0 && (
                    <p className={`text-xs font-semibold ${agingColor(invoice.daysPastDue)}`}>
                      {invoice.daysPastDue} days overdue
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-400">Invoice Number</p>
                  <p className="font-mono font-medium text-gray-700">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Issue Date</p>
                  <p className="text-gray-700">{formatDate(invoice.issueDate)}</p>
                </div>
              </div>
              {invoice.notes && (
                <div className="mt-3 rounded-md bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Line items — collapsed by default, shows count + total in header */}
            {invoice.lineItems.length > 0 && (
              <CollapsibleSection
                title="Line Items"
                badge={invoice.lineItems.length}
                headerRight={formatCurrency(invoice.amount)}
                defaultOpen={false}
              >

                {/* ── Desktop table (sm+) ── */}
                <div className="hidden sm:block px-5 py-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 text-left text-xs text-gray-400 font-medium">Description</th>
                        <th className="pb-2 text-right text-xs text-gray-400 font-medium">Qty</th>
                        <th className="pb-2 text-right text-xs text-gray-400 font-medium">Unit Price</th>
                        <th className="pb-2 text-right text-xs text-gray-400 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700">{item.description}</td>
                          <td className="py-2 text-right text-gray-500">{item.quantity}</td>
                          <td className="py-2 text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} className="pt-2 text-right text-sm font-semibold text-gray-900">Total</td>
                        <td className="pt-2 text-right text-sm font-bold text-gray-900">{formatCurrency(invoice.amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile stacked cards (< sm) ── */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {invoice.lineItems.map((item, i) => (
                    <div key={i} className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 mb-2 leading-snug">{item.description}</p>
                      <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                        <div>
                          <p className="text-gray-400">Qty</p>
                          <p className="font-medium text-gray-700">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Unit price</p>
                          <p className="font-medium text-gray-700">{formatCurrency(item.unitPrice)}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Line total</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-gray-50/70 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Invoice Total</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(invoice.amount)}</span>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Activity Timeline — always visible, no expand/collapse */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Activity Timeline</h3>
                {timeline.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                    {timeline.length}
                  </span>
                )}
              </div>
              <div className="px-5 py-4">
                <BatchedTimeline events={timeline} />
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Customer Reply — email replies only; calls are not in Inbox so don't show here.
                Status Overview already captures call classification + recommendation above. */}
            {latestMessage && latestMessage.type !== "call" && (
              <CustomerReplyPanel message={latestMessage} />
            )}

            {/* Contact */}
            {invoice.contact && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invoice.contact.name}</p>
                      <p className="text-xs text-gray-500">{invoice.contact.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {invoice.contact.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {invoice.contact.phone}
                  </div>
                  {/* Customer overdue balance — only show when contact has multiple overdue invoices.
                      If only 1 overdue invoice exists it equals the current invoice amount, so showing
                      a separate "customer total" would look like a mismatch rather than extra context. */}
                  {contactOverdueInvoices.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                        Customer Overdue Balance
                      </p>
                      <p className="text-sm font-bold text-red-600 tabular-nums">{formatCurrency(contactTotalOverdue)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Across {contactOverdueInvoices.length} overdue invoices
                      </p>
                    </div>
                  )}
                  {invoice.contact.status !== "active" && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5">
                      <ShieldX className="h-3.5 w-3.5 text-red-500" />
                      <p className="text-xs font-medium text-red-700">
                        {invoice.contact.status === "excluded"
                          ? "Contact excluded from all automations"
                          : "Contact on hold"}
                      </p>
                    </div>
                  )}
                  <Link href={`/contacts/${invoice.contact.id}`} className="block text-center text-xs font-medium text-blue-600 hover:underline mt-2">
                    View contact →
                  </Link>
                </div>
              </div>
            )}

            {/* Automation summary + edit — handled by InvoiceDetailActions below */}

            {/* Pending actions */}
            {pendingActions.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Upcoming Actions ({pendingActions.length})
                </h3>
                <div className="space-y-2">
                  {pendingActions.map((action) => (
                    <div key={action.id} className="rounded-md border border-amber-200 bg-white px-3 py-2">
                      <p className="text-xs font-medium text-gray-700 capitalize">{action.stepType} scheduled</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {action.status === "awaiting_approval"
                          ? "⏸ Manual approval mode is enabled"
                          : `Scheduled: ${formatDate(action.scheduledAt)}`}
                      </p>
                      <Link href="/scheduled" className="text-xs text-blue-600 hover:underline mt-1 block">
                        View in Actions →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Automation summary + edit controls */}
            <InvoiceDetailActions
              invoiceId={id}
              currentStatus={invoice.status}
              excludedFromAutomation={invoice.excludedFromAutomation}
              flows={flows}
              assignedFlowId={invoice.assignedFlowId}
              assignedFlowDescription={assignedFlow?.description ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

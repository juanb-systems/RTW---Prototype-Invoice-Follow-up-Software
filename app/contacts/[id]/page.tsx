import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { ContactStatusBadge } from "@/components/contacts/ContactStatusBadge";
import { ExclusionControls } from "@/components/contacts/ExclusionControls";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDate, agingColor } from "@/lib/utils";
import { getDb } from "@/lib/store";
import { Mail, Phone, Tag, ShieldX, Zap, PauseCircle, Clock, GitBranch, MessageSquare, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // getContactWithInvoices is available from server-data but we need db for extra queries
  const db = getDb();
  const contact = db.contacts.find((c) => c.id === id);
  if (!contact) notFound();

  const invoices = db.invoices.filter((i) => i.contactId === id);
  const overdueInvoices = invoices.filter(
    (i) => i.status === "overdue" || i.status === "partial"
  );
  const overdueBalance = overdueInvoices.reduce((s, i) => s + i.amount, 0);

  // Most overdue invoice drives the automation stage
  const mostOverdueInvoice = overdueInvoices.reduce<(typeof invoices)[0] | null>(
    (prev, curr) => (!prev || curr.daysPastDue > prev.daysPastDue ? curr : prev),
    null
  );
  const maxDaysPastDue = mostOverdueInvoice?.daysPastDue ?? 0;

  // Assigned automation flow from the most overdue invoice
  const assignedFlow = mostOverdueInvoice?.assignedFlowId
    ? db.automationFlows.find((f) => f.id === mostOverdueInvoice.assignedFlowId) ?? null
    : null;

  // Latest customer reply (email only)
  const latestMsg = db.inboxMessages
    .filter((m) => m.contactId === id && m.type !== "call")
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())[0] ?? null;

  const automationPaused = latestMsg?.automationPaused ?? false;

  // Next scheduled action for this contact
  const contactActions = db.scheduledActions.filter((a) => a.contactId === id);
  const nextPendingAction = contactActions
    .filter((a) => a.status === "pending" || a.status === "awaiting_approval")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null;

  // Automation status derived from most overdue invoice
  const autoStatus = (() => {
    if (contact.status === "excluded")          return { label: "Excluded", cls: "bg-red-100 text-red-700", Icon: ShieldX };
    if (automationPaused)                       return { label: "Paused", cls: "bg-amber-100 text-amber-700", Icon: PauseCircle };
    if (contactActions.some(a => a.status === "awaiting_approval")) return { label: "Needs Approval", cls: "bg-purple-100 text-purple-700", Icon: Clock };
    if (contactActions.some(a => a.status === "pending")) return { label: "Active", cls: "bg-green-100 text-green-700", Icon: Zap };
    if (!mostOverdueInvoice?.assignedFlowId)    return { label: "No Automation", cls: "bg-gray-100 text-gray-500", Icon: GitBranch };
    return { label: "No Actions", cls: "bg-gray-100 text-gray-400", Icon: Clock };
  })();

  const REPLY_LABELS: Record<string, string> = {
    promise_to_pay: "Promise to Pay",
    dispute:        "Dispute",
    out_of_office:  "Out of Office",
    payment_query:  "Payment Query",
    unclassified:   "Reply received",
  };
  const REPLY_COLORS: Record<string, string> = {
    promise_to_pay: "bg-green-100 text-green-800",
    dispute:        "bg-red-100 text-red-800",
    out_of_office:  "bg-amber-100 text-amber-800",
    payment_query:  "bg-blue-100 text-blue-800",
    unclassified:   "bg-gray-100 text-gray-600",
  };

  return (
    <div>
      <TopBar
        title={contact.name}
        subtitle={contact.company}
        description="Account summary — total overdue balance, automation stage, related invoices, and latest reply."
      />
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* Excluded banner */}
        {contact.status === "excluded" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <ShieldX className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Contact excluded from all automations</p>
              <p className="text-xs text-red-600 mt-0.5">
                No automated emails, SMS, or calls will be sent to this contact.
                {contact.notes && ` Reason: ${contact.notes}`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

          {/* ── Main column ── */}
          <div className="md:col-span-2 space-y-4 sm:space-y-5">

            {/* Contact summary card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1 mr-3">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{contact.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{contact.company}</p>
                </div>
                <ContactStatusBadge status={contact.status} />
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600 min-w-0">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="break-all text-sm">{contact.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{contact.phone || "—"}</span>
                </div>
              </div>
              {contact.tags.length > 0 && (
                <div className="flex items-start gap-2 mt-3">
                  <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1.5">
                    {contact.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {contact.notes && (
                <div className="mt-3 rounded-md bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{contact.notes}</p>
                </div>
              )}
            </div>

            {/* Account stats — 4-column grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 sm:p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{invoices.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">Total Invoices</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 sm:p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-red-600 leading-tight">{overdueInvoices.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">Overdue</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 sm:p-3 text-center overflow-hidden">
                <p className="text-xs sm:text-base font-bold text-red-600 leading-tight break-all">{formatCurrency(overdueBalance)}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">Overdue Balance</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 sm:p-3 text-center">
                {mostOverdueInvoice ? (
                  <>
                    <p className={`text-xl sm:text-2xl font-bold leading-tight ${agingColor(maxDaysPastDue)}`}>{maxDaysPastDue}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">Max Days Overdue</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 leading-tight">—</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">Days Overdue</p>
                  </>
                )}
              </div>
            </div>

            {/* Account status strip — automation stage, most overdue invoice, next action, latest reply */}
            {(mostOverdueInvoice || latestMsg || nextPendingAction) && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Status</h3>

                <div className="flex flex-wrap gap-2">
                  {/* Automation status */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Automation</span>
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${autoStatus.cls}`}>
                      <autoStatus.Icon className="h-3 w-3" />
                      {autoStatus.label}
                    </span>
                  </div>

                  {/* Flow name */}
                  {assignedFlow && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Flow</span>
                      <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {assignedFlow.name}
                      </span>
                    </div>
                  )}

                  {/* Latest reply */}
                  {latestMsg && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Reply</span>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${REPLY_COLORS[latestMsg.classification] ?? "bg-gray-100 text-gray-600"}`}>
                        <MessageSquare className="h-3 w-3" />
                        {REPLY_LABELS[latestMsg.classification] ?? latestMsg.classification}
                      </span>
                    </div>
                  )}

                  {/* Next action */}
                  {nextPendingAction && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Next Action</span>
                      <Link
                        href="/scheduled"
                        className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors capitalize"
                      >
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        {nextPendingAction.stepType} · {formatDate(nextPendingAction.scheduledAt)}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Most overdue invoice drives stage */}
                {mostOverdueInvoice && (
                  <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                        Automation stage driven by
                      </p>
                      <p className="text-xs text-gray-700">
                        <span className="font-mono font-semibold">{mostOverdueInvoice.invoiceNumber}</span>
                        <span className={` ml-2 font-medium ${agingColor(maxDaysPastDue)}`}>{maxDaysPastDue} days overdue</span>
                      </p>
                    </div>
                    <Link
                      href={`/invoices/${mostOverdueInvoice.id}`}
                      className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap flex-shrink-0"
                    >
                      View →
                    </Link>
                  </div>
                )}

                {latestMsg && (
                  <Link
                    href={`/inbox?message=${latestMsg.id}`}
                    className="block text-xs font-medium text-blue-600 hover:underline"
                  >
                    View latest reply in Inbox →
                  </Link>
                )}
              </div>
            )}

            {/* Related invoices */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Invoices</h3>
              </div>

              {invoices.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">No invoices for this contact.</p>
              ) : (
                <>
                  {/* ── Desktop table (sm+) ── */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                          <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-gray-50/60">
                            <td className="px-5 py-3 font-mono text-xs font-medium text-gray-700">{inv.invoiceNumber}</td>
                            <td className="px-5 py-3 text-right text-xs font-semibold text-gray-900">{formatCurrency(inv.amount)}</td>
                            <td className="px-5 py-3 text-xs text-gray-500">{formatDate(inv.dueDate)}</td>
                            <td className="px-5 py-3 text-center">
                              {inv.daysPastDue > 0 ? (
                                <span className={`text-xs font-semibold ${agingColor(inv.daysPastDue)}`}>{inv.daysPastDue}d</span>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                            <td className="px-5 py-3">
                              <Link href={`/invoices/${inv.id}`} className="text-xs text-blue-600 hover:underline">View →</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Mobile invoice cards (< sm) ── */}
                  <div className="sm:hidden divide-y divide-gray-100">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="px-4 py-3.5">
                        <div className="flex items-baseline justify-between gap-2 mb-1.5">
                          <span className="font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-sm font-bold text-gray-900 shrink-0">
                            {formatCurrency(inv.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                          <span>Due {formatDate(inv.dueDate)}</span>
                          {inv.daysPastDue > 0 && (
                            <span className={`font-semibold ${agingColor(inv.daysPastDue)}`}>
                              {inv.daysPastDue}d overdue
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <InvoiceStatusBadge status={inv.status} />
                          <Link href={`/invoices/${inv.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                            View invoice →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Automation Status — below invoices on mobile, sidebar on desktop */}
          <div className="md:hidden">
            <ExclusionControls contactId={id} currentStatus={contact.status} />
          </div>

          {/* ── Right sidebar — desktop only ── */}
          <div className="hidden md:block">
            <ExclusionControls contactId={id} currentStatus={contact.status} />
          </div>

        </div>
      </div>
    </div>
  );
}

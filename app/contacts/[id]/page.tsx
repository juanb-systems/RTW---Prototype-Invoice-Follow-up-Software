import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { ContactStatusBadge } from "@/components/contacts/ContactStatusBadge";
import { ExclusionControls } from "@/components/contacts/ExclusionControls";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDate, agingColor } from "@/lib/utils";
import { getContactWithInvoices } from "@/lib/server-data";
import { Mail, Phone, Tag, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = getContactWithInvoices(id);
  if (!contact) notFound();

  const overdueInvoices = contact.invoices.filter(
    (i) => i.status === "overdue" || i.status === "partial" || i.status === "disputed"
  );
  const totalOwed = overdueInvoices.reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <TopBar title={contact.name} subtitle={contact.company} />
      <div className="p-4 sm:p-6 space-y-6">
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

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{contact.name}</h2>
                  <p className="text-sm text-gray-500">{contact.company}</p>
                </div>
                <ContactStatusBadge status={contact.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />{contact.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />{contact.phone}
                </div>
              </div>
              {contact.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
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

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{contact.invoices.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total Invoices</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <p className="text-xl font-bold text-red-600">{overdueInvoices.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Overdue</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalOwed)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total Owed</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Invoices</h3>
              </div>
              {contact.invoices.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">No invoices for this contact.</p>
              ) : (
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
                    {contact.invoices.map((inv) => (
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
              )}
            </div>
          </div>

          <div>
            <ExclusionControls contactId={id} currentStatus={contact.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

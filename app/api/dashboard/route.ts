import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const overdueInvoices = db.invoices.filter(
    (i) => i.status === "overdue" || i.status === "partial"
  );
  const totalOverdueAmount = overdueInvoices.reduce((s, i) => s + i.amount, 0);
  const avgDaysPastDue =
    overdueInvoices.length > 0
      ? Math.round(
          overdueInvoices.reduce((s, i) => s + i.daysPastDue, 0) /
            overdueInvoices.length
        )
      : 0;

  const pendingActions = db.scheduledActions.filter(
    (a) => a.status === "pending" || a.status === "awaiting_approval"
  ).length;

  const agingBuckets = [
    { label: "1–14d", count: 0, amount: 0 },
    { label: "15–30d", count: 0, amount: 0 },
    { label: "31–60d", count: 0, amount: 0 },
    { label: "61–90d", count: 0, amount: 0 },
    { label: "90d+", count: 0, amount: 0 },
  ];

  for (const inv of overdueInvoices) {
    const d = inv.daysPastDue;
    let bucket: (typeof agingBuckets)[0];
    if (d <= 14) bucket = agingBuckets[0];
    else if (d <= 30) bucket = agingBuckets[1];
    else if (d <= 60) bucket = agingBuckets[2];
    else if (d <= 90) bucket = agingBuckets[3];
    else bucket = agingBuckets[4];
    bucket.count++;
    bucket.amount += inv.amount;
  }

  // Simulated 6-month trend (hardcoded for prototype)
  const collectionsTrend = [
    { month: "Dec", collected: 48500, target: 60000 },
    { month: "Jan", collected: 62100, target: 60000 },
    { month: "Feb", collected: 55300, target: 65000 },
    { month: "Mar", collected: 71200, target: 65000 },
    { month: "Apr", collected: 58900, target: 70000 },
    { month: "May", collected: 34200, target: 70000 },
  ];

  const recentActivity = db.timelineEvents
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 8)
    .map((event) => {
      const invoice = db.invoices.find((i) => i.id === event.invoiceId);
      const contact = invoice
        ? db.contacts.find((c) => c.id === invoice.contactId)
        : null;
      return { ...event, invoice, contact };
    });

  return NextResponse.json({
    kpis: {
      totalOverdue: overdueInvoices.length,
      totalOverdueAmount,
      avgDaysPastDue,
      pendingActions,
    },
    agingBuckets,
    collectionsTrend,
    recentActivity,
  });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Revenue recognition rule:
// An order counts as "revenue-eligible" when it has NOT been cancelled or
// returned AND its paymentStatus is "paid" (for online orders) OR payment
// method is COD (which is collected on delivery — counted when not cancelled).
// We treat "cancelled" / "returned" orders as zero-revenue regardless of payment.
// Failed online payments are also excluded from revenue.

function isRevenueOrder(o: { status: string; payment: string; paymentStatus: string }): boolean {
  if (o.status === "cancelled" || o.status === "returned") return false;
  if (o.paymentStatus === "failed") return false;
  // COD orders count when not cancelled/returned (revenue is recognized on fulfillment).
  if (o.payment === "cod") return true;
  // Online orders count only when paid.
  return o.paymentStatus === "paid";
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

// GET /api/admin/analytics — returns revenue + order counts for admin dashboard.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const allOrders = await db.order.findMany({
    select: {
      id: true,
      total: true,
      status: true,
      payment: true,
      paymentStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= todayStart);
  const monthOrders = allOrders.filter((o) => new Date(o.createdAt) >= monthStart);

  const revenueAll = allOrders.filter(isRevenueOrder).reduce((s, o) => s + o.total, 0);
  const revenueToday = todayOrders.filter(isRevenueOrder).reduce((s, o) => s + o.total, 0);
  const revenueMonth = monthOrders.filter(isRevenueOrder).reduce((s, o) => s + o.total, 0);

  const totalOrders = allOrders.length;
  const ordersToday = todayOrders.length;
  const ordersMonth = monthOrders.length;

  const processingOrders = allOrders.filter((o) => o.status === "processing").length;
  const completedOrders = allOrders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = allOrders.filter((o) => o.status === "cancelled").length;
  const returnedOrders = allOrders.filter((o) => o.status === "returned").length;

  const codCount = allOrders.filter((o) => o.payment === "cod").length;
  const onlineCount = allOrders.filter((o) => o.payment === "online").length;
  const paidCount = allOrders.filter((o) => o.paymentStatus === "paid").length;
  const failedCount = allOrders.filter((o) => o.paymentStatus === "failed").length;
  const pendingPaymentCount = allOrders.filter((o) => o.paymentStatus === "pending").length;

  const revenueOrdersCount = allOrders.filter(isRevenueOrder).length;
  const avgOrderValue = revenueOrdersCount > 0 ? Math.round(revenueAll / revenueOrdersCount) : 0;

  // Simple monthly series (last 6 months) for a lightweight chart.
  const months: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const m = allOrders.filter(
      (o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < end
    );
    const r = m.filter(isRevenueOrder).reduce((s, o) => s + o.total, 0);
    months.push({
      label: d.toLocaleDateString("en-PK", { month: "short" }),
      total: r,
    });
  }

  // Status breakdown for pie/donut
  const statusBreakdown = [
    { label: "processing", value: processingOrders, color: "#3b82f6" },
    { label: "shipped", value: allOrders.filter((o) => o.status === "shipped").length, color: "#f59e0b" },
    { label: "delivered", value: completedOrders, color: "#22c55e" },
    { label: "cancelled", value: cancelledOrders, color: "#ef4444" },
    { label: "returned", value: returnedOrders, color: "#a855f7" },
  ];

  return NextResponse.json({
    revenue: {
      today: revenueToday,
      month: revenueMonth,
      total: revenueAll,
    },
    orders: {
      today: ordersToday,
      month: ordersMonth,
      total: totalOrders,
      processing: processingOrders,
      completed: completedOrders,
      cancelled: cancelledOrders,
      returned: returnedOrders,
    },
    payments: {
      cod: codCount,
      online: onlineCount,
      paid: paidCount,
      failed: failedCount,
      pending: pendingPaymentCount,
    },
    avgOrderValue,
    monthlySeries: months,
    statusBreakdown,
  });
}

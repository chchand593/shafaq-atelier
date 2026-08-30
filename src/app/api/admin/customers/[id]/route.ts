import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/customers/[id] — detailed customer info with order history
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const orders = await db.order.findMany({
    where: { email: user.email },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      total: true,
      status: true,
      paymentStatus: true,
      payment: true,
      createdAt: true,
    },
  });

  const orderCount = orders.length;
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
  const latestOrder = orders[0] || null;

  return NextResponse.json({
    customer: {
      id: user.id,
      email: user.email,
      name: user.name || "",
      createdAt: user.createdAt,
      role: user.role,
    },
    stats: {
      orderCount,
      totalSpent,
      avgOrderValue,
    },
    latestOrder,
    orders: orders.map((o) => ({
      id: o.id,
      number: o.number,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      payment: o.payment,
      createdAt: o.createdAt,
    })),
  });
}

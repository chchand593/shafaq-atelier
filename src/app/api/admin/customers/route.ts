import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/customers — list all customers with order stats
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await db.user.findMany({
    where: { role: "customer" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      orders: {
        select: { id: true, total: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const customers = users.map((u) => {
    const orderCount = u.orders.length;
    const totalSpent = u.orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    return {
      id: u.id,
      email: u.email,
      name: u.name || "",
      orderCount,
      totalSpent,
      createdAt: u.createdAt,
    };
  });

  return NextResponse.json({ customers });
}

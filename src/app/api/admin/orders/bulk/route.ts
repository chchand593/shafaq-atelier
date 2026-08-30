import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const STATUSES = ["processing", "confirmed", "shipped", "delivered", "cancelled", "returned"];

// POST /api/admin/orders/bulk — bulk update order statuses
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, status } = (await request.json()) as {
    ids?: string[];
    status?: string;
  };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
  }
  if (!status || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await db.order.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}

// GET /api/admin/orders/bulk?format=csv&status=processing — export orders as CSV
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const statusFilter = searchParams.get("status");

  const orders = await db.order.findMany({
    where: statusFilter && statusFilter !== "all" ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (format === "csv") {
    const header = [
      "Order Number",
      "Date",
      "Customer Name",
      "Customer Email",
      "Phone",
      "City",
      "Items",
      "Subtotal",
      "Discount",
      "Shipping",
      "Total",
      "Payment Method",
      "Payment Status",
      "Payment Reference",
      "Order Status",
    ].join(",");

    const escapeCsv = (s: string | null | undefined) => {
      if (!s) return "";
      const str = String(s);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = orders.map((o) =>
      [
        o.number,
        new Date(o.createdAt).toISOString().split("T")[0],
        escapeCsv(o.fullName),
        escapeCsv(o.email),
        escapeCsv(o.phone),
        escapeCsv(o.city),
        o.items.length,
        o.subtotal,
        o.discount,
        o.shipping,
        o.total,
        o.payment,
        o.paymentStatus,
        escapeCsv(o.paymentReference),
        o.status,
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="shafaq-atelier-orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({ orders });
}

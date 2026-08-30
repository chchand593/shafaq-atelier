import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/orders — list all orders with items
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

  const orders = await db.order.findMany({
    where: status && status !== "all" ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { items: true },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      number: o.number,
      email: o.email,
      fullName: o.fullName,
      phone: o.phone,
      city: o.city,
      payment: o.payment,
      paymentStatus: o.paymentStatus,
      paymentReference: o.paymentReference,
      subtotal: o.subtotal,
      discount: o.discount,
      shipping: o.shipping,
      total: o.total,
      promoCode: o.promoCode,
      status: o.status,
      createdAt: o.createdAt,
      itemCount: o.items.length,
      items: o.items.map((it) => ({
        name: it.name,
        image: it.image,
        price: it.price,
        qty: it.qty,
        colorName: it.colorName,
        size: it.size,
      })),
    })),
  });
}

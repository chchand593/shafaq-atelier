import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/orders/[number] — public order lookup by order number
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;

  const order = await db.order.findUnique({
    where: { number },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      email: order.email,
      fullName: order.fullName,
      phone: order.phone,
      address: order.address,
      city: order.city,
      province: order.province,
      postal: order.postal,
      payment: order.payment,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      promoCode: order.promoCode,
      createdAt: order.createdAt,
      items: order.items.map((it) => ({
        name: it.name,
        image: it.image,
        price: it.price,
        qty: it.qty,
        colorName: it.colorName,
        size: it.size,
        productId: it.productId,
      })),
    },
  });
}

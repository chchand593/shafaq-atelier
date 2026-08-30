import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { sendOrderStatusUpdate } from "@/lib/email";

export const dynamic = "force-dynamic";

const STATUSES = ["processing", "confirmed", "shipped", "delivered", "cancelled", "returned"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

// GET /api/admin/orders/[id] — get detailed order by ID or order number
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Try by ID first, then by order number
  let order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    order = await db.order.findUnique({
      where: { number: id },
      include: { items: true },
    });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      number: order.number,
      email: order.email,
      fullName: order.fullName,
      phone: order.phone,
      address: order.address,
      city: order.city,
      province: order.province,
      postal: order.postal,
      notes: order.notes,
      payment: order.payment,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.paymentProvider,
      paymentReference: order.paymentReference,
      paymentScreenshotPath: order.paymentScreenshotPath,
      paidAt: order.paidAt,
      paymentFailureReason: order.paymentFailureReason,
      paymentVerifiedById: order.paymentVerifiedById,
      paymentVerifiedAt: order.paymentVerifiedAt,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      promoCode: order.promoCode,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        image: it.image,
        price: it.price,
        qty: it.qty,
        color: it.color,
        colorName: it.colorName,
        size: it.size,
        isCustom: it.productId.startsWith("custom-"),
      })),
    },
    statuses: STATUSES,
    paymentStatuses: PAYMENT_STATUSES,
  });
}

// PATCH /api/admin/orders/[id] — update order status and/or payment status
// ADMIN-ONLY. Customers cannot transition payment status. Only authenticated
// admin users (verified by requireAdmin) can mark a payment as paid or failed.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    paymentStatus?: string;
    // Optional audit note for verify/reject actions
    paymentNote?: string;
  };

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }
    data.status = body.status;
  }

  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }
    data.paymentStatus = body.paymentStatus;
    if (body.paymentStatus === "paid") {
      data.paidAt = new Date();
    }
    // Audit: record admin who changed payment status + when
    const adminId = (auth.session?.user as { id?: string } | undefined)?.id;
    if (adminId) {
      data.paymentVerifiedById = adminId;
    }
    data.paymentVerifiedAt = new Date();
    // If admin supplied a note for failure/rejection, record it
    if (body.paymentNote && body.paymentStatus === "failed") {
      const note = String(body.paymentNote).trim().slice(0, 500);
      data.paymentFailureReason = note || "Payment rejected by admin.";
    } else if (body.paymentStatus === "paid") {
      // Clear failure reason when marking as paid
      data.paymentFailureReason = null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  // Find by ID or order number
  let order = await db.order.findUnique({ where: { id } });
  if (!order) {
    order = await db.order.findUnique({ where: { number: id } });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const oldStatus = order.status;

  // --- Stock restoration on cancel/return ---
  // When order is cancelled or returned, restore stock for catalog products.
  // Prevent double-restoration by checking previous status.
  const shouldRestoreStock =
    body.status !== undefined &&
    (body.status === "cancelled" || body.status === "returned") &&
    oldStatus !== "cancelled" &&
    oldStatus !== "returned";

  if (shouldRestoreStock) {
    // Atomically update order status + restore stock in a transaction
    await db.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data,
      });

      // Restore stock for catalog products (skip custom abayas)
      const items = await tx.orderItem.findMany({
        where: { orderId: order.id },
        select: { productId: true, qty: true },
      });

      for (const it of items) {
        if (it.productId.startsWith("custom-")) continue;
        await tx.product.update({
          where: { slug: it.productId },
          data: { stock: { increment: it.qty } },
        });
      }
    });
  } else {
    // Normal update (no stock restoration needed)
    await db.order.update({
      where: { id: order.id },
      data,
    });
  }

  // Send status update email (best-effort) only if order status changed
  if (body.status !== undefined && oldStatus !== body.status) {
    void sendOrderStatusUpdate({
      email: order.email,
      fullName: order.fullName,
      orderNumber: order.number,
      oldStatus,
      newStatus: body.status,
      total: order.total,
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      number: order.number,
      status: body.status ?? oldStatus,
      paymentStatus: body.paymentStatus ?? order.paymentStatus,
    },
    stockRestored: shouldRestoreStock,
  });
}

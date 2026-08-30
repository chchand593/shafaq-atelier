import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookPayload, type PaymentStatus } from "@/lib/payment";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/payments/webhook — JazzCash gateway callback handler
//
// JazzCash sends a POST with form-urlencoded data (not JSON) to our return URL.
// The response includes pp_SecureHash which we verify cryptographically.
//
// SECURITY:
// - Verifies JazzCash HMAC-SHA256 signature before trusting any data.
// - Idempotent: multiple callbacks for the same order are safe.
// - Never marks an order as paid without verified gateway confirmation.
// - On failed payment, restores stock for catalog products.
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // JazzCash sends form-urlencoded data
    const contentType = request.headers.get("content-type") || "";

    let formData: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      formData = (await request.json()) as Record<string, string>;
    } else {
      // Parse form-urlencoded body
      const text = await request.text();
      const params = new URLSearchParams(text);
      for (const [key, value] of params.entries()) {
        formData[key] = value;
      }
    }

    // Verify the callback signature and extract payment data
    const verification = verifyWebhookPayload(formData);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.message || "Invalid webhook payload." },
        { status: 400 }
      );
    }

    const { orderNumber, paymentReference, amount, status, responseMessage } = verification;

    // Find the order
    const order = await db.order.findUnique({
      where: { number: orderNumber },
      select: {
        id: true,
        number: true,
        total: true,
        paymentStatus: true,
        paymentReference: true,
        payment: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Idempotency: if already paid, don't process again
    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        ok: true,
        message: "Order already marked as paid.",
        idempotent: true,
      });
    }

    // Verify payment reference matches
    if (order.paymentReference && order.paymentReference !== paymentReference) {
      return NextResponse.json(
        { error: "Payment reference mismatch." },
        { status: 400 }
      );
    }

    // Verify amount matches order total
    if (amount !== undefined && amount !== order.total) {
      return NextResponse.json(
        { error: `Amount mismatch: expected ${order.total}, got ${amount}.` },
        { status: 400 }
      );
    }

    const paymentStatus = status as PaymentStatus;

    // Update payment status
    const updateData: {
      paymentStatus: PaymentStatus;
      paymentReference?: string;
      paidAt?: Date;
      paymentFailureReason?: string | null;
    } = {
      paymentStatus,
    };

    if (!order.paymentReference) {
      updateData.paymentReference = paymentReference;
    }

    if (paymentStatus === "paid") {
      updateData.paidAt = new Date();
    } else if (paymentStatus === "failed") {
      updateData.paymentFailureReason = responseMessage || "Gateway reported payment failure.";
    }

    // If payment failed, restore stock for catalog products (atomic transaction)
    if (paymentStatus === "failed" && order.payment === "online") {
      await db.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: updateData });

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
      await db.order.update({ where: { id: order.id }, data: updateData });
    }

    return NextResponse.json({
      ok: true,
      orderNumber: order.number,
      paymentStatus,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook processing failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET endpoint for health check / gateway verification
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/payments/webhook",
    status: "active",
    gatewayConfigured: !!(process.env.PAYMENT_GATEWAY && process.env.PAYMENT_API_KEY),
  });
}

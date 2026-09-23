import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email";
import { PROMO_CODES, promoDiscount, shippingCost } from "@/lib/pricing";
import { isPaymentMethodAvailable, processPayment } from "@/lib/payment";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

// Maximum length for the customer-supplied transaction/reference ID.
const MAX_TXN_ID = 100;

// POST /api/orders — create an order from the cart payload
// SECURITY: prices are recalculated server-side; client-sent totals are ignored.
// Payment method is validated server-side against store settings (codEnabled,
// manualTransferEnabled, onlinePaymentAvailable). Payment status is NEVER
// trusted from the client — the server always sets it based on the method.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await request.json()) as {
      items: Array<{
        productId: string;
        name: string;
        image: string;
        price: number;
        qty: number;
        color: string;
        colorName: string;
        size: string;
      }>;
      email: string;
      fullName: string;
      phone: string;
      address: string;
      city: string;
      province: string;
      postal: string;
      notes?: string;
      payment: string;
      promoCode?: string;
      clientToken?: string;
      // For manual bank_transfer only — customer-supplied transaction/reference ID
      paymentReference?: string;
    };

    // --- Validation ---
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    // Validate payment method name is one of the known values
    if (!isPaymentMethodAvailable(body.payment)) {
      return NextResponse.json(
        { error: "Selected payment method is not available." },
        { status: 400 }
      );
    }

    // --- Server-side payment-method availability check against store settings ---
    // The client can request any of the three methods, but the server has the
    // final say based on the admin-configured flags. This prevents customers
    // from bypassing disabled payment methods by crafting API calls.
    const settings = await getStoreSettings();
    if (body.payment === "cod" && !settings.codEnabled) {
      return NextResponse.json(
        { error: "Cash on Delivery is currently unavailable. Please choose another payment method." },
        { status: 400 }
      );
    }
    if (body.payment === "bank_transfer" && !settings.manualTransferEnabled) {
      return NextResponse.json(
        { error: "Manual bank transfer is currently unavailable. Please choose another payment method." },
        { status: 400 }
      );
    }
    if (body.payment === "online") {
      // Online (automatic JazzCash gateway) — only allow if env credentials set
      const { isOnlinePaymentConfigured } = await import("@/lib/payment");
      if (!isOnlinePaymentConfigured()) {
        return NextResponse.json(
          { error: "Online payment is not available. Please choose Cash on Delivery or Manual Bank Transfer." },
          { status: 400 }
        );
      }
    }

    // --- Manual bank transfer: validate customer-supplied transaction/reference ID ---
    let customerPaymentReference: string | null = null;
    if (body.payment === "bank_transfer") {
      const txnId = (body.paymentReference ?? "").trim();
      if (txnId.length === 0) {
        return NextResponse.json(
          { error: "Please enter your payment transaction / reference ID to complete your bank transfer order." },
          { status: 400 }
        );
      }
      if (txnId.length > MAX_TXN_ID) {
        return NextResponse.json(
          { error: `Transaction / reference ID is too long (max ${MAX_TXN_ID} characters).` },
          { status: 400 }
        );
      }
      // Basic sanity — reject obviously invalid characters (control chars, etc.)
      if (!/^[\w\d\-+/=:.,() ]+$/i.test(txnId)) {
        return NextResponse.json(
          { error: "Transaction / reference ID contains invalid characters." },
          { status: 400 }
        );
      }
      customerPaymentReference = txnId;
    }

    // --- Duplicate submission prevention ---
    if (body.clientToken) {
      const existing = await db.order.findFirst({
        where: { clientToken: body.clientToken },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This order has already been submitted." },
          { status: 409 }
        );
      }
    }

    // --- Server-side price recalculation + stock validation ---
    // Fetch all catalog products from DB for price + stock validation
    const catalogProducts = await db.product.findMany({
      select: { slug: true, price: true, originalPrice: true, stock: true, name: true, active: true },
    });
    const catalogMap = new Map(catalogProducts.map((p) => [p.slug, p]));

    let subtotal = 0;
    const validatedItems = body.items.map((it) => {
      // Custom abayas use "custom-{timestamp}" productId — trust the client price
      // since there's no catalog entry for bespoke items. No stock check.
      if (it.productId.startsWith("custom-")) {
        subtotal += it.price * it.qty;
        return it;
      }

      // For catalog products, use the DB price — never trust client price
      const dbProduct = catalogMap.get(it.productId);
      if (!dbProduct) {
        throw new Error(`Product not found: ${it.productId}`);
      }

      // --- Active check (server-side) — inactive products cannot be purchased ---
      if (!dbProduct.active) {
        throw new Error(`${dbProduct.name} is no longer available.`);
      }

      // --- Stock validation (server-side) ---
      if (dbProduct.stock < it.qty) {
        throw new Error(
          `Sorry, ${dbProduct.name} only has ${dbProduct.stock} left.`
        );
      }

      const unitPrice = dbProduct.price;
      subtotal += unitPrice * it.qty;
      return {
        ...it,
        price: unitPrice,
      };
    });

    // --- Promo code validation (server-side) ---
    let discount = 0;
    let promoCode: string | null = null;
    if (body.promoCode) {
      const promo = PROMO_CODES.find(
        (p) => p.code.toLowerCase() === body.promoCode!.trim().toLowerCase()
      );
      if (promo) {
        discount = promoDiscount(subtotal, promo);
        promoCode = promo.code;
      }
      // If promo code is invalid, just don't apply discount (no error)
    }

    // --- Shipping calculation (server-side) ---
    const itemCount = validatedItems.reduce((n, it) => n + it.qty, 0);
    const afterDiscount = Math.max(0, subtotal - discount);
    const shipping = shippingCost(afterDiscount, itemCount);
    const total = Math.max(0, afterDiscount + shipping);

    // --- Process payment (server-side decision, never trusts client) ---
    const paymentResult = processPayment(
      body.payment as "cod" | "bank_transfer" | "online",
      total,
      {
        orderNumber: "pending", // will be set after order creation
        customerName: body.fullName,
        customerEmail: body.email,
        customerPhone: body.phone,
        description: `ShafaQ Atelier Order`,
      }
    );
    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.message || "Payment processing failed." },
        { status: 400 }
      );
    }

    // --- Create order + decrement stock atomically ---
    const number = "LM-" + Date.now().toString(36).toUpperCase().slice(-8);

    // Use a transaction to ensure order creation and stock decrement happen together
    const order = await db.$transaction(async (tx) => {
      // Re-fetch stock + active inside transaction to prevent race conditions
      for (const it of validatedItems) {
        if (it.productId.startsWith("custom-")) continue;
        const current = await tx.product.findUnique({
          where: { slug: it.productId },
          select: { stock: true, name: true, active: true },
        });
        if (!current) {
          throw new Error(`Product not found: ${it.productId}`);
        }
        if (!current.active) {
          throw new Error(`${current.name} is no longer available.`);
        }
        if (current.stock < it.qty) {
          throw new Error(
            `Sorry, ${current.name} only has ${current.stock} left.`
          );
        }
      }

      // Determine the paymentReference to store.
      // - bank_transfer: customer-supplied transaction/reference ID
      // - online: gateway reference (filled in after order creation)
      // - cod: null (paid on delivery, no reference)
      const paymentReferenceToStore =
        body.payment === "bank_transfer"
          ? customerPaymentReference
          : (paymentResult.gatewayReference ?? null);

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          number,
          clientToken: body.clientToken ?? null,
          userId: (session?.user as { id?: string } | undefined)?.id ?? null,
          email: body.email,
          fullName: body.fullName,
          phone: body.phone,
          address: body.address,
          city: body.city,
          province: body.province,
          postal: body.postal,
          notes: body.notes ?? null,
          payment: body.payment,
          paymentStatus: paymentResult.paymentStatus,
          paymentProvider: paymentResult.paymentProvider ?? null,
          paymentReference: paymentReferenceToStore,
          paidAt: null,
          paymentFailureReason: null,
          subtotal,
          discount,
          shipping,
          total,
          promoCode,
          status: "processing",
          items: {
            create: validatedItems.map((it) => ({
              productId: it.productId,
              name: it.name,
              image: it.image,
              price: it.price,
              qty: it.qty,
              color: it.color,
              colorName: it.colorName,
              size: it.size,
            })),
          },
        },
        include: { items: true },
      });

      // Decrement stock for catalog products only (not custom abayas)
      for (const it of validatedItems) {
        if (it.productId.startsWith("custom-")) continue;
        await tx.product.update({
          where: { slug: it.productId },
          data: { stock: { decrement: it.qty } },
        });
      }

      return newOrder;
    });

    // --- For automatic online payments, re-initiate with the real order number ---
    let redirectData: { url?: string; postData?: Record<string, string> } | null = null;
    if (body.payment === "online" && paymentResult.success) {
      // Re-create the JazzCash payment with the actual order number
      const { createJazzCashPayment } = await import("@/lib/jazzcash");
      const jcResult = createJazzCashPayment({
        orderNumber: number,
        amount: total,
        customerName: body.fullName,
        customerEmail: body.email,
        customerPhone: body.phone,
        description: `ShafaQ Atelier Order ${number}`,
      });
      if (jcResult.success) {
        redirectData = { url: jcResult.redirectUrl, postData: jcResult.postData };

        // Update the order with the correct payment reference
        await db.order.update({
          where: { id: order.id },
          data: {
            paymentReference: jcResult.paymentReference,
          },
        });
      }
    }

    // Send order confirmation email (best-effort, non-blocking)
    void sendOrderConfirmation({
      email: body.email,
      fullName: body.fullName,
      orderNumber: number,
      total,
      items: validatedItems.map((it) => ({
        name: it.name,
        qty: it.qty,
        price: it.price,
        colorName: it.colorName,
        size: it.size,
      })),
      payment: body.payment,
      estimatedDelivery: "3–5 business days",
    }).catch(() => {});

    return NextResponse.json({ ok: true, order, redirectData });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/orders — list the signed-in user's orders
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ orders: [] });
  }
  const orders = await db.order.findMany({
    where: { email: session.user.email },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json({ orders });
}

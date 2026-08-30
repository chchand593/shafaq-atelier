import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { getStoreSettings } from "@/lib/store-settings";
import { PROMO_CODES, promoDiscount, shippingCostWith } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// POST /api/admin/orders/create — create a manual order (admin only)
// SECURITY: prices and totals are recalculated server-side from the live
// catalogue; client-sent prices/totals are ignored. Inactive products cannot
// be ordered through this endpoint. Stock is decremented atomically inside a
// transaction. Custom abayas bypass all stock/active checks (made-to-order).
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    customerId?: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postal: string;
    notes?: string;
    items: Array<{
      productId: string;
      qty: number;
      color?: string;
      colorName?: string;
      size?: string;
    }>;
    payment: string; // cod | bank_transfer
    promoCode?: string;
    // For bank_transfer: admin can optionally record a customer-supplied txn ID
    paymentReference?: string;
  };

  // --- Basic validation ---
  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: "No items in order." }, { status: 400 });
  }
  if (!body.fullName || !body.fullName.trim()) {
    return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
  }
  if (!body.phone || !body.phone.trim()) {
    return NextResponse.json({ error: "Customer phone is required." }, { status: 400 });
  }
  if (!body.address || !body.address.trim()) {
    return NextResponse.json({ error: "Shipping address is required." }, { status: 400 });
  }
  if (!body.city || !body.city.trim()) {
    return NextResponse.json({ error: "City is required." }, { status: 400 });
  }
  if (!body.postal || !body.postal.trim()) {
    return NextResponse.json({ error: "Postal code is required." }, { status: 400 });
  }
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return NextResponse.json({ error: "Email format is invalid." }, { status: 400 });
  }
  // Admin manual orders support COD or bank_transfer only.
  // (The automatic JazzCash gateway is reserved for customer-initiated checkout.)
  if (body.payment !== "cod" && body.payment !== "bank_transfer") {
    return NextResponse.json({ error: "Manual orders support COD or Bank Transfer only." }, { status: 400 });
  }

  // For bank_transfer, admin may supply a payment reference. Validate if present.
  let adminPaymentReference: string | null = null;
  if (body.payment === "bank_transfer") {
    const txnId = (body.paymentReference ?? "").trim();
    if (txnId.length > 100) {
      return NextResponse.json({ error: "Transaction / reference ID too long (max 100)." }, { status: 400 });
    }
    if (txnId.length > 0 && !/^[\w\d\-+/=:.,() ]+$/i.test(txnId)) {
      return NextResponse.json({ error: "Transaction / reference ID contains invalid characters." }, { status: 400 });
    }
    adminPaymentReference = txnId.length > 0 ? txnId : null;
  }

  // Reject non-positive quantities
  for (const it of body.items) {
    if (!Number.isFinite(it.qty) || it.qty <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than zero." }, { status: 400 });
    }
  }

  // --- Session for userId linkage (optional) ---
  const session = await getServerSession(authOptions);
  let userId: string | null = null;
  if (body.customerId) {
    userId = body.customerId;
  } else if (session?.user?.email && session.user.email === body.email) {
    userId = (session.user as { id?: string }).id || null;
  }

  // --- Load store settings for shipping/threshold ---
  const settings = await getStoreSettings();

  // --- Fetch products from DB ---
  const catalogProducts = await db.product.findMany({
    select: { slug: true, price: true, stock: true, name: true, image: true, colors: true, active: true },
  });
  const catalogMap = new Map(catalogProducts.map((p) => [p.slug, p]));

  // --- Validate items + server-side price/active/stock checks ---
  let subtotal = 0;
  const validatedItems: Array<{
    productId: string;
    name: string;
    image: string;
    price: number;
    qty: number;
    color: string;
    colorName: string;
    size: string;
  }> = [];

  for (const it of body.items) {
    if (it.productId.startsWith("custom-")) {
      // Custom abaya — bypass stock + active checks (made-to-order)
      validatedItems.push({
        productId: it.productId,
        name: "Custom Abaya (Made-to-Order)",
        image: "/images/custom.jpg",
        price: 21500, // default custom price (server-fixed)
        qty: it.qty,
        color: it.color || "#1a1a1a",
        colorName: it.colorName || "Custom",
        size: it.size || "Custom (made-to-order)",
      });
      subtotal += 21500 * it.qty;
      continue;
    }

    const dbProduct = catalogMap.get(it.productId);
    if (!dbProduct) {
      return NextResponse.json({ error: `Product not found: ${it.productId}` }, { status: 400 });
    }
    if (!dbProduct.active) {
      return NextResponse.json(
        { error: `${dbProduct.name} is inactive and cannot be ordered. Activate it first.` },
        { status: 400 }
      );
    }
    if (dbProduct.stock < it.qty) {
      return NextResponse.json(
        { error: `Sorry, ${dbProduct.name} only has ${dbProduct.stock} left.` },
        { status: 400 }
      );
    }
    const unitPrice = dbProduct.price;
    subtotal += unitPrice * it.qty;
    validatedItems.push({
      productId: it.productId,
      name: dbProduct.name,
      image: dbProduct.image,
      price: unitPrice,
      qty: it.qty,
      color: it.color || "#1a1a1a",
      colorName: it.colorName || "Default",
      size: it.size || "M",
    });
  }

  // --- Promo validation (server-side) ---
  let discount = 0;
  let promoCode: string | null = null;
  if (body.promoCode) {
    const promo = PROMO_CODES.find((p) => p.code.toLowerCase() === body.promoCode!.trim().toLowerCase());
    if (promo) {
      discount = promoDiscount(subtotal, promo);
      promoCode = promo.code;
    }
  }

  // --- Shipping calculation (server-side, store-settings-aware) ---
  const itemCount = validatedItems.reduce((n, it) => n + it.qty, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = shippingCostWith(
    afterDiscount,
    itemCount,
    settings.shippingCharge,
    settings.freeShippingThreshold
  );
  const total = Math.max(0, afterDiscount + shipping);

  // --- Create order + decrement stock atomically ---
  const number = "LM-" + Date.now().toString(36).toUpperCase().slice(-8);

  const order = await db.$transaction(async (tx) => {
    // Re-validate stock + active inside transaction to prevent races
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
        throw new Error(`${current.name} is inactive.`);
      }
      if (current.stock < it.qty) {
        throw new Error(`Stock insufficient for ${current.name}`);
      }
    }

    const newOrder = await tx.order.create({
      data: {
        number,
        userId,
        email: body.email || "(no email)",
        fullName: body.fullName,
        phone: body.phone,
        address: body.address,
        city: body.city,
        province: body.province,
        postal: body.postal,
        notes: body.notes ?? null,
        payment: body.payment,
        paymentStatus: "pending",
        paymentProvider: body.payment === "bank_transfer" ? "bank_transfer" : null,
        paymentReference: body.payment === "bank_transfer" ? adminPaymentReference : null,
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

    // Decrement stock for catalog products only
    for (const it of validatedItems) {
      if (it.productId.startsWith("custom-")) continue;
      await tx.product.update({
        where: { slug: it.productId },
        data: { stock: { decrement: it.qty } },
      });
    }

    return newOrder;
  });

  return NextResponse.json({ ok: true, order });
}
